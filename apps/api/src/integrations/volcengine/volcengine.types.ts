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
