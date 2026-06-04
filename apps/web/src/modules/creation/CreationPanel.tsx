import { FormEvent, useEffect, useMemo, useState } from 'react';
import type {
  CreateCreationDto,
  CreationAspectRatio,
  CreationDiagnostics,
  CreationLanguage,
  CreationResolution,
  CreationStatus,
  CreationTask,
  TaskTrace,
} from '@aigc-video/shared';

const emptyForm: CreateCreationDto = {
  scriptId: '',
  materialId: '',
  title: '',
  aspectRatio: '9:16',
  resolution: '1080p',
  language: 'zh',
  voiceStyle: '',
  bgmStyle: '',
};

const statusFlow: Array<{ status: CreationStatus; label: string }> = [
  { status: 'pending', label: 'Pending' },
  { status: 'queued', label: 'Queue' },
  { status: 'running', label: 'Running' },
  { status: 'completed', label: 'Completed' },
];

const statusRank: Record<CreationStatus, number> = {
  pending: 0,
  queued: 1,
  running: 2,
  completed: 3,
  failed: 2,
  canceled: 1,
};

export function CreationPanel() {
  const [tasks, setTasks] = useState<CreationTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<CreationTask | null>(null);
  const [taskTraces, setTaskTraces] = useState<TaskTrace[]>([]);
  const [diagnostics, setDiagnostics] = useState<CreationDiagnostics | null>(null);
  const [form, setForm] = useState<CreateCreationDto>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const taskCountText = useMemo(() => `${tasks.length} 个任务`, [tasks.length]);
  const selectedTaskId = selectedTask?.id;

  useEffect(() => {
    void loadTasks();
  }, []);

  useEffect(() => {
    if (!selectedTaskId) {
      setTaskTraces([]);
      setDiagnostics(null);
      return;
    }
    void loadObservability(selectedTaskId);
  }, [selectedTaskId]);

  async function loadTasks() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/creations');
      if (!response.ok) throw new Error('创作任务列表获取失败');
      const data = (await response.json()) as CreationTask[];
      setTasks(data);
      setSelectedTask((current) => current ?? data[0] ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '创作任务列表获取失败');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTask(id: string) {
    const response = await fetch(`/api/creations/${id}`);
    if (!response.ok) throw new Error('创作任务详情获取失败');
    const task = (await response.json()) as CreationTask;
    setTasks((current) => current.map((item) => (item.id === id ? task : item)));
    setSelectedTask(task);
    return task;
  }

  async function loadObservability(id: string) {
    try {
      const [traceResponse, diagnosticsResponse] = await Promise.all([
        fetch(`/api/creations/${id}/traces`),
        fetch(`/api/creations/${id}/diagnostics`),
      ]);
      if (traceResponse.ok) setTaskTraces((await traceResponse.json()) as TaskTrace[]);
      if (diagnosticsResponse.ok) {
        setDiagnostics((await diagnosticsResponse.json()) as CreationDiagnostics);
      }
    } catch {
      setTaskTraces([]);
      setDiagnostics(null);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/creations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('创作任务创建失败');
      const created = (await response.json()) as CreationTask;
      setTasks((current) => [created, ...current]);
      setSelectedTask(created);
      setForm(emptyForm);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '创作任务创建失败');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSelect(id: string) {
    setError(null);

    try {
      await loadTask(id);
      await loadObservability(id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '创作任务详情获取失败');
    }
  }

  async function handleStart(id: string) {
    await runTaskAction(id, 'start', '智能剪辑流水线启动失败');
    pollTask(id);
  }

  async function handleRetry(id: string) {
    await runTaskAction(id, 'retry', '失败任务重试失败');
    pollTask(id);
  }

  async function handleCancel(id: string) {
    await runTaskAction(id, 'cancel', '创作任务取消失败');
  }

  async function runTaskAction(
    id: string,
    action: 'start' | 'retry' | 'cancel',
    errorMessage: string,
  ) {
    setRunningTaskId(id);
    setError(null);

    try {
      const response = await fetch(`/api/creations/${id}/${action}`, { method: 'POST' });
      if (!response.ok) throw new Error(errorMessage);
      const updated = (await response.json()) as CreationTask;
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
      setSelectedTask(updated);
      await loadObservability(id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : errorMessage);
    } finally {
      setRunningTaskId(null);
    }
  }

  function pollTask(id: string) {
    const timer = window.setInterval(() => {
      void (async () => {
        const response = await fetch(`/api/creations/${id}/progress`);
        if (!response.ok) return;
        const progress = (await response.json()) as Pick<
          CreationTask,
          'id' | 'status' | 'progress'
        >;
        setTasks((current) =>
          current.map((task) =>
            task.id === id
              ? { ...task, status: progress.status, progress: progress.progress }
              : task,
          ),
        );
        setSelectedTask((current) =>
          current?.id === id
            ? { ...current, status: progress.status, progress: progress.progress }
            : current,
        );
        await loadObservability(id);
        if (['completed', 'failed', 'canceled'].includes(progress.status)) {
          window.clearInterval(timer);
          await loadTask(id);
          await loadObservability(id);
        }
      })();
    }, 350);
  }

  async function handleDelete(id: string) {
    setError(null);

    try {
      const response = await fetch(`/api/creations/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('创作任务删除失败');
      setTasks((current) => current.filter((task) => task.id !== id));
      setSelectedTask((current) => (current?.id === id ? null : current));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '创作任务删除失败');
    }
  }

  return (
    <section className="creation-workspace" aria-label="视频创作任务">
      <div className="workspace-heading">
        <div>
          <h2>长任务生成与观测</h2>
          <p>模拟排队、进度推进、故障重试、Trace 与诊断信息，支撑视频创作任务管理。</p>
        </div>
        <span className="count-badge creation-count">{taskCountText}</span>
      </div>

      <div className="creation-layout">
        <form className="creation-form" onSubmit={handleCreate}>
          <h3>创建任务</h3>
          <label>
            <span>剧本 ID</span>
            <input
              value={form.scriptId}
              onChange={(event) => setForm({ ...form, scriptId: event.target.value })}
              required
            />
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
            <span>标题</span>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
            />
          </label>
          <label>
            <span>画幅</span>
            <select
              value={form.aspectRatio}
              onChange={(event) =>
                setForm({ ...form, aspectRatio: event.target.value as CreationAspectRatio })
              }
            >
              <option value="9:16">9:16</option>
              <option value="16:9">16:9</option>
              <option value="1:1">1:1</option>
            </select>
          </label>
          <label>
            <span>分辨率</span>
            <select
              value={form.resolution}
              onChange={(event) =>
                setForm({ ...form, resolution: event.target.value as CreationResolution })
              }
            >
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
            </select>
          </label>
          <label>
            <span>语言</span>
            <select
              value={form.language}
              onChange={(event) =>
                setForm({ ...form, language: event.target.value as CreationLanguage })
              }
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            <span>声音风格</span>
            <input
              value={form.voiceStyle}
              onChange={(event) => setForm({ ...form, voiceStyle: event.target.value })}
              placeholder="自然口播"
            />
          </label>
          <label>
            <span>BGM 风格</span>
            <input
              value={form.bgmStyle}
              onChange={(event) => setForm({ ...form, bgmStyle: event.target.value })}
              placeholder="轻快电商"
            />
          </label>
          <button type="submit" disabled={isCreating}>
            {isCreating ? '创建中...' : '创建创作任务'}
          </button>
        </form>

        <div className="creation-list">
          <div className="list-toolbar">
            <h3>任务列表</h3>
            <button type="button" className="ghost-button" onClick={() => void loadTasks()}>
              刷新
            </button>
          </div>
          {error ? <p className="error-message">{error}</p> : null}
          {isLoading ? <p className="empty-state">正在加载创作任务...</p> : null}
          <div className="creation-items">
            {tasks.map((task) => (
              <article className="creation-item" key={task.id}>
                <button
                  type="button"
                  className="task-select"
                  onClick={() => void handleSelect(task.id)}
                >
                  <strong>{task.title}</strong>
                  <span className="task-meta-line">
                    {task.status} / {task.progress}% / {task.aspectRatio} / {task.resolution}
                  </span>
                </button>
                <div className="task-actions">
                  <button
                    type="button"
                    disabled={runningTaskId === task.id || task.status !== 'pending'}
                    onClick={() => void handleStart(task.id)}
                  >
                    启动
                  </button>
                  <button
                    type="button"
                    disabled={runningTaskId === task.id || task.status !== 'failed'}
                    onClick={() => void handleRetry(task.id)}
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    disabled={!['pending', 'queued'].includes(task.status)}
                    onClick={() => void handleCancel(task.id)}
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={() => void handleDelete(task.id)}>
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {selectedTask ? (
        <section className="creation-detail" aria-label="创作任务详情">
          <div className="detail-heading">
            <div>
              <h3>{selectedTask.title}</h3>
              <p>
                {selectedTask.status} / {selectedTask.progress}% / {selectedTask.language} /{' '}
                {selectedTask.aspectRatio} / {selectedTask.resolution}
              </p>
            </div>
            <span className="detail-duration">{selectedTask.progress}%</span>
          </div>

          <div className="status-flow" aria-label="任务状态流">
            {statusFlow.map((item) => (
              <span
                className={`status-step ${
                  statusRank[selectedTask.status] >= statusRank[item.status]
                    ? 'status-step-active'
                    : ''
                }`}
                key={item.status}
              >
                {item.label}
              </span>
            ))}
          </div>
          <div className="progress-track" aria-label="任务进度">
            <span className="progress-fill" style={{ width: `${selectedTask.progress}%` }} />
          </div>

          <div className="export-links">
            <a href={selectedTask.previewUrl || '#'}>{selectedTask.previewUrl || '暂无预览地址'}</a>
            <a href={selectedTask.exportUrl || '#'}>{selectedTask.exportUrl || '暂无导出地址'}</a>
          </div>

          <div className="observability-grid">
            <section className="observability-panel" aria-label="Task Trace">
              <h4>Task Trace</h4>
              <div className="task-trace-list">
                {taskTraces.length === 0 ? <p className="empty-state">暂无 Trace</p> : null}
                {taskTraces.map((trace) => (
                  <div className="task-trace-item" key={trace.id}>
                    <strong>{trace.step}</strong>
                    <span className="trace-meta">{trace.status}</span>
                    <span className="trace-meta">{trace.provider}</span>
                    <p>{trace.message}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="observability-panel" aria-label="Diagnostics">
              <h4>Diagnostics</h4>
              {diagnostics ? (
                <div className="diagnostic-card">
                  <strong>{diagnostics.provider}</strong>
                  <p>总耗时：{diagnostics.totalDurationMs} ms</p>
                  <p>失败：{diagnostics.failed ? '是' : '否'}</p>
                  <p>{diagnostics.errorMessage || '暂无错误信息'}</p>
                  <div className="diagnostic-steps">
                    {diagnostics.stepDurations.map((step, index) => (
                      <span className="diagnostic-step" key={`${step.step}-${index}`}>
                        {step.step}: {step.durationMs} ms
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="empty-state">暂无诊断信息</p>
              )}
            </section>
          </div>

          <div className="creation-scene-list">
            {selectedTask.scenes.map((scene) => (
              <article className="creation-scene-card" key={scene.id}>
                <div className="scene-title">
                  <span className="scene-order">#{scene.order}</span>
                  <h4>{scene.scriptSceneId}</h4>
                  <strong className="scene-duration">{scene.status}</strong>
                </div>
                <div className="asset-grid">
                  <div>
                    <strong>Image</strong>
                    <p>{scene.imageUrl || '待生成'}</p>
                  </div>
                  <div>
                    <strong>TTS</strong>
                    <p>{scene.ttsUrl || '待生成'}</p>
                  </div>
                  <div>
                    <strong>Subtitle</strong>
                    <p>{scene.subtitleText || '待生成'}</p>
                    <p>{scene.subtitleFileUrl || ''}</p>
                  </div>
                  <div>
                    <strong>BGM</strong>
                    <p>{scene.bgmStyle || '待生成'}</p>
                    <p>{scene.bgmUrl || ''}</p>
                  </div>
                  <div>
                    <strong>Video Segment</strong>
                    <p>{scene.videoClipUrl || '待生成'}</p>
                  </div>
                </div>
                <div className="trace-list">
                  {scene.renderTrace.map((trace) => (
                    <div
                      className="trace-item"
                      key={`${scene.id}-${trace.step}-${trace.startedAt}`}
                    >
                      <strong>{trace.step}</strong>
                      <span className="trace-meta">{trace.provider}</span>
                      <span className="trace-meta">{trace.status}</span>
                      <span className="trace-meta">{trace.finishedAt}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
