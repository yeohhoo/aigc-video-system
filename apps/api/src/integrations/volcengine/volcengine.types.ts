export interface TextToImageRequest {
  prompt: string;
  width?: number;
  height?: number;
}

export interface TextToVideoRequest {
  prompt: string;
  durationSeconds?: number;
}

export interface ImageToVideoRequest {
  imageUrl: string;
  prompt?: string;
  durationSeconds?: number;
}

export interface TextToSpeechRequest {
  text: string;
  voice?: string;
  speed?: number;
}

export interface VolcengineRequest {
  operation: string;
  endpoint: string;
  apiKeyConfigured: boolean;
  payload: unknown;
}

export interface VolcengineResponse {
  provider: string;
  operation: string;
  url: string;
  raw: unknown;
}
