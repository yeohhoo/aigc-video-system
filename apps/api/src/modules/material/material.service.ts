import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { Material, MaterialType } from './material.types';

@Injectable()
export class MaterialService {
  private readonly materials: Material[] = [
    {
      id: randomUUID(),
      title: '夏季防晒衣商品图',
      type: 'image',
      status: 'ready',
      url: 'https://example.com/materials/sun-protection-shirt.jpg',
      tags: ['服饰', '夏季', '防晒'],
      productCategory: '服饰鞋包',
      description: '用于首版流程联调的商品主图素材。',
      summary: '轻薄透气、防晒场景明确，可用于带货视频开场画面。',
      slices: [],
      embeddingId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  list(): Material[] {
    return [...this.materials].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id: string): Material {
    const material = this.materials.find((item) => item.id === id);

    if (!material) {
      throw new NotFoundException(`Material ${id} not found`);
    }

    return material;
  }

  create(dto: CreateMaterialDto): Material {
    this.validateCreateDto(dto);

    const now = new Date().toISOString();
    const material: Material = {
      id: randomUUID(),
      title: dto.title.trim(),
      type: dto.type,
      status: 'uploaded',
      url: dto.url.trim(),
      tags: dto.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
      productCategory: dto.productCategory?.trim() || undefined,
      description: dto.description?.trim() || undefined,
      summary: dto.summary?.trim() || undefined,
      slices: [],
      embeddingId: null,
      createdAt: now,
      updatedAt: now,
    };

    this.materials.unshift(material);
    return material;
  }

  remove(id: string) {
    const index = this.materials.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new NotFoundException(`Material ${id} not found`);
    }

    const [removed] = this.materials.splice(index, 1);

    return {
      id: removed.id,
      deleted: true,
    };
  }

  private validateCreateDto(dto: CreateMaterialDto) {
    const allowedTypes: MaterialType[] = ['image', 'video', 'reference'];

    if (!dto.title?.trim()) {
      throw new BadRequestException('title is required');
    }

    if (!allowedTypes.includes(dto.type)) {
      throw new BadRequestException('type must be image, video, or reference');
    }

    if (!dto.url?.trim()) {
      throw new BadRequestException('url is required');
    }
  }
}
