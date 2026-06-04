export class GenerateScriptDto {
  materialId!: string;
  productName!: string;
  productCategory!: string;
  sellingPoints!: string[];
  targetAudience!: string;
  usageScenario!: string;
  durationSeconds?: number;
  promptAdjustment?: string;
}
