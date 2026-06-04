import { MaterialType } from '../material.types';

export class CreateMaterialDto {
  title!: string;
  type!: MaterialType;
  url!: string;
  tags?: string[];
  productCategory?: string;
  description?: string;
  summary?: string;
}
