import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateScriptSceneDto } from './dto/create-script-scene.dto';
import { GenerateScriptDto } from './dto/generate-script.dto';
import { RegenerateScriptDto } from './dto/regenerate-script.dto';
import { UpdateScriptSceneDto } from './dto/update-script-scene.dto';
import { UpdateScriptDto } from './dto/update-script.dto';
import {
  InspirationTemplate,
  ReferenceVideo,
  Script,
  ScriptGenerationMode,
  ScriptScene,
} from './script.types';

const createdAt = '2026-06-04T00:00:00.000Z';

const referenceVideos: ReferenceVideo[] = [
  {
    id: 'ref-beauty-glow-serum',
    title: '30 秒水光精华妆前种草',
    sourcePlatform: 'TikTok',
    sourceUrl: 'https://example.com/reference/beauty-glow-serum',
    productCategory: '美妆',
    keywords: ['精华', '水光', '妆前'],
    hookPattern: '前三秒展示干纹卡粉痛点，再切到上脸光泽变化。',
    sellingPointStructure: ['痛点刺激', '成分卖点', '效果对比', '行动引导'],
    sceneBreakdown: ['素颜痛点', '质地特写', '半脸对比', '妆容完成', '瓶身定格'],
    visualStyle: ['柔光', '皮肤微距', '前后对比'],
    bgmStyle: '轻快美妆节奏',
    captionStyle: '短句大字卡，关键词高亮',
    declaredSource: 'Mock structured analysis only; no original video stored.',
    createdAt,
  },
  {
    id: 'ref-fashion-sun-shirt',
    title: '夏季防晒衣户外通勤强对比',
    sourcePlatform: 'Douyin',
    sourceUrl: 'https://example.com/reference/fashion-sun-shirt',
    productCategory: '服饰',
    keywords: ['防晒衣', '轻薄', '通勤'],
    hookPattern: '暴晒出汗和穿上后清爽形成强对比。',
    sellingPointStructure: ['场景痛点', '材质卖点', '穿搭展示', '购买理由'],
    sceneBreakdown: ['烈日痛点', '面料特写', '三套穿搭', '户外证明', '颜色展示'],
    visualStyle: ['户外自然光', '快速换装', '面料特写'],
    bgmStyle: '明亮夏日流行节奏',
    captionStyle: '蓝白清爽字幕，突出防晒和轻薄',
    declaredSource: 'Mock structured analysis only; no original video stored.',
    createdAt,
  },
  {
    id: 'ref-home-storage-box',
    title: '家居收纳盒前后整理效果',
    sourcePlatform: 'Xiaohongshu',
    sourceUrl: 'https://example.com/reference/home-storage-box',
    productCategory: '家居',
    keywords: ['收纳', '整理', '厨房'],
    hookPattern: '先展示杂乱抽屉，再一镜到底展示整理完成。',
    sellingPointStructure: ['杂乱痛点', '容量展示', '分类方式', '前后对比'],
    sceneBreakdown: ['杂乱俯拍', '尺寸展示', '分类放入', '前后对比', '整洁定格'],
    visualStyle: ['俯拍', '治愈整理', '暖色家居'],
    bgmStyle: '舒缓治愈轻音乐',
    captionStyle: '步骤型字幕，数字编号',
    declaredSource: 'Mock structured analysis only; no original video stored.',
    createdAt,
  },
  {
    id: 'ref-digital-earbuds',
    title: '降噪耳机地铁场景测评',
    sourcePlatform: 'YouTube Shorts',
    sourceUrl: 'https://example.com/reference/digital-earbuds',
    productCategory: '数码',
    keywords: ['耳机', '降噪', '通勤'],
    hookPattern: '地铁噪音切到安静听感，制造听觉反差。',
    sellingPointStructure: ['环境噪音', '一键降噪', '音质说明', '续航推荐'],
    sceneBreakdown: ['噪声字幕', '佩戴动作', '按键展示', '听歌表情', '收纳盒特写'],
    visualStyle: ['冷色科技感', '产品微距', '城市通勤'],
    bgmStyle: '电子节奏，降噪瞬间做音效断点',
    captionStyle: '科技蓝字幕，参数卡片化',
    declaredSource: 'Mock structured analysis only; no original video stored.',
    createdAt,
  },
  {
    id: 'ref-outdoor-camping-lamp',
    title: '露营灯夜晚氛围感种草',
    sourcePlatform: 'Instagram Reels',
    sourceUrl: 'https://example.com/reference/outdoor-camping-lamp',
    productCategory: '户外',
    keywords: ['露营灯', '氛围', '续航'],
    hookPattern: '黑暗营地一秒点亮，直接展示氛围变化。',
    sellingPointStructure: ['黑暗痛点', '亮度效果', '续航安全', '氛围收束'],
    sceneBreakdown: ['暗场开头', '点亮瞬间', '帐篷使用', '手持移动', '夜景定格'],
    visualStyle: ['夜景暖光', '露营氛围', '慢镜头'],
    bgmStyle: '温暖 Lo-fi 或轻民谣',
    captionStyle: '小字氛围字幕，突出亮度和续航',
    declaredSource: 'Mock structured analysis only; no original video stored.',
    createdAt,
  },
];

