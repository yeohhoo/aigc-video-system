import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { GenerateImageInput, GenerateImageOutput } from '../provider.types';
import {
  VolcengineChatImageRequest,
  VolcengineImageRequest,
  VolcengineImageResponse,
  VolcengineImageResult,
} from './volcengine.types';

type VolcengineImageProviderMode = 'auto' | 'images' | 'chat';
type ResolvedVolcengineImageProviderMode = Exclude<VolcengineImageProviderMode, 'auto'>;

@Injectable()
export class VolcengineImageService {
  private readonly defaultRegion = 'cn-beijing';
  private readonly defaultTimeoutMs = 60_000;
  private readonly logger = new Logger(VolcengineImageService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
    const apiKey =
      this.getConfigValue('VOLCENGINE_API_KEY') || this.getConfigValue('VOLCENGINE_ACCESS_TOKEN');
    const model = this.getConfigValue('VOLCENGINE_IMAGE_MODEL');

    if (!apiKey)
      throw new BadRequestException('VOLCENGINE_API_KEY is required for Volcengine Image');
    if (!model) {
      throw new BadRequestException('VOLCENGINE_IMAGE_MODEL is required for Volcengine Image');
    }

    const mode = this.resolveMode(model);
    const response = await this.requestImage(input, model, apiKey, mode);
    return this.parseResponse(response, mode, input);
  }

  parseResponseForTest(
    payload: VolcengineImageResponse | null,
    mode: ResolvedVolcengineImageProviderMode,
    input: GenerateImageInput,
  ): VolcengineImageResult {
    return this.parseResponse(payload, mode, input);
  }

  private async requestImage(
    input: GenerateImageInput,
    model: string,
    apiKey: string,
    mode: ResolvedVolcengineImageProviderMode,
  ): Promise<VolcengineImageResponse | null> {
    const endpoint = mode === 'images' ? this.buildImagesEndpoint() : this.buildChatEndpoint();
    const request =
      mode === 'images'
        ? this.buildImagesRequest(input, model)
        : this.buildChatRequest(input, model);
    const timeoutMs = this.resolveTimeoutMs();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as VolcengineImageResponse | null;
      if (!response.ok) {
        const message = payload?.error?.message || payload?.message || response.statusText;
        throw new InternalServerErrorException(
          `Volcengine Image ${mode} request failed with HTTP ${response.status}: ${message}`,
        );
      }

      this.debugPayload('Volcengine Image response payload', payload);
      return payload;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new InternalServerErrorException(
          `Volcengine Image ${mode} request timed out after ${timeoutMs}ms`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildImagesRequest(input: GenerateImageInput, model: string): VolcengineImageRequest {
    return {
      model,
      prompt: input.prompt,
      response_format: 'url',
      size: this.resolveSize(input.aspectRatio),
      n: 1,
    };
  }

  private buildChatRequest(input: GenerateImageInput, model: string): VolcengineChatImageRequest {
    return {
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an image generation model. Return one generated image URL or base64 image data. Do not return ordinary prose only.',
        },
        {
          role: 'user',
          content: [
            `Generate one ecommerce product image for this prompt: ${input.prompt}`,
            `Aspect ratio: ${input.aspectRatio}.`,
            'Return the final image as a URL, markdown image, JSON field imageUrl/url, or base64 data.',
          ].join('\n'),
        },
      ],
      temperature: 0.7,
      stream: false,
    };
  }

  private parseResponse(
    payload: VolcengineImageResponse | null,
    mode: ResolvedVolcengineImageProviderMode,
    input: GenerateImageInput,
  ): VolcengineImageResult {
    if (!payload)
      throw new InternalServerErrorException('Volcengine Image returned empty response');

    if (payload.error) {
      throw new InternalServerErrorException(
        payload.error.message || `Volcengine Image failed with code ${payload.error.code}`,
      );
    }

    const code = payload.code;
    if (code !== undefined && code !== 0 && code !== '0') {
      throw new InternalServerErrorException(
        payload.message || `Volcengine Image failed with code ${code}`,
      );
    }

    const imageUrl = this.findImageUrl(payload);
    if (imageUrl) return { imageUrl, provider: 'volcengine' };

    const imageBase64 = this.findImageBase64(payload);
    if (imageBase64) {
      return {
        imageUrl: `data:image/png;base64,${this.stripDataUrlPrefix(imageBase64)}`,
        provider: 'volcengine',
      };
    }

    for (const content of this.findTextContent(payload)) {
      const parsedFromText = this.parseImageFromText(content);
      if (parsedFromText) return { imageUrl: parsedFromText, provider: 'volcengine' };
    }

    this.debugPayload('Volcengine Image response did not include parsed image data', payload);

    if (mode === 'chat' && this.shouldFallbackChatImage()) {
      return {
        imageUrl: this.buildFallbackImageUrl(input),
        provider: 'volcengine',
      };
    }

    throw new InternalServerErrorException(
      `Volcengine Image ${mode} response did not include image data`,
    );
  }

