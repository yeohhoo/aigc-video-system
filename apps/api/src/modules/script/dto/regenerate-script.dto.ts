export interface ScriptFactorReplacement {
  visualStyle?: string;
  bgmStyle?: string;
  captionStyle?: string;
}

export class RegenerateScriptDto {
  promptAdjustment?: string;
  factorReplacement?: ScriptFactorReplacement;
}