const templates: InspirationTemplate[] = [
  {
    id: 'tpl-first-person-experience',
    name: '第一人称沉浸式体验',
    productCategory: '通用',
    strategy: '第一人称沉浸式体验',
    factors: {
      opening: '用用户视角进入真实使用场景。',
      visualFocus: '手部动作、使用路径和即时反馈。',
      narrationStyle: '像朋友分享一样自然口播。',
      transition: '跟随动作切换场景。',
      ending: '用一句体验结论收束。',
      bgm: '轻快生活方式音乐。',
      caption: '第一人称短句字幕。',
    },
    suitableFor: ['美妆', '家居', '户外'],
    createdAt,
  },
  {
    id: 'tpl-pain-contrast',
    name: '强对比痛点展示',
    productCategory: '通用',
    strategy: '强对比痛点展示',
    factors: {
      opening: '先放大没有产品时的麻烦。',
      visualFocus: '前后效果对比和痛点特写。',
      narrationStyle: '直接点出问题，再给解决方案。',
      transition: '用左右分屏或一键切换。',
      ending: '强调改善结果和行动引导。',
      bgm: '前三秒强节奏，转折处停顿。',
      caption: '痛点词红色，高价值词高亮。',
    },
    suitableFor: ['服饰', '数码', '家居'],
    createdAt,
  },
  {
    id: 'tpl-scene-seeding',
    name: '场景种草',
    productCategory: '通用',
    strategy: '场景种草',
    factors: {
      opening: '用高频生活场景建立代入感。',
      visualFocus: '商品自然融入场景。',
      narrationStyle: '少参数，多体验收益。',
      transition: '从场景到细节再回到整体。',
      ending: '用适用人群做转化提示。',
      bgm: '轻松生活化节奏。',
      caption: '场景词和人群词突出。',
    },
    suitableFor: ['服饰', '户外', '家居'],
    createdAt,
  },
  {
    id: 'tpl-unboxing-review',
    name: '开箱测评',
    productCategory: '通用',
    strategy: '开箱测评',
    factors: {
      opening: '展示包装和第一眼惊喜。',
      visualFocus: '开箱、配件、细节、试用。',
      narrationStyle: '客观测评加轻种草。',
      transition: '按开箱步骤推进。',
      ending: '总结适合谁、不适合谁。',
      bgm: '清爽测评类节奏。',
      caption: '信息卡片式字幕。',
    },
    suitableFor: ['数码', '美妆', '户外'],
    createdAt,
  },
  {
    id: 'tpl-before-after',
    name: '前后效果对比',
    productCategory: '通用',
    strategy: '前后效果对比',
    factors: {
      opening: '先给 Before 结果制造期待。',
      visualFocus: '同角度、同光线的前后变化。',
      narrationStyle: '短句解释变化原因。',
      transition: '分屏、遮罩或快速擦除。',
      ending: '用结果定格强化记忆。',
      bgm: '转场点清晰的轻节奏。',
      caption: 'Before/After 标签明确。',
    },
    suitableFor: ['美妆', '家居', '服饰'],
    createdAt,
  },
];

@Injectable()
export class ScriptService {
  private readonly scripts: Script[] = [];

  listReferences(): ReferenceVideo[] {
    return referenceVideos;
  }

  getReferenceById(id: string): ReferenceVideo {
    const reference = referenceVideos.find((item) => item.id === id);
    if (!reference) throw new NotFoundException(`Reference video ${id} not found`);
    return reference;
  }

  listTemplates(): InspirationTemplate[] {
    return templates;
  }

  getTemplateById(id: string): InspirationTemplate {
    const template = templates.find((item) => item.id === id);
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    return template;
  }

