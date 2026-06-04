import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, AIProvider } from '../../integrations/provider.interface';
import { CreationScene, CreationTask, RenderTrace } from './creation.types';

interface PipelineResult {
  scenes: CreationScene[];
  previewUrl: string;
  exportUrl: string;
}

@Injectable()
export class CreationPipelineService {
  constructor(@Inject(AI_PROVIDER) private readonly provider: AIProvider) {}

  async run(task: CreationTask): Promise<PipelineResult> {
    const scenes: CreationScene[] = [];

    for (const scene of task.scenes) {
      scenes.push(await this.renderScene(task, scene));
    }

    const finalVideo = this.composeFinalVideo(task);

    return {
      scenes,
      previewUrl: finalVideo.previewUrl,
      exportUrl: finalVideo.exportUrl,
    };
  }

  private async renderScene(task: CreationTask, scene: CreationScene): Promise<CreationScene> {
    const renderTrace: RenderTrace[] = [];

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

    const subtitle = this.generateSubtitle(task, scene);

    await this.trace(renderTrace, 'generateVideo', async () =>
      this.provider.generateVideoFromImage({
        imageUrl: image.imageUrl,
        prompt: scene.visualPrompt,
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
      videoClipUrl: segment.videoClipUrl,
      ttsUrl: speech.audioUrl,
      subtitleText: subtitle.subtitleText,
      subtitleFileUrl: subtitle.subtitleFileUrl,
      bgmStyle: task.bgmStyle ?? 'default ecommerce bgm',
      bgmUrl: `https://mock.local/audio/bgm-${task.id}-${scene.order}.mp3`,
      renderTrace,
    };
  }

  private async trace<T>(
    traces: RenderTrace[],
    step: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const startedAt = new Date().toISOString();
    const result = await operation();
    traces.push({
      provider: this.provider.name,
      step,
      status: 'completed',
      startedAt,
      finishedAt: new Date().toISOString(),
    });
    return result;
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

  private generateSubtitle(task: CreationTask, scene: CreationScene) {
    const subtitleText = scene.narration
      .split(/[，。,.]/)
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