  private findImageUrl(payload: VolcengineImageResponse): string | undefined {
    return (
      this.resolveImageUrlValue(payload.image) ??
      payload.imageUrl ??
      payload.image_url ??
      payload.data?.[0]?.url ??
      payload.data?.[0]?.image_url ??
      payload.images?.[0]?.url ??
      payload.images?.[0]?.image_url ??
      payload.image_urls?.[0] ??
      this.resolveImageUrlValue(payload.output?.image) ??
      payload.output?.images?.[0]?.url ??
      payload.output?.images?.[0]?.image_url ??
      payload.result?.url ??
      payload.result?.image_url ??
      payload.result?.data?.[0]?.url ??
      payload.result?.data?.[0]?.image_url ??
      this.findUrlInUnknown(payload)
    );
  }

  private findImageBase64(payload: VolcengineImageResponse): string | undefined {
    return (
      this.resolveImageBase64Value(payload.image) ??
      payload.b64_json ??
      payload.data?.[0]?.b64_json ??
      payload.images?.[0]?.b64_json ??
      this.resolveImageBase64Value(payload.output?.image) ??
      payload.output?.images?.[0]?.b64_json ??
      payload.result?.b64_json ??
      payload.result?.data?.[0]?.b64_json ??
      this.findBase64InUnknown(payload)
    );
  }

  private findTextContent(payload: VolcengineImageResponse): string[] {
    return [
      payload.output_text,
      payload.output?.text,
      payload.result?.content,
      ...this.extractChoiceContent(payload),
      ...this.extractToolCallArguments(payload),
    ].filter((value): value is string => Boolean(value));
  }

  private extractChoiceContent(payload: VolcengineImageResponse): string[] {
    return (
      payload.choices?.flatMap((choice) => {
        const content = choice.message?.content;
        if (!content) return [];
        if (typeof content === 'string') return [content];

        return content.flatMap((part) => {
          const imageUrl =
            typeof part.image_url === 'string' ? part.image_url : part.image_url?.url;
          return [part.text, imageUrl].filter((value): value is string => Boolean(value));
        });
      }) ?? []
    );
  }

  private extractToolCallArguments(payload: VolcengineImageResponse): string[] {
    return (
      payload.choices?.flatMap(
        (choice) =>
          choice.message?.tool_calls
            ?.map((toolCall) => toolCall.function?.arguments)
            .filter((value): value is string => Boolean(value)) ?? [],
      ) ?? []
    );
  }

