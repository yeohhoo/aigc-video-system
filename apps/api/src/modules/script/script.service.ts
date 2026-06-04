import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { GenerateScriptDto } from './dto/generate-script.dto';
import { Script, ScriptScene } from './script.types';

@Injectable()
export class ScriptService {
  private readonly scripts: Script[] = [];

  list(): Script[] {
    return [...this.scripts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id: string): Script {
    const script = this.scripts.find((item) => item.id === id);

    if (!script) {
      throw new NotFoundException(`Script ${id} not found`);
    }

    return script;
  }

  generate(dto: GenerateScriptDto): Script {
    this.validateGenerateDto(dto);

    const durationSeconds = this.normalizeDuration(dto.durationSeconds);
    const sellingPoints = this.normalizeSellingPoints(dto.sellingPoints);
    const promptAdjustment = dto.promptAdjustment?.trim();
    const visualStyle = this.resolveVisualStyle(promptAdjustment);
    const scenes = this.createScenes(dto, sellingPoints, durationSeconds, visualStyle);
    const now = new Date().toISOString();
    const script: Script = {
      id: randomUUID(),
      title: `${dto.productName.trim()} ${durationSeconds}秒带货短视频剧本`,
      materialId: dto.materialId.trim(),
      productName: dto.productName.trim(),
      productCategory: dto.productCategory.trim(),
      targetAudience: dto.targetAudience.trim(),
      sellingPoints,
      usageScenario: dto.usageScenario.trim(),
      durationSeconds,
      narrativeFramework: '痛点引入 -> 卖点证明 -> 场景种草 -> 行动引导',
      visualStyle,
      constraints: [
        '总时长不超过 15 秒',
        '每个分镜只突出一个核心信息',
        '口播短句优先，适合移动端静音字幕浏览',
        '本阶段不调用真实大模型、视频生成或素材切片能力',
        promptAdjustment ? `风格调整：${promptAdjustment}` : '保持清晰直接的电商转化表达',
      ],
      scenes,
      status: 'generated',
      createdAt: now,
      updatedAt: now,
    };

    this.scripts.unshift(script);
    return script;
  }

  remove(id: string) {
    const index = this.scripts.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new NotFoundException(`Script ${id} not found`);
    }

    const [removed] = this.scripts.splice(index, 1);

    return {
      id: removed.id,
      deleted: true,
    };
  }

  private createScenes(
    dto: GenerateScriptDto,
    sellingPoints: string[],
    durationSeconds: number,
    visualStyle: string,
  ): ScriptScene[] {
    const sceneCount = Math.min(5, Math.max(3, sellingPoints.length + 2));
    const durations = this.allocateSceneDurations(durationSeconds, sceneCount);
    const productName = dto.productName.trim();
    const targetAudience = dto.targetAudience.trim();
    const usageScenario = dto.usageScenario.trim();
    const promptAdjustment = dto.promptAdjustment?.trim();
    const scenePlans = [
      {
        title: '场景痛点开场',
        narration: `${targetAudience}在${usageScenario}里，最怕体验不够顺手。`,
        visualPrompt: `${visualStyle}，展示${targetAudience}在${usageScenario}中的真实使用前情，突出问题瞬间。`,
        cameraMovement: '快速推近主体，制造第一秒注意力',
        caption: `${usageScenario}也能更轻松`,
      },
      {
        title: '核心卖点展示',
        narration: `${productName}主打${sellingPoints[0]}，一眼就能看出差异。`,
        visualPrompt: `${visualStyle}，商品主体居中，突出${sellingPoints[0]}的细节和质感。`,
        cameraMovement: '轻微环绕加特写切入',
        caption: sellingPoints[0],
      },
      {
        title: '场景化证明',
        narration: `用在${usageScenario}，${sellingPoints[1] ?? sellingPoints[0]}会更直观。`,
        visualPrompt: `${visualStyle}，商品融入${usageScenario}，让${targetAudience}看到实际效果。`,
        cameraMovement: '从环境过渡到商品使用结果',
        caption: sellingPoints[1] ?? sellingPoints[0],
      },
      {
        title: '补充卖点强化',
        narration: `${sellingPoints[2] ?? sellingPoints[0]}，让日常使用更省心。`,
        visualPrompt: `${visualStyle}，通过前后对比或细节拆解强化商品价值。`,
        cameraMovement: '左右对比转场',
        caption: sellingPoints[2] ?? sellingPoints[0],
      },
      {
        title: '行动引导收束',
        narration: `想让${usageScenario}更有质感，可以试试${productName}。`,
        visualPrompt: `${visualStyle}，商品定格在干净背景中，保留电商转化空间。`,
        cameraMovement: '缓慢拉远并定格',
        caption: `现在了解 ${productName}`,
      },
    ];

    return scenePlans.slice(0, sceneCount).map((plan, index) => ({
      id: randomUUID(),
      order: index + 1,
      title: plan.title,
      narration: promptAdjustment ? `${plan.narration} ${promptAdjustment}。` : plan.narration,
      visualPrompt: plan.visualPrompt,
      cameraMovement: plan.cameraMovement,
      bgmSuggestion: this.resolveBgmSuggestion(promptAdjustment),
      caption: plan.caption,
      durationSeconds: durations[index],
      linkedMaterialSliceIds: [],
      constraints: [
        '画面主体保持商品可识别',
        '字幕不遮挡核心商品信息',
        '不使用夸大功效或无法证明的绝对化表达',
      ],
    }));
  }

