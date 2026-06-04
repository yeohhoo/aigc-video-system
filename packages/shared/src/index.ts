export type MaterialType = 'image' | 'video' | 'reference';

export type MaterialStatus = 'uploaded' | 'processing' | 'ready' | 'failed';

export interface MaterialSlice {
  id: string;
  startTime?: number;
  endTime?: number;
  description?: string;
}

export interface Material {
  id: string;
  title: string;
  type: MaterialType;
  status: MaterialStatus;
  url: string;
  tags: string[];
  productCategory?: string;
  description?: string;
  summary?: string;
  slices: MaterialSlice[];
  embeddingId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialDto {
  title: string;
  type: MaterialType;
  url: string;
  tags?: string[];
  productCategory?: string;
  description?: string;
  summary?: string;
}

export interface MaterialSummary {
  id: string;
  title: string;
  type: MaterialType;
  status: MaterialStatus;
  tags: string[];
}

export type ScriptStatus = 'draft' | 'generated' | 'ready' | 'failed';

export type ScriptGenerationMode = 'hot_video_remix' | 'template_based' | 'auto_strategy';

export interface ReferenceVideo {
  id: string;
  title: string;
  sourcePlatform: string;
  sourceUrl: string;
  productCategory: string;
  keywords: string[];
  hookPattern: string;
  sellingPointStructure: string[];
  sceneBreakdown: string[];
  visualStyle: string[];
  bgmStyle: string;
  captionStyle: string;
  declaredSource: string;
  createdAt: string;
}

export interface InspirationTemplateFactors {
  opening: string;
  visualFocus: string;
  narrationStyle: string;
  transition: string;
  ending: string;
  bgm: string;
  caption: string;
}

export interface InspirationTemplate {
  id: string;
  name: string;
  productCategory: string;
  strategy: string;
  factors: InspirationTemplateFactors;
  suitableFor: string[];
  createdAt: string;
}

export interface ScriptScene {
  id: string;
  order: number;
  title: string;
  narration: string;
  visualPrompt: string;
  cameraMovement: string;
  bgmSuggestion: string;
  caption: string;
  durationSeconds: number;
  linkedMaterialSliceIds: string[];
  constraints: string[];
}

export interface Script {
  id: string;
  title: string;
  materialId: string;
  productName: string;
  productCategory: string;
  targetAudience: string;
  sellingPoints: string[];
  usageScenario: string;
  durationSeconds: number;
  narrativeFramework: string;
  visualStyle: string;
  constraints: string[];
  scenes: ScriptScene[];
  status: ScriptStatus;
  mode?: ScriptGenerationMode;
  referenceVideoId?: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateScriptDto {
  materialId: string;
  productName: string;
  productCategory: string;
  sellingPoints: string[];
  targetAudience: string;
  usageScenario: string;
  durationSeconds?: number;
  promptAdjustment?: string;
  mode?: ScriptGenerationMode;
  referenceVideoId?: string;
  templateId?: string;
}

export interface ScriptSummary {
  id: string;
  title: string;
  productName: string;
  status: ScriptStatus;
  durationSeconds: number;
  createdAt: string;
}

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

export interface CreateCreationDto {
  scriptId: string;
  materialId: string;
  title: string;
  aspectRatio: CreationAspectRatio;
  resolution: CreationResolution;
  language: CreationLanguage;
  voiceStyle?: string;
  bgmStyle?: string;
}

export interface CreationTaskSummary {
  id: string;
  title: string;
  materialId: string;
  scriptId: string;
  status: CreationStatus;
  progress: number;
}
