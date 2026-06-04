import { CreationPanel } from './modules/creation/CreationPanel';
import { MaterialPanel } from './modules/material/MaterialPanel';
import { ScriptPanel } from './modules/script/ScriptPanel';

export function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">AIGC E-commerce Video</p>
          <h1>电商场景 AIGC 带货视频生成系统</h1>
        </div>
      </header>

      <MaterialPanel />
      <ScriptPanel />
      <CreationPanel />
    </main>
  );
}
