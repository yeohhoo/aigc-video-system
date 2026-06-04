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
