export type ProviderType = 'mock' | 'volcengine';

export type ProviderAspectRatio = '9:16' | '16:9' | '1:1';

export type ProviderLanguage = 'zh' | 'en';

export interface GenerateImageInput {
  prompt: string;
  aspectRatio: ProviderAspectRatio;
}

export interface GenerateImageOutput {
  imageUrl: string;
  provider?: ProviderType;
}

export interface GenerateVideoFromTextInput {
  prompt: string;
  durationSeconds: number;
  aspectRatio?: ProviderAspectRatio;
}

export interface GenerateVideoOutput {
  videoUrl: string;
  provider?: ProviderType;
}

export interface GenerateVideoFromImageInput {
  imageUrl: string;
  prompt: string;
  durationSeconds?: number;
  aspectRatio?: ProviderAspectRatio;
}

export interface GenerateSpeechInput {
  text: string;
  language: ProviderLanguage;
  voiceStyle?: string;
}

export interface GenerateSpeechOutput {
  audioUrl: string;
}
