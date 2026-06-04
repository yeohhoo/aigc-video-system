import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CreateMaterialDto, Material, MaterialType } from '@aigc-video/shared';

const materialTypeLabels: Record<MaterialType, string> = {
  image: '图片',
  video: '视频',
  reference: '参考',
};

const emptyForm: CreateMaterialDto = {
  title: '',
  type: 'image',
  url: '',
  tags: [],
  productCategory: '',
  description: '',
  summary: '',
};

export function MaterialPanel() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [form, setForm] = useState<CreateMaterialDto>(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const materialCountText = useMemo(() => `${materials.length} 个素材`, [materials.length]);

  useEffect(() => {
    void loadMaterials();
  }, []);

  async function loadMaterials() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/materials');

      if (!response.ok) {
        throw new Error('素材列表获取失败');
      }

      const data = (await response.json()) as Material[];
      setMaterials(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '素材列表获取失败');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload: CreateMaterialDto = {
      ...form,
      tags: tagInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('素材创建失败');
      }

      const created = (await response.json()) as Material;
      setMaterials((current) => [created, ...current]);
      setForm(emptyForm);
      setTagInput('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '素材创建失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);

    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('素材删除失败');
      }

      setMaterials((current) => current.filter((material) => material.id !== id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '素材删除失败');
    }
  }

  return (
    <section className="material-workspace" aria-label="素材管理">
      <div className="workspace-heading">
        <div>
          <h2>素材库</h2>
          <p>为剧本生成和视频创作沉淀商品图片、视频和参考素材。</p>
        </div>
        <span className="count-badge">{materialCountText}</span>
      </div>

      <div className="material-layout">
        <form className="material-form" onSubmit={handleSubmit}>
          <h3>新增素材</h3>

          <label>
            <span>标题</span>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="例如：夏季防晒衣商品图"
              required
            />
          </label>

          <label>
            <span>类型</span>
            <select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value as MaterialType })}
            >
              <option value="image">图片</option>
              <option value="video">视频</option>
              <option value="reference">参考</option>
            </select>
          </label>

          <label>
            <span>素材地址</span>
            <input
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
              placeholder="https://example.com/material.jpg"
              required
            />
          </label>

          <label>
            <span>标签</span>
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="服饰, 夏季, 防晒"
            />
          </label>

          <label>
            <span>商品类目</span>
            <input
              value={form.productCategory}
              onChange={(event) => setForm({ ...form, productCategory: event.target.value })}
              placeholder="服饰鞋包"
            />
          </label>

          <label>
            <span>描述</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="补充商品卖点、画面内容或使用场景"
              rows={3}
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '入库中...' : '创建素材'}
          </button>
        </form>

        <div className="material-list">
          <div className="list-toolbar">
            <h3>素材列表</h3>
            <button type="button" className="ghost-button" onClick={() => void loadMaterials()}>
              刷新
            </button>
          </div>

          {error ? <p className="error-message">{error}</p> : null}
          {isLoading ? <p className="empty-state">正在加载素材...</p> : null}

          {!isLoading && materials.length === 0 ? (
            <p className="empty-state">暂无素材，先新增一条素材用于流程联调。</p>
          ) : null}

          <div className="material-items">
            {materials.map((material) => (
              <article className="material-item" key={material.id}>
                <div className="material-main">
                  <div>
                    <h4>{material.title}</h4>
                    <p>{material.description || material.summary || material.url}</p>
                  </div>
                  <button type="button" onClick={() => void handleDelete(material.id)}>
                    删除
                  </button>
                </div>

                <div className="material-meta">
                  <span>{materialTypeLabels[material.type]}</span>
                  <span>{material.status}</span>
                  {material.productCategory ? <span>{material.productCategory}</span> : null}
                </div>

                <div className="tag-row">
                  {material.tags.length > 0 ? (
                    material.tags.map((tag) => <span key={`${material.id}-${tag}`}>{tag}</span>)
                  ) : (
                    <span>未设置标签</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
