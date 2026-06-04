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
