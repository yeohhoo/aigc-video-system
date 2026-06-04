import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { GenerateScriptDto, Script } from '@aigc-video/shared';

const emptyForm: GenerateScriptDto = {
  materialId: '',
  productName: '',
  productCategory: '',
  sellingPoints: [],
  targetAudience: '',
  usageScenario: '',
  durationSeconds: 15,
  promptAdjustment: '',
};

export function ScriptPanel() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [form, setForm] = useState<GenerateScriptDto>(emptyForm);
  const [sellingPointInput, setSellingPointInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scriptCountText = useMemo(() => `${scripts.length} 个剧本`, [scripts.length]);

  useEffect(() => {
    void loadScripts();
  }, []);

  async function loadScripts() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scripts');

      if (!response.ok) {
        throw new Error('剧本列表获取失败');
      }

      const data = (await response.json()) as Script[];
      setScripts(data);
      setSelectedScript((current) => current ?? data[0] ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '剧本列表获取失败');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    setError(null);

    const payload: GenerateScriptDto = {
      ...form,
      durationSeconds: Number(form.durationSeconds || 15),
      sellingPoints: sellingPointInput
        .split(',')
        .map((point) => point.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('剧本生成失败');
      }

      const generated = (await response.json()) as Script;
      setScripts((current) => [generated, ...current]);
      setSelectedScript(generated);
      setForm(emptyForm);
      setSellingPointInput('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '剧本生成失败');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSelect(id: string) {
    setError(null);

    try {
      const response = await fetch(`/api/scripts/${id}`);

      if (!response.ok) {
        throw new Error('剧本详情获取失败');
      }

      const detail = (await response.json()) as Script;
      setSelectedScript(detail);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '剧本详情获取失败');
    }
  }

  async function handleDelete(id: string) {
    setError(null);

    try {
      const response = await fetch(`/api/scripts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('剧本删除失败');
      }

      setScripts((current) => current.filter((script) => script.id !== id));
      setSelectedScript((current) => (current?.id === id ? null : current));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '剧本删除失败');
    }
  }

  return (
    <section className="script-workspace" aria-label="剧本生成">
      <div className="workspace-heading">
        <div>
          <h2>剧本生成</h2>
          <p>基于素材、商品卖点、人群和场景生成 15 秒内的带货短视频分镜。</p>
        </div>
        <span className="count-badge script-count">{scriptCountText}</span>
      </div>

      <div className="script-layout">
        <form className="script-form" onSubmit={handleGenerate}>
          <h3>生成参数</h3>

          <label>
            <span>素材 ID</span>
            <input
              value={form.materialId}
              onChange={(event) => setForm({ ...form, materialId: event.target.value })}
              placeholder="从素材列表复制素材 ID"
              required
            />
          </label>

          <label>
            <span>商品名称</span>
            <input
              value={form.productName}
              onChange={(event) => setForm({ ...form, productName: event.target.value })}
              placeholder="例如：夏季防晒衣"
              required
            />
          </label>

          <label>
            <span>商品类目</span>
            <input
              value={form.productCategory}
              onChange={(event) => setForm({ ...form, productCategory: event.target.value })}
              placeholder="服饰鞋包"
              required
            />
          </label>

          <label>
            <span>目标人群</span>
            <input
              value={form.targetAudience}
              onChange={(event) => setForm({ ...form, targetAudience: event.target.value })}
              placeholder="通勤女性、户外人群"
              required
            />
          </label>

          <label>
            <span>使用场景</span>
            <input
              value={form.usageScenario}
              onChange={(event) => setForm({ ...form, usageScenario: event.target.value })}
              placeholder="夏季通勤、防晒出游"
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

          <label>
            <span>风格调整</span>
            <input
              value={form.promptAdjustment}
              onChange={(event) => setForm({ ...form, promptAdjustment: event.target.value })}
              placeholder="更活泼、更高级、更适合 TikTok Shop"
            />
          </label>

          <button type="submit" disabled={isGenerating}>
            {isGenerating ? '生成中...' : '生成剧本'}
          </button>
        </form>

        <div className="script-list">
          <div className="list-toolbar">
            <h3>剧本列表</h3>
            <button type="button" className="ghost-button" onClick={() => void loadScripts()}>
              刷新
            </button>
          </div>

          {error ? <p className="error-message">{error}</p> : null}
          {isLoading ? <p className="empty-state">正在加载剧本...</p> : null}

          {!isLoading && scripts.length === 0 ? (
            <p className="empty-state">暂无剧本，填写参数后生成第一条短视频脚本。</p>
          ) : null}

          <div className="script-items">
            {scripts.map((script) => (
              <article className="script-item" key={script.id}>
                <button
                  type="button"
                  className="script-select"
                  onClick={() => void handleSelect(script.id)}
                >
                  <strong>{script.title}</strong>
                  <span className="script-meta-line">
                    {script.productName} · {script.durationSeconds}s · {script.status}
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
              <p>
                {selectedScript.narrativeFramework} · {selectedScript.visualStyle}
              </p>
            </div>
            <span className="detail-duration">{selectedScript.durationSeconds}s</span>
          </div>

          <div className="detail-grid">
            <div>
              <strong>素材 ID</strong>
              <p>{selectedScript.materialId}</p>
            </div>
            <div>
              <strong>目标人群</strong>
              <p>{selectedScript.targetAudience}</p>
            </div>
            <div>
              <strong>使用场景</strong>
              <p>{selectedScript.usageScenario}</p>
            </div>
            <div>
              <strong>卖点</strong>
              <p>{selectedScript.sellingPoints.join('、')}</p>
            </div>
          </div>

          <div className="constraint-row">
            {selectedScript.constraints.map((constraint) => (
              <span className="constraint-chip" key={constraint}>
                {constraint}
              </span>
            ))}
          </div>

          <div className="scene-list">
            {selectedScript.scenes.map((scene) => (
              <article className="scene-card" key={scene.id}>
                <div className="scene-title">
                  <span className="scene-order">#{scene.order}</span>
                  <h4>{scene.title}</h4>
                  <strong className="scene-duration">{scene.durationSeconds}s</strong>
                </div>
                <p>
                  <strong>口播：</strong>
                  {scene.narration}
                </p>
                <p>
                  <strong>画面：</strong>
                  {scene.visualPrompt}
                </p>
                <p>
                  <strong>镜头：</strong>
                  {scene.cameraMovement}
                </p>
                <p>
                  <strong>字幕：</strong>
                  {scene.caption}
                </p>
                <p>
                  <strong>BGM：</strong>
                  {scene.bgmSuggestion}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
