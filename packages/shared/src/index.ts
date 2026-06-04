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
}

export interface ScriptSummary {
  id: string;
  title: string;
  productName: string;
  status: ScriptStatus;
  durationSeconds: number;
  createdAt: string;
}

export type CreationTaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface CreationTaskSummary {
  id: string;
  title: string;
  materialId: string;
  scriptId: string;
  status: CreationTaskStatus;
}
