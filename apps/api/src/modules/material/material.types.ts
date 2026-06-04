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
