# 电商场景 AIGC 带货视频生成系统

前后端分离的 Monorepo 项目骨架，用于沉淀电商素材、生成带货剧本，并串联 AIGC 图片、视频、TTS 能力完成视频创作流程。

## 技术栈

- Monorepo: pnpm workspace
- Frontend: React + TypeScript + Vite
- Backend: Node.js + TypeScript + NestJS
- Tooling: ESLint、Prettier、StyleLint、Husky、lint-staged

## 目录结构

```text
.
├── apps
│   ├── api                 # NestJS 后端
│   └── web                 # React + Vite 前端
├── packages
│   └── shared              # 前后端共享类型
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

## 核心模块

- material: 商品图、详情图、卖点、品牌资料、参考视频等素材管理。
- script: 商品带货脚本、分镜、口播文案、提示词草稿。
- creation: 创作任务编排，串联文生图、文生视频、图生视频和 TTS。

## 后端 OpenAPI 预留

`apps/api/src/integrations/volcengine` 预留火山引擎 OpenAPI 封装入口：

- `generateImage`: 文生图
- `generateVideoFromText`: 文生视频
- `generateVideoFromImage`: 图生视频
- `synthesizeSpeech`: TTS

当前仅提供类型、依赖注入和占位方法，不包含复杂业务逻辑。

## 快速开始

```bash
pnpm install
pnpm dev
```

单独启动：

```bash
pnpm dev:web
pnpm dev:api
```

## 常用命令

```bash
pnpm build
pnpm lint
pnpm format
pnpm stylelint
```