  private allocateSceneDurations(totalSeconds: number, sceneCount: number): number[] {
    const base = Math.floor(totalSeconds / sceneCount);
    let remainder = totalSeconds - base * sceneCount;

    return Array.from({ length: sceneCount }, () => {
      const duration = base + (remainder > 0 ? 1 : 0);
      remainder -= 1;
      return duration;
    });
  }

  private normalizeDuration(durationSeconds?: number): number {
    if (!durationSeconds) {
      return 15;
    }

    return Math.min(15, Math.max(3, Math.floor(durationSeconds)));
  }

  private normalizeSellingPoints(sellingPoints: string[]): string[] {
    return sellingPoints.map((point) => point.trim()).filter(Boolean);
  }

  private resolveVisualStyle(promptAdjustment?: string): string {
    if (!promptAdjustment) {
      return '明亮干净的电商短视频风格';
    }

    if (promptAdjustment.includes('高级')) {
      return '克制高级、质感光影、低饱和但商品清晰的短视频风格';
    }

    if (promptAdjustment.toLowerCase().includes('tiktok')) {
      return '节奏更快、前三秒强钩子、适合 TikTok Shop 的竖屏短视频风格';
    }

    if (promptAdjustment.includes('活泼')) {
      return '色彩轻快、节奏活泼、贴近年轻用户的短视频风格';
    }

    return `符合“${promptAdjustment}”的电商短视频风格`;
  }

  private resolveBgmSuggestion(promptAdjustment?: string): string {
    if (!promptAdjustment) {
      return '轻快但不喧宾夺主的电商节奏音乐';
    }

    if (promptAdjustment.includes('高级')) {
      return '低频柔和、节奏克制的高级感电子音乐';
    }

    if (promptAdjustment.toLowerCase().includes('tiktok') || promptAdjustment.includes('活泼')) {
      return '鼓点清晰、适合短视频前三秒抓注意力的流行节奏';
    }

    return `贴合“${promptAdjustment}”的短视频背景音乐`;
  }

  private validateGenerateDto(dto: GenerateScriptDto) {
    if (!dto.materialId?.trim()) {
      throw new BadRequestException('materialId is required');
    }

    if (!dto.productName?.trim()) {
      throw new BadRequestException('productName is required');
    }

    if (!dto.productCategory?.trim()) {
      throw new BadRequestException('productCategory is required');
    }

    if (!dto.targetAudience?.trim()) {
      throw new BadRequestException('targetAudience is required');
    }

    if (!dto.usageScenario?.trim()) {
      throw new BadRequestException('usageScenario is required');
    }

    if (this.normalizeSellingPoints(dto.sellingPoints ?? []).length === 0) {
      throw new BadRequestException('sellingPoints is required');
    }
  }
}
