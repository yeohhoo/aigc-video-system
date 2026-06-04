export type CreationStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'canceled';

export type CreationAspectRatio = '9:16' | '16:9' | '1:1';

export type CreationResolution = '720p' | '1080p';

export type CreationLanguage = 'zh' | 'en';

export interface RenderTrace {
  provider: string;
  step: string;
  status: CreationStatus;
  startedAt: string;
  finishedAt: string;
}

export interface TaskTrace {
  id: string;
  taskId: string;
  provider: string;
  step: string;
  status: CreationStatus;
  message: string;
  startedAt: string;
  finishedAt: string;
}

export interface CreationDiagnostics {
  taskId: string;
  totalDurationMs: number;
  stepDurations: Array<{
    step: string;
    durationMs: number;
    status: CreationStatus;
  }>;
  failed: boolean;
  errorMessage?: string;
  provider: string;
}

export interface CreationScene {
  id: string;
  order: number;
  scriptSceneId: string;
  visualPrompt: string;
  narration: string;
  imageUrl?: string;
  videoClipUrl?: string;
  ttsUrl?: string;
  subtitleText?: string;
  subtitleFileUrl?: string;
  bgmStyle?: string;
  bgmUrl?: string;
  renderTrace: RenderTrace[];
  durationSeconds: number;
  status: CreationStatus;
  provider: string;
}

export interface CreationTask {
  id: string;
  scriptId: string;
  materialId: string;
  title: string;
  status: CreationStatus;
  progress: number;
  aspectRatio: CreationAspectRatio;
  resolution: CreationResolution;
  language: CreationLanguage;
  voiceStyle?: string;
  bgmStyle?: string;
  scenes: CreationScene[];
  traces: TaskTrace[];
  previewUrl?: string;
  exportUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
