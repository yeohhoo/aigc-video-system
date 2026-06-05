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

export interface VolcengineImageRequest {
  model: string;
  prompt: string;
  response_format: 'url' | 'b64_json';
  size: string;
  n: number;
}

export interface VolcengineChatImageRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user';
    content: string;
  }>;
  temperature: number;
  stream: false;
}

export interface VolcengineImageResponse {
  code?: number | string;
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
  image?:
    | string
    | {
        url?: string;
        image_url?: string;
        b64_json?: string;
      };
  imageUrl?: string;
  image_url?: string;
  b64_json?: string;
  output_text?: string;
  output?: {
    text?: string;
    image?:
      | string
      | {
          url?: string;
          image_url?: string;
          b64_json?: string;
        };
    images?: Array<{
      url?: string;
      image_url?: string;
      b64_json?: string;
    }>;
  };
  data?: Array<{
    url?: string;
    image_url?: string;
    b64_json?: string;
  }>;
  images?: Array<{
    url?: string;
    image_url?: string;
    b64_json?: string;
  }>;
  image_urls?: string[];
  result?: {
    url?: string;
    image_url?: string;
    b64_json?: string;
    content?: string;
    data?: Array<{
      url?: string;
      image_url?: string;
      b64_json?: string;
    }>;
  };
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
            image_url?:
              | string
              | {
                  url?: string;
                };
          }>;
      tool_calls?: Array<{
        function?: {
          arguments?: string;
        };
      }>;
    };
  }>;
}

export interface VolcengineImageResult {
  imageUrl: string;
  provider: 'volcengine';
}

export interface VolcengineVideoRequest {
  model: string;
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
  duration?: number;
  aspect_ratio?: string;
}

export interface VolcengineVideoResponse {
  code?: number | string;
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
  id?: string;
  task_id?: string;
  status?: string;
  url?: string;
  videoUrl?: string;
  video_url?: string;
  output?: {
    video_url?: string;
    url?: string;
    task_id?: string;
  };
  result?: {
    video_url?: string;
    url?: string;
    task_id?: string;
  };
  data?: {
    video_url?: string;
    url?: string;
    task_id?: string;
  };
  content?: string;
}

export interface VolcengineVideoResult {
  videoUrl: string;
  provider: 'volcengine';
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
