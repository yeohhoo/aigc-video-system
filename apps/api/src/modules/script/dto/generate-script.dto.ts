import { ScriptGenerationMode } from '../script.types';

export class GenerateScriptDto {
  materialId!: string;
  productName!: string;
  productCategory!: string;
  sellingPoints!: string[];
  targetAudience!: string;
  usageScenario!: string;
  durationSeconds?: number;
  promptAdjustment?: string;
  mode?: ScriptGenerationMode;
  referenceVideoId?: string;
  templateId?: string;
}
