import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AI_PROVIDER, AIProvider } from '../../integrations/provider.interface';
import { CreationScene, CreationTask, RenderTrace, TaskTrace } from './creation.types';

interface PipelineResult {
  scenes: CreationScene[];
  previewUrl: string;
  exportUrl: string;
  traces: TaskTrace[];
}

export class CreationPipelineError extends Error {
  constructor(
    message: string,
    readonly traces: TaskTrace[],
    readonly scenes: CreationScene[] = [],
  ) {
    super(message);
  }
}

@Injectable()
export class CreationPipelineService {
  constructor(@Inject(AI_PROVIDER) private readonly provider: AIProvider) {}

  async run(task: CreationTask): Promise<PipelineResult> {
    const scenes: CreationScene[] = [];
    const traces: TaskTrace[] = [];

    try {
      for (const scene of task.scenes) {
        const rendered = await this.renderScene(task, scene);
        scenes.push(rendered);
        traces.push(...this.toTaskTraces(task.id, rendered.renderTrace));
      }
    } catch (error) {
      if (error instanceof CreationPipelineError) {
        traces.push(...error.traces);
        throw new CreationPipelineError(error.message, traces, scenes);
      }
      throw error;
    }

    const finalVideo = this.traceTaskSync(task.id, 'composeFinalVideo', 'mock-composer', () =>
      this.composeFinalVideo(task),
    );

    return {
      scenes,
      previewUrl: finalVideo.previewUrl,
      exportUrl: finalVideo.exportUrl,
      traces: [
        ...traces,
        {
          id: randomUUID(),
          taskId: task.id,
          provider: 'mock-composer',
          step: 'composeFinalVideo',
          status: 'completed',
          message: '最终视频已合成，并生成 mock 预览地址与导出地址。',
          startedAt: finalVideo.startedAt,
          finishedAt: finalVideo.finishedAt,
        },
      ],
    };
  }

  private async renderScene(task: CreationTask, scene: CreationScene): Promise<CreationScene> {
    const renderTrace: RenderTrace[] = [];

    try {
      const image = await this.trace(renderTrace, 'generateImage', async () =>
        this.provider.generateImage({
          prompt: scene.visualPrompt,
          aspectRatio: task.aspectRatio,
        }),
      );

      const speech = await this.trace(renderTrace, 'generateSpeech', async () =>
        this.provider.generateSpeech({
          text: scene.narration,
          language: task.language,
          voiceStyle: task.voiceStyle,
        }),
      );

      const subtitle = this.traceSync(renderTrace, 'generateSubtitle', () =>
        this.generateSubtitle(task, scene),
      );

      const video = await this.trace(renderTrace, 'generateVideoFromImage', async () =>
        this.provider.generateVideoFromImage({
          imageUrl: image.imageUrl,
          prompt: scene.visualPrompt,
          durationSeconds: scene.durationSeconds,
          aspectRatio: task.aspectRatio,
        }),
      );

      const segment = this.traceSync(renderTrace, 'composeSegment', () =>
        this.composeSegment(task, scene),
      );

      return {
        ...scene,
        status: 'completed',
        provider: this.provider.name,
        imageUrl: image.imageUrl,
        videoClipUrl: video.videoUrl || segment.videoClipUrl,
        ttsUrl: speech.audioUrl,
        subtitleText: subtitle.subtitleText,
        subtitleFileUrl: subtitle.subtitleFileUrl,
        bgmStyle: task.bgmStyle ?? '默认电商背景音乐',
        bgmUrl: `https://mock.local/audio/bgm-${task.id}-${scene.order}.mp3`,
        renderTrace,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pipeline 分镜渲染失败';
      throw new CreationPipelineError(message, this.toTaskTraces(task.id, renderTrace));
    }
  }

  private async trace<T>(
    traces: RenderTrace[],
    step: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const startedAt = new Date().toISOString();
    try {
      const result = await operation();
      traces.push({
        provider: this.provider.name,
        step,
        status: 'completed',
        startedAt,
        finishedAt: new Date().toISOString(),
      });
      return result;
    } catch (error) {
      traces.push({
        provider: this.provider.name,
        step,
        status: 'failed',
        startedAt,
        finishedAt: new Date().toISOString(),
      });
      throw error;
    }
  }

  private traceSync<T>(traces: RenderTrace[], step: string, operation: () => T): T {
    const startedAt = new Date().toISOString();
    const result = operation();
    traces.push({
      provider: 'mock-composer',
      step,
      status: 'completed',
      startedAt,
      finishedAt: new Date().toISOString(),
    });
    return result;
  }

  private traceTaskSync<T extends object>(
    taskId: string,
    step: string,
    provider: string,
    operation: () => T,
  ): T & { startedAt: string; finishedAt: string } {
    const startedAt = new Date().toISOString();
    const result = operation();
    return {
      ...result,
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }

  private toTaskTraces(taskId: string, traces: RenderTrace[]): TaskTrace[] {
    return traces.map((trace) => ({
      id: randomUUID(),
      taskId,
      provider: trace.provider,
      step: trace.step,
      status: trace.status,
      message: `${trace.provider} 执行 ${trace.step}，状态：${trace.status}。`,
      startedAt: trace.startedAt,
      finishedAt: trace.finishedAt,
    }));
  }

  private generateSubtitle(task: CreationTask, scene: CreationScene) {
    const subtitleText = scene.narration
      .split(/[，。！？,.!?]/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');

    return {
      subtitleText,
      subtitleFileUrl: `https://mock.local/subtitle/${task.id}-scene-${scene.order}.srt`,
    };
  }

  private composeSegment(task: CreationTask, scene: CreationScene) {
    return {
      videoClipUrl: `https://mock.local/video/segment-${task.id}-scene-${scene.order}.mp4`,
    };
  }

  private composeFinalVideo(task: CreationTask) {
    return {
      previewUrl: `https://mock.local/video/preview-${task.id}.mp4`,
      exportUrl: `https://mock.local/video/final-${task.id}-${task.resolution}.mp4`,
    };
  }
}
