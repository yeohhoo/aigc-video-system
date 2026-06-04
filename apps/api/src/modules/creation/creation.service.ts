import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreationPipelineService } from './creation-pipeline.service';
import { CreateCreationDto } from './dto/create-creation.dto';
import {
  CreationAspectRatio,
  CreationLanguage,
  CreationResolution,
  CreationScene,
  CreationTask,
} from './creation.types';

@Injectable()
export class CreationService {
  private readonly tasks: CreationTask[] = [];

  constructor(private readonly pipelineService: CreationPipelineService) {}

  list(): CreationTask[] {
    return [...this.tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id: string): CreationTask {
    const task = this.tasks.find((item) => item.id === id);

    if (!task) {
      throw new NotFoundException(`Creation task ${id} not found`);
    }

    return task;
  }

  create(dto: CreateCreationDto): CreationTask {
    this.validateCreateDto(dto);

    const now = new Date().toISOString();
    const task: CreationTask = {
      id: randomUUID(),
      scriptId: dto.scriptId.trim(),
      materialId: dto.materialId.trim(),
      title: dto.title.trim(),
      status: 'pending',
      progress: 0,
      aspectRatio: dto.aspectRatio,
      resolution: dto.resolution,
      language: dto.language,
      voiceStyle: dto.voiceStyle?.trim() || undefined,
      bgmStyle: dto.bgmStyle?.trim() || undefined,
      scenes: this.createPendingScenes(dto.scriptId.trim()),
      previewUrl: undefined,
      exportUrl: undefined,
      errorMessage: undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.unshift(task);
    return task;
  }

  async start(id: string): Promise<CreationTask> {
    const task = this.getById(id);
    const now = new Date().toISOString();

    task.status = 'running';
    task.progress = 20;
    task.updatedAt = now;

    const result = await this.pipelineService.run(task);
    task.scenes = result.scenes;
    task.status = 'completed';
    task.progress = 100;
    task.previewUrl = result.previewUrl;
    task.exportUrl = result.exportUrl;
    task.errorMessage = undefined;
    task.updatedAt = new Date().toISOString();

    return task;
  }

  remove(id: string) {
    const index = this.tasks.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new NotFoundException(`Creation task ${id} not found`);
    }

    const [removed] = this.tasks.splice(index, 1);

    return {
      id: removed.id,
      deleted: true,
    };
  }

  private createPendingScenes(scriptId: string): CreationScene[] {
    return Array.from({ length: 3 }, (_, index) => ({
      id: randomUUID(),
      order: index + 1,
      scriptSceneId: `${scriptId}-scene-${index + 1}`,
      visualPrompt: `Mock visual prompt for script scene ${index + 1}`,
      narration: `Mock narration for script scene ${index + 1}`,
      imageUrl: undefined,
      videoClipUrl: undefined,
      ttsUrl: undefined,
      subtitleText: undefined,
      subtitleFileUrl: undefined,
      bgmStyle: undefined,
      bgmUrl: undefined,
      renderTrace: [],
      durationSeconds: 5,
      status: 'pending',
      provider: 'mock',
    }));
  }

  private validateCreateDto(dto: CreateCreationDto) {
    const aspectRatios: CreationAspectRatio[] = ['9:16', '16:9', '1:1'];
    const resolutions: CreationResolution[] = ['720p', '1080p'];
    const languages: CreationLanguage[] = ['zh', 'en'];

    if (!dto.scriptId?.trim()) {
      throw new BadRequestException('scriptId is required');
    }

    if (!dto.materialId?.trim()) {
      throw new BadRequestException('materialId is required');
    }

    if (!dto.title?.trim()) {
      throw new BadRequestException('title is required');
    }

    if (!aspectRatios.includes(dto.aspectRatio)) {
      throw new BadRequestException('aspectRatio must be 9:16, 16:9, or 1:1');
    }

    if (!resolutions.includes(dto.resolution)) {
      throw new BadRequestException('resolution must be 720p or 1080p');
    }

    if (!languages.includes(dto.language)) {
      throw new BadRequestException('language must be zh or en');
    }
  }
}
