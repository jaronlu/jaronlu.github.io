# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 路径与运行环境

- 当前仓库运行在 macOS/POSIX 环境。开始工作时先用 `pwd -P` 和 `git rev-parse --show-toplevel` 确认真实仓库根目录。
- 所有仓库文件操作必须使用相对于 Git 根目录的 POSIX 路径，例如 `src/data/projects.ts` 或 `CLAUDE.md`。
- 禁止生成或使用 `C:\Users\...`、`D:\...` 等 Windows 绝对路径，即使界面、历史消息或模型上下文中出现了这类路径。
- 写入或编辑文件前检查目标路径：不得包含反斜杠 `\`，不得以 Windows 盘符开头。路径与当前 Git 根目录不一致时立即停止并重新确认，不得猜测用户名或工作目录。

## 项目概述

Jaron Lu 的个人求职作品集站（中文），基于 **Vite + React + TypeScript + Tailwind CSS** 构建，托管于 GitHub Pages（https://jaronlu.github.io）。内容定位是“可验证的 AI Agent 工程能力展示”——站点品牌主张是数字可核对、边界声明诚实，修改内容时不得引入未经核实的数字或夸大表述。

## 常用命令

```bash
# 本地预览（默认 http://127.0.0.1:5173，会自动清理占用端口的进程）
./run-local.sh
# 可自定义：HOST=0.0.0.0 PORT=8080 ./run-local.sh

# 严格构建校验（部署前必须通过；tsc 类型检查 + vite build）
npm run build

# 部署（要求：在 master 分支、工作区干净；先 build 再 push master）
./deploy-github.sh
```

依赖安装：`npm install`。

## 部署机制

- push master → `.github/workflows/deploy.yml`（setup-node + `npm ci` + `npm run build`）自动构建 `dist/` 并发布到 GitHub Pages。
- **禁止直接 push gh-pages**：`.githooks/pre-push`（已通过 `core.hooksPath` 启用）会拦截。
- `dist/` 与 `node_modules/` 是构建产物，已 gitignore，不要提交。
- `docs/` 是上一版 MkDocs 的内容归档，不参与构建，一般不要改动。

## 架构

内容与页面分离，全部数据驱动：

- **数据层**在 `src/data/`：`site.ts`（站点配置/社交/导航）、`projects.ts`（项目元数据）、`notes.ts`（笔记元数据）。加项目/笔记先改这里。
- **正文组件**在 `src/content/`：`projects/<slug>.tsx` 与 `notes/<slug>.tsx` 用 JSX 编写详情页正文；正文复用 `.prose` 排版（`src/index.css`），表格用 `<table>`、代码块用 `CodeBlock` 组件、架构图用内联 SVG（复用 `--ink/--accent/--line-strong` 等 token）。
- **页面**在 `src/pages/`：路由在 `src/App.tsx`；项目/笔记详情页通过 `contentMap` 注册正文组件。
- **视觉 token**在 `src/index.css`：`:root` 与 `.dark` 两块定义 `--paper/--ink/--muted/--line/--accent` 等，深浅色靠 `.dark` class 重定义切换——新增颜色必须两个块都定义，不要在组件里硬编码颜色。`--ink` 在深色下是浅色值，不能当“永远深色的背景”用。
- **字体三层分工**：Fraunces（`--font-display`）只用于标题与项目名；Inter（`--font-sans`）正文；JetBrains Mono（`--font-mono`）专职 kicker/meta 元信息层。不新增字体，不新增第二强调色。
- 新页面必须在 `src/App.tsx` 的 `Routes` 中注册。

## 内容约定

- 四个项目页（`src/content/projects/*.tsx`）共用统一结构：meta 档案头（由 `ProjectDetail.tsx` 统一渲染：角色/状态/技术栈/源码）→ 项目一句话 → 为什么做 → 架构（内联 SVG 线稿）→ 可验证证据 → 技术取舍表 → 项目边界 → 页尾联系短句。新增项目页照此结构。
- 架构图一律内联 SVG 线稿：1px 线、mono 标注、无阴影渐变，红色（`--accent`）只标关键约束节点。
- 工程笔记（`src/content/notes/*.tsx`）带 `CONFIDENCE — HIGH/MEDIUM` 徽章（由 `NoteDetail.tsx` 统一渲染），标记体系在 `src/pages/Notes.tsx` 有解释，新笔记需保持。
- 站点各处引用的数字（测试数、行数等）必须与项目仓库实际情况一致，且多处引用同一数字时保持同步（如项目列表页与详情页）。不用文件数/行数当能力证据。
- 对比度约束：正文/小字需满足 WCAG AA（4.5:1），改 `--faint`/`--muted` 等低对比 token 前先核算。
