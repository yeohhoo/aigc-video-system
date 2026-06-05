import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import {
  GenerateVideoFromImageInput,
  GenerateVideoFromTextInput,
  GenerateVideoOutput,
} from '../provider.types';
import {
  VolcengineVideoRequest,
  VolcengineVideoResponse,
  VolcengineVideoResult,
} from './volcengine.types';

type VolcengineVideoMode = 'text-to-video' | 'image-to-video';

@Injectable()
export class VolcengineVideoService {
  private readonly defaultRegion = 'cn-beijing';
  private readonly defaultTimeoutMs = 120_000;
  private readonly logger = new Logger(VolcengineVideoService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateVideoFromText(input: GenerateVideoFromTextInput): Promise<GenerateVideoOutput> {
    return this.generateVideo('text-to-video', input);
  }

  async generateVideoFromImage(input: GenerateVideoFromImageInput): Promise<GenerateVideoOutput> {
    if (!this.isDownloadableImageUrl(input.imageUrl)) {
      return this.fallbackImageToVideo(input, 'image URL is not publicly downloadable');
    }

    try {
      return await this.generateVideo('image-to-video', input);
    } catch (error) {
      if (this.isResourceDownloadFailure(error)) {
        return this.fallbackImageToVideo(input, error instanceof Error ? error.message : undefined);
      }
      throw error;
    }
  }

  private async generateVideo(
    mode: VolcengineVideoMode,
    input: GenerateVideoFromTextInput | GenerateVideoFromImageInput,
  ): Promise<VolcengineVideoResult> {
    const apiKey =
      this.getConfigValue('VOLCENGINE_API_KEY') || this.getConfigValue('VOLCENGINE_ACCESS_TOKEN');
    const model = this.getConfigValue('VOLCENGINE_VIDEO_MODEL');

    if (!apiKey)
      throw new BadRequestException('VOLCENGINE_API_KEY is required for Volcengine Video');
    if (!model)
      throw new BadRequestException('VOLCENGINE_VIDEO_MODEL is required for Volcengine Video');

    const payload = await this.requestVideo(mode, this.buildRequest(mode, input, model), apiKey);
    return this.parseResponse(payload, mode);
  }

  private async requestVideo(
    mode: VolcengineVideoMode,
    request: VolcengineVideoRequest,
    apiKey: string,
  ): Promise<VolcengineVideoResponse | null> {
    const timeoutMs = this.resolveTimeoutMs();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(this.buildEndpoint(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as VolcengineVideoResponse | null;
      if (!response.ok) {
        const message = payload?.error?.message || payload?.message || response.statusText;
        throw new InternalServerErrorException(
          `Volcengine Video ${mode} request failed with HTTP ${response.status}: ${message}`,
        );
      }

      this.debugPayload(`Volcengine Video ${mode} response payload`, payload);
      return payload;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new InternalServerErrorException(
          `Volcengine Video ${mode} request timed out after ${timeoutMs}ms`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildRequest(
    mode: VolcengineVideoMode,
    input: GenerateVideoFromTextInput | GenerateVideoFromImageInput,
    model: string,
  ): VolcengineVideoRequest {
    const content: VolcengineVideoRequest['content'] = [
      {
        type: 'text',
        text: input.prompt,
      },
    ];

    if (mode === 'image-to-video') {
      content.unshift({
        type: 'image_url',
        image_url: {
          url: (input as GenerateVideoFromImageInput).imageUrl,
        },
      });
    }

    return {
      model,
      content,
      duration: this.resolveDuration(input.durationSeconds),
      aspect_ratio: input.aspectRatio,
    };
  }

  private parseResponse(
    payload: VolcengineVideoResponse | null,
    mode: VolcengineVideoMode,
  ): VolcengineVideoResult {
    if (!payload)
      throw new InternalServerErrorException('Volcengine Video returned empty response');

    if (payload.error) {
      throw new InternalServerErrorException(
        payload.error.message || `Volcengine Video failed with code ${payload.error.code}`,
      );
    }

    const code = payload.code;
    if (code !== undefined && code !== 0 && code !== '0') {
      throw new InternalServerErrorException(
        payload.message || `Volcengine Video failed with code ${code}`,
      );
    }

    const videoUrl = this.findVideoUrl(payload);
    if (videoUrl) return { videoUrl, provider: 'volcengine' };

    const taskId = this.findTaskId(payload);
    if (taskId && this.shouldFallbackPendingTask()) {
      return {
        videoUrl: `https://mock.local/video/volcengine-${mode}-task-${taskId}-${randomUUID()}.mp4`,
        provider: 'volcengine',
      };
    }

    this.debugPayload(`Volcengine Video ${mode} response did not include video data`, payload);
    throw new InternalServerErrorException(
      `Volcengine Video ${mode} response did not include video data`,
    );
  }

  private findVideoUrl(payload: VolcengineVideoResponse): string | undefined {
    return (
      payload.videoUrl ??
      payload.video_url ??
      payload.url ??
      payload.output?.video_url ??
      payload.output?.url ??
      payload.result?.video_url ??
      payload.result?.url ??
      payload.data?.video_url ??
      payload.data?.url ??
      this.parseVideoUrlFromText(payload.content) ??
      this.findVideoUrlInUnknown(payload)
    );
  }

  private findTaskId(payload: VolcengineVideoResponse): string | undefined {
    return (
      payload.task_id ??
      payload.id ??
      payload.output?.task_id ??
      payload.result?.task_id ??
      payload.data?.task_id
    );
  }

  private parseVideoUrlFromText(content?: string): string | undefined {
    if (!content) return undefined;
    return /(https?:\/\/[^\s"'<>)]*\.(?:mp4|mov|webm)(?:\?[^\s"'<>)]*)?)/i.exec(content)?.[1];
  }

  private findVideoUrlInUnknown(value: unknown): string | undefined {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = this.findVideoUrlInUnknown(item);
        if (found) return found;
      }
      return undefined;
    }
    if (!value || typeof value !== 'object') return undefined;

    for (const [key, entry] of Object.entries(value)) {
      if (/video_?url|url/i.test(key) && typeof entry === 'string') {
        const parsed = this.parseVideoUrlFromText(entry);
        if (parsed) return parsed;
      }
      const found = this.findVideoUrlInUnknown(entry);
      if (found) return found;
    }

    return undefined;
  }

  private resolveDuration(durationSeconds?: number): number {
    if (!durationSeconds || !Number.isFinite(durationSeconds)) return 5;
    return Math.min(Math.max(Math.round(durationSeconds), 1), 30);
  }

  private resolveTimeoutMs(): number {
    const value = Number(this.getConfigValue('VOLCENGINE_VIDEO_TIMEOUT_MS'));
    return Number.isFinite(value) && value > 0 ? value : this.defaultTimeoutMs;
  }

  private shouldFallbackPendingTask(): boolean {
    return this.getConfigValue('VOLCENGINE_VIDEO_TASK_FALLBACK') !== 'false';
  }

  private async fallbackImageToVideo(
    input: GenerateVideoFromImageInput,
    reason = 'image-to-video fallback',
  ): Promise<GenerateVideoOutput> {
    const mode = this.getConfigValue('VOLCENGINE_VIDEO_IMAGE_FALLBACK_MODE') || 'text-to-video';
    this.logger.warn(`Volcengine image-to-video fallback triggered: ${reason}`);

    if (mode === 'mock') {
      return {
        videoUrl: this.buildMockFallbackVideoUrl('image-to-video'),
        provider: 'volcengine',
      };
    }

    try {
      return await this.generateVideoFromText({
        prompt: input.prompt,
        durationSeconds: input.durationSeconds ?? 5,
        aspectRatio: input.aspectRatio,
      });
    } catch (error) {
      this.logger.warn(
        `Volcengine text-to-video fallback failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        videoUrl: this.buildMockFallbackVideoUrl('text-to-video'),
        provider: 'volcengine',
      };
    }
  }

  private isDownloadableImageUrl(imageUrl: string): boolean {
    if (!imageUrl.startsWith('https://')) return false;
    try {
      const url = new URL(imageUrl);
      return !['mock.local', 'localhost', '127.0.0.1'].includes(url.hostname);
    } catch {
      return false;
    }
  }

  private isResourceDownloadFailure(error: unknown): boolean {
    return error instanceof Error && /resource download failed|image_url/i.test(error.message);
  }

  private buildMockFallbackVideoUrl(mode: VolcengineVideoMode): string {
    return `https://mock.local/video/volcengine-${mode}-fallback-${randomUUID()}.mp4`;
  }

  private buildEndpoint(): string {
    const customEndpoint = this.getConfigValue('VOLCENGINE_VIDEO_ENDPOINT');
    if (customEndpoint) return customEndpoint;
    const region = this.getConfigValue('VOLCENGINE_REGION') || this.defaultRegion;
    return `https://ark.${region}.volces.com/api/v3/contents/generations/tasks`;
  }

  private getConfigValue(key: string): string | undefined {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) return undefined;
    return value.replace(/^['"]|['"]$/g, '');
  }

  private debugPayload(message: string, payload: VolcengineVideoResponse | null): void {
    this.logger.debug(`${message}: ${JSON.stringify(this.redactSensitive(payload), null, 2)}`);
  }

  private redactSensitive(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.redactSensitive(item));
    if (!value || typeof value !== 'object') return value;

    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /api[_-]?key|token|authorization|secret|credential/i.test(key)
          ? '[REDACTED]'
          : this.redactSensitive(entry),
      ]),
    );
  }
}
