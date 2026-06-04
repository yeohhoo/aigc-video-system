export type MaterialType = 'product-image' | 'detail-image' | 'brand-asset' | 'reference-video';

export interface MaterialSummary {
  id: string;
  name: string;
  type: MaterialType;
}

export interface ScriptSummary {
  id: string;
  title: string;
  productName: string;
}

export type CreationTaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface CreationTaskSummary {
  id: string;
  title: string;
  materialId: string;
  scriptId: string;
  status: CreationTaskStatus;
}
