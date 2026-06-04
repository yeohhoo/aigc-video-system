import {
  GenerateImageInput,
  GenerateImageOutput,
  GenerateSpeechInput,
  GenerateSpeechOutput,
  GenerateVideoFromImageInput,
  GenerateVideoFromTextInput,
  GenerateVideoOutput,
} from './provider.types';

export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AIProvider {
  readonly name: string;
  generateImage(input: GenerateImageInput): Promise<GenerateImageOutput>;
  generateVideoFromText(input: GenerateVideoFromTextInput): Promise<GenerateVideoOutput>;
  generateVideoFromImage(input: GenerateVideoFromImageInput): Promise<GenerateVideoOutput>;
  generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput>;
}
