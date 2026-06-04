import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AIProvider } from '../provider.interface';
import { GenerateImageOutput, GenerateSpeechOutput, GenerateVideoOutput } from '../provider.types';

@Injectable()
export class MockProvider implements AIProvider {
  readonly name = 'mock';

  async generateImage(): Promise<GenerateImageOutput> {
    return {
      imageUrl: `https://mock.local/image/${randomUUID()}.jpg`,
    };
  }

  async generateVideoFromText(): Promise<GenerateVideoOutput> {
    return {
      videoUrl: `https://mock.local/video/${randomUUID()}.mp4`,
    };
  }

  async generateVideoFromImage(): Promise<GenerateVideoOutput> {
    return {
      videoUrl: `https://mock.local/video/${randomUUID()}.mp4`,
    };
  }

  async generateSpeech(): Promise<GenerateSpeechOutput> {
    return {
      audioUrl: `https://mock.local/audio/${randomUUID()}.mp3`,
    };
  }
}