  list(): Script[] {
    return [...this.scripts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id: string): Script {
    const script = this.scripts.find((item) => item.id === id);
    if (!script) throw new NotFoundException(`Script ${id} not found`);
    return script;
  }

  generate(dto: GenerateScriptDto): Script {
    this.validateGenerateDto(dto);
    const durationSeconds = this.normalizeDuration(dto.durationSeconds);
    const sellingPoints = this.normalizeSellingPoints(dto.sellingPoints);
    const mode = dto.mode ?? 'auto_strategy';
    const reference =
      mode === 'hot_video_remix' ? this.resolveReference(dto.referenceVideoId) : undefined;
    const template = this.resolveTemplateForMode(mode, dto.templateId, dto.productCategory);
    const visualStyle = this.resolveVisualStyle(dto.promptAdjustment?.trim(), reference, template);
    const scenes = this.createScenes(
      dto,
      sellingPoints,
      durationSeconds,
      visualStyle,
      mode,
      reference,
      template,
    );
    const now = new Date().toISOString();
    const script: Script = {
      id: randomUUID(),
      title: `${dto.productName.trim()} ${durationSeconds}s 带货短视频剧本`,
      materialId: dto.materialId.trim(),
      productName: dto.productName.trim(),
      productCategory: dto.productCategory.trim(),
      targetAudience: dto.targetAudience.trim(),
      sellingPoints,
      usageScenario: dto.usageScenario.trim(),
      durationSeconds,
      narrativeFramework: this.resolveNarrativeFramework(mode, reference, template),
      visualStyle,
      constraints: [
        '总时长不超过 15 秒',
        '每个分镜只突出一个核心信息',
        '不保存或复用原参考视频内容，仅使用结构化分析结果',
      ],
      scenes,
      status: 'generated',
      mode,
      referenceVideoId: reference?.id,
      templateId: template?.id,
      createdAt: now,
      updatedAt: now,
    };
    this.scripts.unshift(script);
    return script;
  }

  update(id: string, dto: UpdateScriptDto): Script {
    const script = this.getById(id);
    if (dto.title !== undefined) script.title = dto.title.trim();
    if (dto.visualStyle !== undefined) script.visualStyle = dto.visualStyle.trim();
    if (dto.narrativeFramework !== undefined)
      script.narrativeFramework = dto.narrativeFramework.trim();
    if (dto.targetAudience !== undefined) script.targetAudience = dto.targetAudience.trim();
    if (dto.sellingPoints !== undefined)
      script.sellingPoints = dto.sellingPoints.map((item) => item.trim()).filter(Boolean);
    if (dto.constraints !== undefined)
      script.constraints = dto.constraints.map((item) => item.trim()).filter(Boolean);
    script.updatedAt = new Date().toISOString();
    return script;
  }

  addScene(id: string, dto: CreateScriptSceneDto): Script {
    const script = this.getById(id);
    this.validateSceneDto(dto);
    script.scenes.push({
      id: randomUUID(),
      order: script.scenes.length + 1,
      title: dto.title.trim(),
      narration: dto.narration.trim(),
      visualPrompt: dto.visualPrompt.trim(),
      cameraMovement: dto.cameraMovement.trim(),
      bgmSuggestion: dto.bgmSuggestion.trim(),
      caption: dto.caption.trim(),
      durationSeconds: this.normalizeDuration(dto.durationSeconds),
      linkedMaterialSliceIds: [],
      constraints: ['人工新增分镜', '保持商品主体清晰'],
    });
    this.reorderScenes(script);
    script.updatedAt = new Date().toISOString();
    return script;
  }

  updateScene(id: string, sceneId: string, dto: UpdateScriptSceneDto): Script {
    const script = this.getById(id);
    const scene = this.getScene(script, sceneId);
    if (dto.narration !== undefined) scene.narration = dto.narration.trim();
    if (dto.visualPrompt !== undefined) scene.visualPrompt = dto.visualPrompt.trim();
    if (dto.cameraMovement !== undefined) scene.cameraMovement = dto.cameraMovement.trim();
    if (dto.bgmSuggestion !== undefined) scene.bgmSuggestion = dto.bgmSuggestion.trim();
    if (dto.caption !== undefined) scene.caption = dto.caption.trim();
    if (dto.durationSeconds !== undefined)
      scene.durationSeconds = this.normalizeDuration(dto.durationSeconds);
    script.updatedAt = new Date().toISOString();
    return script;
  }

  removeScene(id: string, sceneId: string) {
    const script = this.getById(id);
    const index = script.scenes.findIndex((scene) => scene.id === sceneId);
    if (index === -1) throw new NotFoundException(`Script scene ${sceneId} not found`);
    script.scenes.splice(index, 1);
    this.reorderScenes(script);
    script.updatedAt = new Date().toISOString();
    return { deleted: true };
  }

  regenerate(id: string, dto: RegenerateScriptDto): Script {
    const source = this.getById(id);
    const now = new Date().toISOString();
    const promptAdjustment = dto.promptAdjustment?.trim();
    const visualStyle = dto.factorReplacement?.visualStyle ?? source.visualStyle;
    const bgmStyle = dto.factorReplacement?.bgmStyle;
    const captionStyle = dto.factorReplacement?.captionStyle;
    const scenes = source.scenes.map((scene) => ({
      ...scene,
      id: randomUUID(),
      narration: promptAdjustment
        ? `${scene.narration} 调整：${promptAdjustment}`
        : scene.narration,
      visualPrompt: `${visualStyle}。${scene.visualPrompt}`,
      bgmSuggestion: bgmStyle ?? scene.bgmSuggestion,
      caption: captionStyle ? `${captionStyle}：${scene.caption}` : scene.caption,
      constraints: [...scene.constraints, '由规则模板快速重生成'],
    }));
    const script: Script = {
      ...source,
      id: randomUUID(),
      title: `${source.title} - 干预重生成`,
      visualStyle,
      constraints: [
        ...source.constraints,
        promptAdjustment ? `Prompt 微调：${promptAdjustment}` : '未使用 Prompt 微调',
        bgmStyle ? `BGM 因子替换：${bgmStyle}` : 'BGM 因子保持不变',
        captionStyle ? `字幕因子替换：${captionStyle}` : '字幕因子保持不变',
      ],
      scenes,
      createdAt: now,
      updatedAt: now,
    };
    this.scripts.unshift(script);
    return script;
  }

  remove(id: string) {
    const index = this.scripts.findIndex((item) => item.id === id);
    if (index === -1) throw new NotFoundException(`Script ${id} not found`);
    const [removed] = this.scripts.splice(index, 1);
    return { id: removed.id, deleted: true };
  }

  private createScenes(
    dto: GenerateScriptDto,
    sellingPoints: string[],
    durationSeconds: number,
    visualStyle: string,
    mode: ScriptGenerationMode,
    reference?: ReferenceVideo,
    template?: InspirationTemplate,
  ): ScriptScene[] {
    const sceneCount = Math.min(5, Math.max(3, sellingPoints.length + 2));
    const durations = this.allocateSceneDurations(durationSeconds, sceneCount);
    const titles = reference?.sceneBreakdown ?? [
      '场景钩子',
      '卖点展示',
      '场景证明',
      '细节强化',
      '行动引导',
    ];
    return Array.from({ length: sceneCount }, (_, index) => {
      const point = sellingPoints[index - 1] ?? sellingPoints[index] ?? sellingPoints[0];
      const isEnd = index === sceneCount - 1;
      return {
        id: randomUUID(),
        order: index + 1,
        title: titles[index] ?? `分镜 ${index + 1}`,
        narration: isEnd
          ? `如果你也在${dto.usageScenario}，可以试试${dto.productName}。`
          : `${dto.productName}的${point}，对${dto.targetAudience}会更直观。`,
        visualPrompt: `${visualStyle}。商品：${dto.productName}。场景：${dto.usageScenario}。`,
        cameraMovement:
          mode === 'hot_video_remix'
            ? '参考爆款节奏快速切换，但不复用原视频画面'
            : (template?.factors.transition ?? '从场景到商品细节自然转场'),
        bgmSuggestion:
          template?.factors.bgm ??
          reference?.bgmStyle ??
          this.resolveBgmSuggestion(dto.promptAdjustment),
        caption: index === 0 ? (reference?.hookPattern ?? template?.strategy ?? point) : point,
        durationSeconds: durations[index],
        linkedMaterialSliceIds: [],
        constraints: ['画面主体保持商品可识别', '字幕不遮挡核心商品信息'],
      };
    });
  }

  private getScene(script: Script, sceneId: string): ScriptScene {
    const scene = script.scenes.find((item) => item.id === sceneId);
    if (!scene) throw new NotFoundException(`Script scene ${sceneId} not found`);
    return scene;
  }

  private reorderScenes(script: Script) {
    script.scenes.forEach((scene, index) => {
      scene.order = index + 1;
    });
  }

  private validateSceneDto(dto: CreateScriptSceneDto) {
    if (!dto.title?.trim()) throw new BadRequestException('title is required');
    if (!dto.narration?.trim()) throw new BadRequestException('narration is required');
    if (!dto.visualPrompt?.trim()) throw new BadRequestException('visualPrompt is required');
    if (!dto.cameraMovement?.trim()) throw new BadRequestException('cameraMovement is required');
    if (!dto.bgmSuggestion?.trim()) throw new BadRequestException('bgmSuggestion is required');
    if (!dto.caption?.trim()) throw new BadRequestException('caption is required');
  }

  private resolveReference(referenceVideoId?: string): ReferenceVideo {
    if (!referenceVideoId)
      throw new BadRequestException('referenceVideoId is required for hot_video_remix mode');
    return this.getReferenceById(referenceVideoId);
  }

  private resolveTemplateForMode(
    mode: ScriptGenerationMode,
    templateId?: string,
    productCategory?: string,
  ) {
    if (mode === 'hot_video_remix') return undefined;
    if (mode === 'template_based') {
      if (!templateId)
        throw new BadRequestException('templateId is required for template_based mode');
      return this.getTemplateById(templateId);
    }
    return (
      templates.find((template) => template.suitableFor.includes(productCategory ?? '')) ??
      templates[0]
    );
  }

  private resolveNarrativeFramework(
    mode: ScriptGenerationMode,
    reference?: ReferenceVideo,
    template?: InspirationTemplate,
  ): string {
    if (mode === 'hot_video_remix' && reference)
      return `参考爆款结构：${reference.sellingPointStructure.join(' -> ')}`;
    if (template) return `模板策略：${template.strategy}`;
    return '痛点引入 -> 卖点证明 -> 场景种草 -> 行动引导';
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
    return Math.min(15, Math.max(3, Math.floor(durationSeconds ?? 15)));
  }

  private normalizeSellingPoints(sellingPoints: string[]): string[] {
    return sellingPoints.map((point) => point.trim()).filter(Boolean);
  }

  private resolveVisualStyle(
    promptAdjustment?: string,
    reference?: ReferenceVideo,
    template?: InspirationTemplate,
  ): string {
    if (reference)
      return `参考风格：${reference.visualStyle.join('、')}；字幕：${reference.captionStyle}`;
    if (template)
      return `模板风格：${template.strategy}；视觉重点：${template.factors.visualFocus}`;
    if (!promptAdjustment) return '明亮干净的电商短视频风格';
    if (promptAdjustment.includes('高级'))
      return '克制高级、质感光影、低饱和但商品清晰的短视频风格';
    if (promptAdjustment.toLowerCase().includes('tiktok'))
      return '节奏更快、前三秒强钩子、适合 TikTok Shop 的竖屏短视频风格';
    if (promptAdjustment.includes('活泼')) return '色彩轻快、节奏活泼、贴近年轻用户的短视频风格';
    return `符合“${promptAdjustment}”的电商短视频风格`;
  }

  private resolveBgmSuggestion(promptAdjustment?: string): string {
    if (!promptAdjustment) return '轻快但不喧宾夺主的电商节奏音乐';
    if (promptAdjustment.includes('高级')) return '低频柔和、节奏克制的高级感电子音乐';
    if (promptAdjustment.toLowerCase().includes('tiktok') || promptAdjustment.includes('活泼'))
      return '鼓点清晰、适合短视频前三秒抓注意力的流行节奏';
    return `贴合“${promptAdjustment}”的短视频背景音乐`;
  }

  private validateGenerateDto(dto: GenerateScriptDto) {
    const modes: ScriptGenerationMode[] = ['hot_video_remix', 'template_based', 'auto_strategy'];
    if (dto.mode && !modes.includes(dto.mode))
      throw new BadRequestException(
        'mode must be hot_video_remix, template_based, or auto_strategy',
      );
    if (!dto.materialId?.trim()) throw new BadRequestException('materialId is required');
    if (!dto.productName?.trim()) throw new BadRequestException('productName is required');
    if (!dto.productCategory?.trim()) throw new BadRequestException('productCategory is required');
    if (!dto.targetAudience?.trim()) throw new BadRequestException('targetAudience is required');
    if (!dto.usageScenario?.trim()) throw new BadRequestException('usageScenario is required');
    if (this.normalizeSellingPoints(dto.sellingPoints ?? []).length === 0)
      throw new BadRequestException('sellingPoints is required');
  }
}
