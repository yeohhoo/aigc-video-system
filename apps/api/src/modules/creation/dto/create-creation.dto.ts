import { CreationAspectRatio, CreationLanguage, CreationResolution } from '../creation.types';

export class CreateCreationDto {
  scriptId!: string;
  materialId!: string;
  title!: string;
  aspectRatio!: CreationAspectRatio;
  resolution!: CreationResolution;
  language!: CreationLanguage;
  voiceStyle?: string;
  bgmStyle?: string;
}
