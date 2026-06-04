import { FormEvent, useEffect, useMemo, useState } from 'react';
import type {
  GenerateScriptDto,
  InspirationTemplate,
  ReferenceVideo,
  Script,
  ScriptGenerationMode,
  ScriptScene,
} from '@aigc-video/shared';

interface SceneForm {
  title: string;
  narration: string;
  visualPrompt: string;
  cameraMovement: string;
  bgmSuggestion: string;
  caption: string;
  durationSeconds: number;
}

const emptyForm: GenerateScriptDto = {
  materialId: '',
  productName: '',
  productCategory: '',
  sellingPoints: [],
  targetAudience: '',
  usageScenario: '',
  durationSeconds: 15,
  promptAdjustment: '',
  mode: 'auto_strategy',
  referenceVideoId: '',
  templateId: '',
};

const emptySceneForm: SceneForm = {
  title: '',
  narration: '',
  visualPrompt: '',
  cameraMovement: '',
  bgmSuggestion: '',
  caption: '',
  durationSeconds: 3,
};

const modeLabels: Record<ScriptGenerationMode, string> = {
  auto_strategy: '自动策略',
  hot_video_remix: '参考视频复刻',
  template_based: '灵感模板',
};

export function ScriptPanel() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [references, setReferences] = useState<ReferenceVideo[]>([]);
  const [templates, setTemplates] = useState<InspirationTemplate[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [selectedReference, setSelectedReference] = useState<ReferenceVideo | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<InspirationTemplate | null>(null);
  const [form, setForm] = useState<GenerateScriptDto>(emptyForm);
  const [sellingPointInput, setSellingPointInput] = useState('');
  const [scriptEdit, setScriptEdit] = useState({
    title: '',
    targetAudience: '',
    sellingPoints: '',
  });
  const [sceneForm, setSceneForm] = useState<SceneForm>(emptySceneForm);
  const [promptAdjustment, setPromptAdjustment] = useState('');
  const [factorReplacement, setFactorReplacement] = useState({
    visualStyle: '',
    bgmStyle: '',
    captionStyle: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scriptCountText = useMemo(() => `${scripts.length} 个剧本`, [scripts.length]);

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedScript) {
      setScriptEdit({
        title: selectedScript.title,
        targetAudience: selectedScript.targetAudience,
        sellingPoints: selectedScript.sellingPoints.join(', '),
      });
    }
  }, [selectedScript]);

  async function loadInitialData() {
    setIsLoading(true);
    setError(null);
    try {
      const [scriptResponse, referenceResponse, templateResponse] = await Promise.all([
        fetch('/api/scripts'),
        fetch('/api/scripts/references'),
        fetch('/api/scripts/templates'),
      ]);
      if (!scriptResponse.ok || !referenceResponse.ok || !templateResponse.ok) {
        throw new Error('剧本资源获取失败');
      }
      const scriptData = (await scriptResponse.json()) as Script[];
      const referenceData = (await referenceResponse.json()) as ReferenceVideo[];
      const templateData = (await templateResponse.json()) as InspirationTemplate[];
      setScripts(scriptData);
      setReferences(referenceData);
      setTemplates(templateData);
      setSelectedScript((current) => current ?? scriptData[0] ?? null);
      setSelectedReference((current) => current ?? referenceData[0] ?? null);
      setSelectedTemplate((current) => current ?? templateData[0] ?? null);
      setForm((current) => ({
        ...current,
        referenceVideoId: current.referenceVideoId || referenceData[0]?.id || '',
        templateId: current.templateId || templateData[0]?.id || '',
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '剧本资源获取失败');
    } finally {
      setIsLoading(false);
    }
  }

  async function requestScript(url: string, init: RequestInit) {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    if (!response.ok) {
      throw new Error('剧本操作失败');
    }
    const updated = (await response.json()) as Script;
    setSelectedScript(updated);
    setScripts((current) => {
      const exists = current.some((script) => script.id === updated.id);
      return exists
        ? current.map((script) => (script.id === updated.id ? updated : script))
        : [updated, ...current];
    });
    return updated;
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    setError(null);
    try {
      const payload: GenerateScriptDto = {
        ...form,
        durationSeconds: Number(form.durationSeconds || 15),
        sellingPoints: sellingPointInput
          .split(',')
          .map((point) => point.trim())
          .filter(Boolean),
      };
      await requestScript('/api/scripts/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setForm((current) => ({
        ...emptyForm,
        referenceVideoId: current.referenceVideoId,
        templateId: current.templateId,
      }));
      setSellingPointInput('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '剧本生成失败');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSelectScript(id: string) {
    setError(null);
    try {
      const response = await fetch(`/api/scripts/${id}`);
      if (!response.ok) throw new Error('剧本详情获取失败');
      setSelectedScript((await response.json()) as Script);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '剧本详情获取失败');
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      const response = await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('剧本删除失败');
      setScripts((current) => current.filter((script) => script.id !== id));
      setSelectedScript((current) => (current?.id === id ? null : current));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '剧本删除失败');
    }
  }

  async function handleSelectReference(id: string) {
    setForm((current) => ({ ...current, referenceVideoId: id }));
    const response = await fetch(`/api/scripts/references/${id}`);
    if (response.ok) setSelectedReference((await response.json()) as ReferenceVideo);
  }

  async function handleSelectTemplate(id: string) {
    setForm((current) => ({ ...current, templateId: id }));
    const response = await fetch(`/api/scripts/templates/${id}`);
    if (response.ok) setSelectedTemplate((await response.json()) as InspirationTemplate);
  }

  async function handleUpdateScript(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedScript) return;
    await requestScript(`/api/scripts/${selectedScript.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: scriptEdit.title,
        targetAudience: scriptEdit.targetAudience,
        sellingPoints: scriptEdit.sellingPoints
          .split(',')
          .map((point) => point.trim())
          .filter(Boolean),
      }),
    });
  }

  async function handleAddScene(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedScript) return;
    await requestScript(`/api/scripts/${selectedScript.id}/scenes`, {
      method: 'POST',
      body: JSON.stringify(sceneForm),
    });
    setSceneForm(emptySceneForm);
  }

  async function handlePatchScene(scene: ScriptScene, patch: Partial<ScriptScene>) {
    if (!selectedScript) return;
    await requestScript(`/api/scripts/${selectedScript.id}/scenes/${scene.id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  async function handleRemoveScene(sceneId: string) {
    if (!selectedScript) return;
    const response = await fetch(`/api/scripts/${selectedScript.id}/scenes/${sceneId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      setError('分镜删除失败');
      return;
    }
    const detail = await fetch(`/api/scripts/${selectedScript.id}`);
    if (detail.ok) {
      const updated = (await detail.json()) as Script;
      setSelectedScript(updated);
      setScripts((current) =>
        current.map((script) => (script.id === updated.id ? updated : script)),
      );
    }
  }

  async function handleRegenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedScript) return;
    await requestScript(`/api/scripts/${selectedScript.id}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({
        promptAdjustment,
        factorReplacement: {
          visualStyle: factorReplacement.visualStyle || undefined,
          bgmStyle: factorReplacement.bgmStyle || undefined,
          captionStyle: factorReplacement.captionStyle || undefined,
        },
      }),
    });
    setPromptAdjustment('');
    setFactorReplacement({ visualStyle: '', bgmStyle: '', captionStyle: '' });
  }

  return (
    <section className="script-workspace" aria-label="剧本生成">
      <div className="workspace-heading">
        <div>
          <h2>剧本生成</h2>
          <p>支持参考视频、灵感模板、AI 生成与人工干预的短视频剧本生产。</p>
        </div>
        <span className="count-badge script-count">{scriptCountText}</span>
      </div>

      <div className="inspiration-layout">
        <section className="reference-panel">
          <div className="list-toolbar">
            <h3>参考视频分析</h3>
            <span>{references.length} 条</span>
          </div>
          <div className="reference-items">
            {references.map((reference) => (
              <button
                type="button"
                className="inspiration-select"
                key={reference.id}
                onClick={() => void handleSelectReference(reference.id)}
              >
                <strong>{reference.title}</strong>
                <span className="inspiration-meta-line">
                  {reference.productCategory} · {reference.sourcePlatform}
                </span>
              </button>
            ))}
          </div>
          {selectedReference ? (
            <div className="inspiration-detail">
              <h4>{selectedReference.title}</h4>
              <p>{selectedReference.hookPattern}</p>
              <p>{selectedReference.sellingPointStructure.join(' -> ')}</p>
            </div>
          ) : null}
        </section>

        <section className="template-panel">
          <div className="list-toolbar">
            <h3>灵感模板</h3>
            <span>{templates.length} 个</span>
          </div>
          <div className="reference-items">
            {templates.map((template) => (
              <button
                type="button"
                className="inspiration-select"
                key={template.id}
                onClick={() => void handleSelectTemplate(template.id)}
              >
                <strong>{template.name}</strong>
                <span className="inspiration-meta-line">{template.strategy}</span>
              </button>
            ))}
          </div>
          {selectedTemplate ? (
            <div className="inspiration-detail">
              <h4>{selectedTemplate.name}</h4>
              <p>{selectedTemplate.factors.opening}</p>
              <p>{selectedTemplate.factors.visualFocus}</p>
            </div>
          ) : null}
        </section>
      </div>

      <div className="script-layout">
        <form className="script-form" onSubmit={handleGenerate}>
          <h3>生成参数</h3>
          <label>
            <span>生成模式</span>
            <select
              value={form.mode}
              onChange={(event) =>
                setForm({ ...form, mode: event.target.value as ScriptGenerationMode })
              }
            >
              <option value="auto_strategy">自动策略</option>
              <option value="hot_video_remix">参考视频复刻</option>
              <option value="template_based">灵感模板</option>
            </select>
          </label>
          <label>
            <span>参考视频</span>
            <select
              value={form.referenceVideoId}
              onChange={(event) => void handleSelectReference(event.target.value)}
            >
              {references.map((reference) => (
                <option key={reference.id} value={reference.id}>
                  {reference.productCategory} - {reference.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>灵感模板</span>
            <select
              value={form.templateId}
              onChange={(event) => void handleSelectTemplate(event.target.value)}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>素材 ID</span>
            <input
              value={form.materialId}
              onChange={(event) => setForm({ ...form, materialId: event.target.value })}
              required
            />
          </label>
          <label>
            <span>商品名称</span>
            <input
              value={form.productName}
              onChange={(event) => setForm({ ...form, productName: event.target.value })}
              required
            />
          </label>
          <label>
            <span>商品类目</span>
            <input
              value={form.productCategory}
              onChange={(event) => setForm({ ...form, productCategory: event.target.value })}
              required
            />
          </label>
          <label>
            <span>目标人群</span>
            <input
              value={form.targetAudience}
              onChange={(event) => setForm({ ...form, targetAudience: event.target.value })}
              required
            />
          </label>
          <label>
            <span>使用场景</span>
            <input
              value={form.usageScenario}
              onChange={(event) => setForm({ ...form, usageScenario: event.target.value })}
              required
            />
          </label>
          <label>
            <span>卖点</span>
            <input
              value={sellingPointInput}
              onChange={(event) => setSellingPointInput(event.target.value)}
              placeholder="轻薄透气, 高倍防晒, 好搭配"
              required
            />
          </label>
          <label>
            <span>视频时长</span>
            <input
              max={15}
              min={3}
              type="number"
              value={form.durationSeconds}
              onChange={(event) =>
                setForm({ ...form, durationSeconds: Number(event.target.value) })
              }
            />
          </label>
          <button type="submit" disabled={isGenerating}>
            {isGenerating ? '生成中...' : '生成剧本'}
          </button>
        </form>

        <div className="script-list">
          <div className="list-toolbar">
            <h3>剧本列表</h3>
            <button type="button" className="ghost-button" onClick={() => void loadInitialData()}>
              刷新
            </button>
          </div>
          {error ? <p className="error-message">{error}</p> : null}
          {isLoading ? <p className="empty-state">正在加载剧本资源...</p> : null}
          <div className="script-items">
            {scripts.map((script) => (
              <article className="script-item" key={script.id}>
                <button
                  type="button"
                  className="script-select"
                  onClick={() => void handleSelectScript(script.id)}
                >
                  <strong>{script.title}</strong>
                  <span className="script-meta-line">
                    {script.productName} · {script.durationSeconds}s ·{' '}
                    {modeLabels[script.mode ?? 'auto_strategy']}
                  </span>
                </button>
                <button type="button" onClick={() => void handleDelete(script.id)}>
                  删除
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>

      {selectedScript ? (
        <section className="script-detail" aria-label="剧本详情">
          <div className="detail-heading">
            <div>
              <h3>{selectedScript.title}</h3>
              <p>{selectedScript.narrativeFramework}</p>
            </div>
            <span className="detail-duration">{selectedScript.durationSeconds}s</span>
          </div>

          <div className="intervention-grid">
            <form className="intervention-panel" onSubmit={handleUpdateScript}>
              <h3>剧本编辑</h3>
              <label>
                <span>标题</span>
                <input
                  value={scriptEdit.title}
                  onChange={(event) => setScriptEdit({ ...scriptEdit, title: event.target.value })}
                />
              </label>
              <label>
                <span>目标人群</span>
                <input
                  value={scriptEdit.targetAudience}
                  onChange={(event) =>
                    setScriptEdit({ ...scriptEdit, targetAudience: event.target.value })
                  }
                />
              </label>
              <label>
                <span>卖点</span>
                <input
                  value={scriptEdit.sellingPoints}
                  onChange={(event) =>
                    setScriptEdit({ ...scriptEdit, sellingPoints: event.target.value })
                  }
                />
              </label>
              <button type="submit">保存剧本修改</button>
            </form>

            <form className="intervention-panel" onSubmit={handleRegenerate}>
              <h3>Prompt 微调与因子替换</h3>
              <label>
                <span>Prompt 微调</span>
                <input
                  value={promptAdjustment}
                  onChange={(event) => setPromptAdjustment(event.target.value)}
                  placeholder="更活泼、更适合 TikTok Shop"
                />
              </label>
              <label>
                <span>视觉风格</span>
                <input
                  value={factorReplacement.visualStyle}
                  onChange={(event) =>
                    setFactorReplacement({ ...factorReplacement, visualStyle: event.target.value })
                  }
                />
              </label>
              <label>
                <span>BGM 风格</span>
                <input
                  value={factorReplacement.bgmStyle}
                  onChange={(event) =>
                    setFactorReplacement({ ...factorReplacement, bgmStyle: event.target.value })
                  }
                />
              </label>
              <label>
                <span>字幕风格</span>
                <input
                  value={factorReplacement.captionStyle}
                  onChange={(event) =>
                    setFactorReplacement({ ...factorReplacement, captionStyle: event.target.value })
                  }
                />
              </label>
              <button type="submit">重新生成</button>
            </form>
          </div>

          <form className="scene-editor-form" onSubmit={handleAddScene}>
            <h3>新增分镜</h3>
            <input
              value={sceneForm.title}
              onChange={(event) => setSceneForm({ ...sceneForm, title: event.target.value })}
              placeholder="标题"
              required
            />
            <input
              value={sceneForm.narration}
              onChange={(event) => setSceneForm({ ...sceneForm, narration: event.target.value })}
              placeholder="口播"
              required
            />
            <input
              value={sceneForm.visualPrompt}
              onChange={(event) => setSceneForm({ ...sceneForm, visualPrompt: event.target.value })}
              placeholder="画面提示"
              required
            />
            <input
              value={sceneForm.cameraMovement}
              onChange={(event) =>
                setSceneForm({ ...sceneForm, cameraMovement: event.target.value })
              }
              placeholder="镜头运动"
              required
            />
            <input
              value={sceneForm.bgmSuggestion}
              onChange={(event) =>
                setSceneForm({ ...sceneForm, bgmSuggestion: event.target.value })
              }
              placeholder="BGM"
              required
            />
            <input
              value={sceneForm.caption}
              onChange={(event) => setSceneForm({ ...sceneForm, caption: event.target.value })}
              placeholder="字幕"
              required
            />
            <input
              max={15}
              min={3}
              type="number"
              value={sceneForm.durationSeconds}
              onChange={(event) =>
                setSceneForm({ ...sceneForm, durationSeconds: Number(event.target.value) })
              }
            />
            <button type="submit">新增分镜</button>
          </form>

          <div className="scene-list">
            {selectedScript.scenes.map((scene) => (
              <article className="scene-card" key={scene.id}>
                <div className="scene-title">
                  <span className="scene-order">#{scene.order}</span>
                  <h4>{scene.title}</h4>
                  <strong className="scene-duration">{scene.durationSeconds}s</strong>
                </div>
                <textarea
                  value={scene.narration}
                  onChange={(event) =>
                    void handlePatchScene(scene, { narration: event.target.value })
                  }
                />
                <textarea
                  value={scene.visualPrompt}
                  onChange={(event) =>
                    void handlePatchScene(scene, { visualPrompt: event.target.value })
                  }
                />
                <input
                  value={scene.cameraMovement}
                  onChange={(event) =>
                    void handlePatchScene(scene, { cameraMovement: event.target.value })
                  }
                />
                <input
                  value={scene.bgmSuggestion}
                  onChange={(event) =>
                    void handlePatchScene(scene, { bgmSuggestion: event.target.value })
                  }
                />
                <input
                  value={scene.caption}
                  onChange={(event) =>
                    void handlePatchScene(scene, { caption: event.target.value })
                  }
                />
                <button type="button" onClick={() => void handleRemoveScene(scene.id)}>
                  删除分镜
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
