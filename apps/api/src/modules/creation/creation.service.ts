import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { ProviderType } from '../../integrations/provider.types';
import { CreationPipelineService } from './creation-pipeline.service';
import { CreateCreationDto } from './dto/create-creation.dto';
import {
  CreationAspectRatio,
  CreationDiagnostics,
  CreationLanguage,
  CreationResolution,
  CreationScene,
  CreationStatus,
  CreationTask,
  TaskTrace,
} from './creation.types';

@Injectable()
export class CreationService {
  private readonly tasks: CreationTask[] = [];
  private readonly timers = new Map<string, Array<ReturnType<typeof setTimeout>>>();

  constructor(
    private readonly pipelineService: CreationPipelineService,
    private readonly configService: ConfigService,
  ) {}

  list(): CreationTask[] {
    return [...this.tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id: string): CreationTask {
    const task = this.tasks.find((item) => item.id === id);
    if (!task) throw new NotFoundException(`Creation task ${id} not found`);
    return task;
  }

  getProgress(id: string) {
    const task = this.getById(id);
    return {
      id: task.id,
      status: task.status,
      progress: task.progress,
    };
  }

  getTraces(id: string): TaskTrace[] {
    return this.getById(id).traces;
  }

  getDiagnostics(id: string): CreationDiagnostics {
    const task = this.getById(id);
    const stepDurations = task.traces.map((trace) => ({
      step: trace.step,
      durationMs: this.durationMs(trace.startedAt, trace.finishedAt),
      status: trace.status,
    }));
    const totalDurationMs =
      task.traces.length > 0
        ? this.durationMs(task.traces[0].startedAt, task.traces[task.traces.length - 1].finishedAt)
        : 0;

    return {
      taskId: task.id,
      totalDurationMs,
      stepDurations,
      failed: task.status === 'failed',
      errorMessage: task.errorMessage,
      provider: task.scenes.find((scene) => scene.provider)?.provider ?? 'mock',
    };
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
      traces: [],
      previewUrl: undefined,
      exportUrl: undefined,
      errorMessage: undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.unshift(task);
    return task;
  }

  start(id: string): CreationTask {
    const task = this.getById(id);
    if (task.status !== 'pending') {
      throw new BadRequestException('Only pending tasks can be started');
    }
    this.enqueue(task);
    return task;
  }

  retry(id: string): CreationTask {
    const task = this.getById(id);
    if (task.status !== 'failed') {
      throw new BadRequestException('Only failed tasks can be retried');
    }
    this.clearTimers(task.id);
    task.progress = 0;
    task.errorMessage = undefined;
    task.previewUrl = undefined;
    task.exportUrl = undefined;
    task.scenes = this.createPendingScenes(task.scriptId);
    task.traces = [];
    this.enqueue(task);
    return task;
  }

  cancel(id: string): CreationTask {
    const task = this.getById(id);
    if (!['pending', 'queued'].includes(task.status)) {
      throw new BadRequestException('Only pending or queued tasks can be canceled');
    }
    this.clearTimers(task.id);
    task.status = 'canceled';
    task.updatedAt = new Date().toISOString();
    this.addTrace(task, 'mock-queue', 'cancel', 'canceled', 'Task canceled by user.');
    return task;
  }

  remove(id: string) {
    const index = this.tasks.findIndex((item) => item.id === id);
    if (index === -1) throw new NotFoundException(`Creation task ${id} not found`);
    const [removed] = this.tasks.splice(index, 1);
    this.clearTimers(removed.id);
    return { id: removed.id, deleted: true };
  }

  private enqueue(task: CreationTask) {
    this.clearTimers(task.id);
    task.status = 'queued';
    task.progress = 0;
    task.updatedAt = new Date().toISOString();
    this.addTrace(task, 'mock-queue', 'queue', 'queued', 'Task entered in-memory queue.');

    const timers = [
      setTimeout(() => this.markRunning(task.id, 20), 250),
      setTimeout(() => this.advanceRunning(task.id, 40), 500),
      setTimeout(() => this.advanceRunning(task.id, 60), 750),
      setTimeout(() => this.advanceRunning(task.id, 80), 1000),
      setTimeout(() => void this.completeTask(task.id), 1250),
    ];
    this.timers.set(task.id, timers);
  }

  private markRunning(id: string, progress: number) {
    const task = this.getById(id);
    if (task.status !== 'queued') return;
    task.status = 'running';
    task.progress = progress;
    task.updatedAt = new Date().toISOString();
    this.addTrace(task, 'mock-worker', 'queue', 'running', `Task progress reached ${progress}%.`);
  }

  private advanceRunning(id: string, progress: number) {
    const task = this.getById(id);
    if (task.status !== 'running') return;
    const bypassFailure = task.title.toLowerCase().includes('smoke');
    if (!bypassFailure && this.shouldInjectMockFailure()) {
      this.failTask(task, `Mock provider failure at ${progress}%.`);
      return;
    }
    task.progress = progress;
    task.updatedAt = new Date().toISOString();
    this.addTrace(task, 'mock-worker', 'queue', 'running', `Task progress reached ${progress}%.`);
  }

  private async completeTask(id: string) {
    const task = this.getById(id);
    if (task.status !== 'running') return;
    try {
      const result = await this.pipelineService.run(task);
      task.scenes = result.scenes;
      task.traces.push(...result.traces);
      task.status = 'completed';
      task.progress = 100;
      task.previewUrl = result.previewUrl;
      task.exportUrl = result.exportUrl;
      task.errorMessage = undefined;
      task.updatedAt = new Date().toISOString();
    } catch (error) {
      this.failTask(task, error instanceof Error ? error.message : 'Pipeline failed');
    }
  }

  private failTask(task: CreationTask, message: string) {
    task.status = 'failed';
    task.errorMessage = message;
    task.updatedAt = new Date().toISOString();
    this.addTrace(task, 'mock-worker', 'failure', 'failed', message);
    this.clearTimers(task.id);
  }

  private addTrace(
    task: CreationTask,
    provider: string,
    step: string,
    status: CreationStatus,
    message: string,
  ) {
    const now = new Date().toISOString();
    task.traces.push({
      id: randomUUID(),
      taskId: task.id,
      provider,
      step,
      status,
      message,
      startedAt: now,
      finishedAt: now,
    });
  }

  private clearTimers(id: string) {
    this.timers.get(id)?.forEach((timer) => clearTimeout(timer));
    this.timers.delete(id);
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

  private durationMs(startedAt: string, finishedAt: string): number {
    return Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime());
  }

  private shouldInjectMockFailure(): boolean {
    const providerType = this.configService.get<ProviderType>('PROVIDER_TYPE') ?? 'mock';
    return providerType === 'mock' && Math.random() < 0.1;
  }

  private validateCreateDto(dto: CreateCreationDto) {
    const aspectRatios: CreationAspectRatio[] = ['9:16', '16:9', '1:1'];
    const resolutions: CreationResolution[] = ['720p', '1080p'];
    const languages: CreationLanguage[] = ['zh', 'en'];

    if (!dto.scriptId?.trim()) throw new BadRequestException('scriptId is required');
    if (!dto.materialId?.trim()) throw new BadRequestException('materialId is required');
    if (!dto.title?.trim()) throw new BadRequestException('title is required');
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
