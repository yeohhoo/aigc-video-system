import { Injectable } from '@nestjs/common';
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
import { VolcengineVideoService } from './volcengine-video.service';

@Injectable()
export class VolcengineProvider implements AIProvider {
  readonly name = 'volcengine';

  constructor(
    private readonly volcengineImageService: VolcengineImageService,
    private readonly volcengineTtsService: VolcengineTtsService,
    private readonly volcengineVideoService: VolcengineVideoService,
  ) {}

  async generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
    return this.volcengineImageService.generateImage(input);
  }

  async generateVideoFromText(input: GenerateVideoFromTextInput): Promise<GenerateVideoOutput> {
    return this.volcengineVideoService.generateVideoFromText(input);
  }

  async generateVideoFromImage(input: GenerateVideoFromImageInput): Promise<GenerateVideoOutput> {
    return this.volcengineVideoService.generateVideoFromImage(input);
  }

  async generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
    return this.volcengineTtsService.generateSpeech(input);
  }
}