  private parseImageFromText(content: string): string | undefined {
    const jsonImageUrl = this.parseImageFromJsonText(content);
    if (jsonImageUrl) return jsonImageUrl;

    const markdownImage = /!\[[^\]]*]\((?<url>https?:\/\/[^)\s]+|data:image\/[^)\s]+)\)/i.exec(
      content,
    )?.groups?.url;
    if (markdownImage) return markdownImage;

    const url = /(https?:\/\/[^\s"'<>)]*\.(?:png|jpe?g|webp|gif)(?:\?[^\s"'<>)]*)?)/i.exec(
      content,
    )?.[1];
    if (url) return url;

    const dataUrl = /(data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+)/i.exec(content)?.[1];
    if (dataUrl) return dataUrl;

    const base64 = /(?:image_base64|b64_json|base64)["'\s:：]+(?<data>[a-z0-9+/=]{120,})/i.exec(
      content,
    )?.groups?.data;
    return base64 ? `data:image/png;base64,${base64}` : undefined;
  }

  private parseImageFromJsonText(content: string): string | undefined {
    const trimmed = content
      .trim()
      .replace(/^```(?:json)?|```$/g, '')
      .trim();
    if (!trimmed.startsWith('{')) return undefined;

    try {
      const parsed = JSON.parse(trimmed) as {
        image?: string;
        imageUrl?: string;
        image_url?: string;
        url?: string;
        b64_json?: string;
        base64?: string;
      };
      if (parsed.image || parsed.imageUrl || parsed.image_url || parsed.url) {
        return parsed.image ?? parsed.imageUrl ?? parsed.image_url ?? parsed.url;
      }
      if (parsed.b64_json || parsed.base64) {
        return `data:image/png;base64,${this.stripDataUrlPrefix(parsed.b64_json ?? parsed.base64 ?? '')}`;
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  private resolveImageUrlValue(
    value:
      | string
      | {
          url?: string;
          image_url?: string;
          b64_json?: string;
        }
      | undefined,
  ): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') {
      return value.startsWith('http') || value.startsWith('data:image/') ? value : undefined;
    }
    return value.url ?? value.image_url;
  }

  private resolveImageBase64Value(
    value:
      | string
      | {
          url?: string;
          image_url?: string;
          b64_json?: string;
        }
      | undefined,
  ): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') {
      return value.startsWith('http') || value.startsWith('data:image/') ? undefined : value;
    }
    return value.b64_json;
  }

  private findUrlInUnknown(value: unknown): string | undefined {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = this.findUrlInUnknown(item);
        if (found) return found;
      }
      return undefined;
    }
    if (!value || typeof value !== 'object') return undefined;

    for (const [key, entry] of Object.entries(value)) {
      if (/image_?url|url|image/i.test(key) && typeof entry === 'string') {
        const parsed = this.parseImageFromText(entry);
        if (parsed) return parsed;
      }
      const found = this.findUrlInUnknown(entry);
      if (found) return found;
    }

    return undefined;
  }

  private findBase64InUnknown(value: unknown): string | undefined {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = this.findBase64InUnknown(item);
        if (found) return found;
      }
      return undefined;
    }
    if (!value || typeof value !== 'object') return undefined;

    for (const [key, entry] of Object.entries(value)) {
      if (/b64|base64|image/i.test(key) && typeof entry === 'string') {
        const parsed = this.parseImageFromText(entry);
        if (parsed?.startsWith('data:image/'))
          return parsed.replace(/^data:image\/[^;]+;base64,/i, '');
      }
      const found = this.findBase64InUnknown(entry);
      if (found) return found;
    }

    return undefined;
  }

  private stripDataUrlPrefix(value: string): string {
    return value.replace(/^data:image\/[^;]+;base64,/i, '');
  }

  private resolveSize(aspectRatio: GenerateImageInput['aspectRatio']): string {
    const sizes: Record<GenerateImageInput['aspectRatio'], string> = {
      '9:16': '1024x1792',
      '16:9': '1792x1024',
      '1:1': '1024x1024',
    };

    return sizes[aspectRatio];
  }

  private resolveMode(model: string): ResolvedVolcengineImageProviderMode {
    const configuredMode =
      (this.getConfigValue('VOLCENGINE_IMAGE_PROVIDER_MODE') as VolcengineImageProviderMode) ??
      'auto';
    if (configuredMode === 'images' || configuredMode === 'chat') return configuredMode;
    return model.toLowerCase().includes('seedream') ? 'images' : 'chat';
  }

  private resolveTimeoutMs(): number {
    const value = Number(this.getConfigValue('VOLCENGINE_IMAGE_TIMEOUT_MS'));
    return Number.isFinite(value) && value > 0 ? value : this.defaultTimeoutMs;
  }

  private shouldFallbackChatImage(): boolean {
    return this.getConfigValue('VOLCENGINE_IMAGE_CHAT_FALLBACK') !== 'false';
  }

  private buildFallbackImageUrl(input: GenerateImageInput): string {
    return `https://mock.local/image/volcengine-chat-fallback-${input.aspectRatio.replace(':', 'x')}-${randomUUID()}.jpg`;
  }

  private buildImagesEndpoint(): string {
    const region = this.getConfigValue('VOLCENGINE_REGION') || this.defaultRegion;
    return `https://ark.${region}.volces.com/api/v3/images/generations`;
  }

  private buildChatEndpoint(): string {
    const region = this.getConfigValue('VOLCENGINE_REGION') || this.defaultRegion;
    return `https://ark.${region}.volces.com/api/v3/chat/completions`;
  }

  private getConfigValue(key: string): string | undefined {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) return undefined;
    return value.replace(/^['"]|['"]$/g, '');
  }

  private debugPayload(message: string, payload: VolcengineImageResponse | null): void {
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
