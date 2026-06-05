import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { AIProvider } from '../provider.interface';
import {
  GenerateImageInput,
  GenerateImageOutput,
  GenerateSpeechInput,
  GenerateSpeechOutput,
  GenerateVideoFromImageInput,
  GenerateVideoFromTextInput,
  GenerateVideoOutput,
} from '../provider.types';
import { VolcengineImageService } from './volcengine-image.service';
import { VolcengineTtsService } from './volcengine-tts.service';
import { VolcengineRequest, VolcengineResponse } from './volcengine.types';

@Injectable()
export class VolcengineProvider implements AIProvider {
  readonly name = 'volcengine';

  constructor(
    private readonly configService: ConfigService,
    private readonly volcengineImageService: VolcengineImageService,
    private readonly volcengineTtsService: VolcengineTtsService,
  ) {}

  async generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
    return this.volcengineImageService.generateImage(input);
  }

  async generateVideoFromText(input: GenerateVideoFromTextInput): Promise<GenerateVideoOutput> {
    const response = this.parseResponse(
      this.buildRequest('text-to-video', input),
      `https://mock.local/video/volcengine-${randomUUID()}.mp4`,
    );

    return {
      videoUrl: response.url,
    };
  }

  async generateVideoFromImage(input: GenerateVideoFromImageInput): Promise<GenerateVideoOutput> {
    const response = this.parseResponse(
      this.buildRequest('image-to-video', input),
      `https://mock.local/video/volcengine-${randomUUID()}.mp4`,
    );

    return {
      videoUrl: response.url,
    };
  }

  async generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
    return this.volcengineTtsService.generateSpeech(input);
  }

  private buildRequest(operation: string, payload: unknown): VolcengineRequest {
    return {
      operation,
      endpoint: this.configService.get<string>('VOLCENGINE_ENDPOINT') ?? '',
      apiKeyConfigured: Boolean(this.configService.get<string>('VOLCENGINE_API_KEY')),
      payload,
    };
  }

  private parseResponse(request: VolcengineRequest, mockUrl: string): VolcengineResponse {
    // TODO: Replace this parser with real Volcengine OpenAPI response mapping.
    // TODO: Use request.endpoint and signed auth headers when enabling real calls.
    return {
      provider: this.name,
      operation: request.operation,
      url: mockUrl,
      raw: {
        mocked: true,
        endpoint: request.endpoint,
        apiKeyConfigured: request.apiKeyConfigured,
      },
    };
  }
}
