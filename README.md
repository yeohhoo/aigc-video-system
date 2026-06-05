# 电商场景 AIGC 带货视频生成系统

VideoGen 是一个面向电商短视频生产流程的 Monorepo 项目，用于沉淀商品素材、生成带货脚本，并通过可替换的 AI Provider 编排图片、视频与 TTS 生成流程。当前版本以 mock 闭环为主，重点展示从素材管理到脚本生成、创作任务执行、Trace 观测与诊断的完整链路，适合课程设计、答辩演示和后续接入真实模型服务。

## 项目背景

电商运营在制作带货短视频时，通常需要反复整理商品图、卖点、参考视频、脚本文案、分镜提示词和生成任务状态。传统流程依赖人工复制粘贴，容易出现素材分散、脚本风格不一致、生成过程不可追踪等问题。

本项目尝试将这些环节抽象为一个轻量级 AIGC 视频生产系统：前端提供素材、脚本和创作任务工作台；后端提供 NestJS API、mock 数据和任务编排服务；Provider 层预留火山引擎等真实模型接口的接入位置。

## 技术栈

- Monorepo：pnpm workspace
- 前端：React、TypeScript、Vite
- 后端：Node.js、TypeScript、NestJS
- 共享类型：TypeScript package
- 工程工具：ESLint、Prettier、Stylelint、Husky、lint-staged
- AI Provider：mock provider，预留 Volcengine provider 封装

## 系统架构

```text
.
├─ apps
│  ├─ api                 # NestJS 后端 API
│  └─ web                 # React + Vite 前端工作台
├─ packages
│  └─ shared              # 前后端共享类型与 DTO
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
└─ README.md
```

核心调用链路：

```text
Material 素材库
  -> Script 脚本生成与分镜管理
  -> Creation 创作任务
  -> Pipeline 编排
  -> Provider 图片 / 视频 / TTS
  -> Trace 与 Diagnostics 观测
```

## 核心模块

- Material：管理商品图、视频、参考素材、标签、类目、描述和摘要，为脚本生成与创作任务提供素材基础。
- Script：支持自动策略、参考视频复刻和灵感模板三种脚本生成模式，生成短视频标题、叙事框架、分镜、口播、画面提示词、BGM 建议和字幕文案。
- Creation：创建视频创作任务，模拟排队、运行、失败重试、取消、进度推进、预览地址和导出地址。
- Provider：通过统一接口封装图片生成、文生视频、图生视频和 TTS 能力。当前默认使用 mock provider。
- Pipeline：串联图片生成、语音合成、字幕生成、图生视频、片段合成和最终视频合成。
- Observability：提供 Task Trace 与 Diagnostics，展示每一步的 Provider、状态、耗时和错误信息。

## 启动方式

首次安装依赖：

```bash
pnpm install
```

同时启动前端和后端：

```bash
pnpm dev
```

单独启动：

```bash
pnpm dev:web
pnpm dev:api
```

常用质量检查：

```bash
pnpm lint
pnpm stylelint
pnpm build
```

Windows 环境可使用：

```bash
pnpm.cmd lint
pnpm.cmd stylelint
pnpm.cmd build
pnpm.cmd dev
```

## 当前能力

- 已搭建 pnpm Monorepo，包含 web、api、shared 三个工作区。
- 前端已提供素材库、脚本生成、参考视频、灵感模板、创作任务和观测面板。
- 后端已提供 Material、Script、Creation、Provider、Pipeline 等 mock 闭环 API。
- 支持新增和删除素材、生成和编辑脚本、增删改分镜、重新生成脚本。
- 支持创建创作任务、启动、重试、取消、删除和进度轮询。
- 支持 mock Trace、Diagnostics、预览地址和导出地址展示。
- 预留火山引擎图片、视频和 TTS 服务封装，后续可替换 mock provider。

## 后续规划

- 接入真实 AIGC Provider，完善鉴权、重试、超时和限流策略。
- 增加素材解析、视频切片、Embedding 检索和参考视频结构化分析。
- 引入任务持久化，替换当前内存 mock 数据。
- 增加用户、项目、权限和多任务队列管理。
- 完善端到端测试、接口契约测试和可观测性看板。
