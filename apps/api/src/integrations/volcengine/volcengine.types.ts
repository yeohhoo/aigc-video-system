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

export interface VolcengineTtsRequest {
  app: {
    appid: string;
    token: string;
    cluster: string;
  };
  user: {
    uid: string;
  };
  audio: {
    voice_type: string;
    encoding: 'mp3';
    speed_ratio: number;
    rate: number;
    language: 'cn' | 'en';
  };
  request: {
    reqid: string;
    text: string;
    text_type: 'plain';
    operation: 'query';
  };
}

export interface VolcengineTtsResponse {
  code?: number;
  status_code?: number;
  message?: string;
  data?: string;
  audio?: string;
  audioUrl?: string;
  url?: string;
  result?: {
    audio?: string;
    audio_base64?: string;
    audio_url?: string;
    url?: string;
  };
  raw?: unknown;
}

export interface VolcengineTtsResult {
  audioUrl: string;
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
