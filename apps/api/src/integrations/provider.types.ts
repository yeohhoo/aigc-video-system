export type ProviderType = 'mock' | 'volcengine';

export type ProviderAspectRatio = '9:16' | '16:9' | '1:1';

export type ProviderLanguage = 'zh' | 'en';

export interface GenerateImageInput {
  prompt: string;
  aspectRatio: ProviderAspectRatio;
}

export interface GenerateImageOutput {
  imageUrl: string;
}

export interface GenerateVideoFromTextInput {
  prompt: string;
  durationSeconds: number;
}

export interface GenerateVideoOutput {
  videoUrl: string;
}

export interface GenerateVideoFromImageInput {
  imageUrl: string;
  prompt: string;
}

export interface GenerateSpeechInput {
  text: string;
  language: ProviderLanguage;
  voiceStyle?: string;
}

export interface GenerateSpeechOutput {
  audioUrl: string;
}
