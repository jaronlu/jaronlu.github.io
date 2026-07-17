# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 路径与运行环境

- 当前仓库运行在 macOS/POSIX 环境。开始工作时先用 `pwd -P` 和 `git rev-parse --show-toplevel` 确认真实仓库根目录。
- 所有仓库文件操作必须使用相对于 Git 根目录的 POSIX 路径，例如 `docs/index.md` 或 `CLAUDE.md`。
- 禁止生成或使用 `C:\Users\...`、`D:\...` 等 Windows 绝对路径，即使界面、历史消息或模型上下文中出现了这类路径。
- 写入或编辑文件前检查目标路径：不得包含反斜杠 `\`，不得以 Windows 盘符开头。路径与当前 Git 根目录不一致时立即停止并重新确认，不得猜测用户名或工作目录。
- 不要把绝对路径当作仓库内文件名。Claude Code 的项目级 PreToolUse hook 会阻止 Windows 风格的写入路径。

## 项目概述

Jaron Lu 的个人求职作品集站（中文），基于 MkDocs + Material for MkDocs 构建，托管于 GitHub Pages（https://jaronlu.github.io）。内容定位是“可验证的 AI Agent 工程能力展示”——站点品牌主张是数字可核对、边界声明诚实，修改内容时不得引入未经核实的数字或夸大表述。

## 常用命令

```bash
# 本地预览（默认 http://127.0.0.1:8000，会自动清理占用端口的进程）
./run-local.sh
# 可自定义：HOST=0.0.0.0 PORT=8080 ./run-local.sh

# 严格构建校验（部署前必须通过；这是本仓库唯一的“测试”）
mkdocs build --strict

# 部署（要求：在 master 分支、工作区干净；先严格构建再 push master）
./deploy-github.sh
```

依赖安装：`python3 -m pip install mkdocs mkdocs-material`。

## 部署机制

- push master → `.github/workflows/deploy.yml` 自动构建并发布到 GitHub Pages。
- **禁止直接 push gh-pages**：`.githooks/pre-push`（已通过 `core.hooksPath` 启用）会拦截。
- `site/` 是构建产物，已 gitignore，不要提交。
- `TODO.md` 和 `docs/public-site.md` 是本地专用文件，不进入 Git 历史；后者同时被 `mkdocs.yml` 的 `exclude_docs` 排除出构建。

## 架构

内容全部在 `docs/` 下的 Markdown；视觉系统全部在 `docs/stylesheets/extra.css`（约 1000 行，是本仓库真正的“代码”）。两者的关系：

- **首页（`docs/index.md`）和项目页大量使用内嵌 HTML 块**（`<section class="masthead">`、`.lens`、`.contact-strip`、`.project-meta`、`.work-list` 等），这些 class 的样式全部定义在 `extra.css`。改版式先在 CSS 里找对应 class，改内容直接编辑 Markdown 中的 HTML。
- **设计 token 体系**在 `extra.css` 开头的 `:root` 与 `[data-md-color-scheme="slate"]` 两个块中定义（`--paper/--ink/--muted/--faint/--line/--accent/--footer-bg` 等）。深浅色靠同名 token 重定义切换——新增颜色必须两个块都定义，不要在组件里硬编码颜色。特别注意 `--ink` 在深色下是浅色值，不能当“永远深色的背景”用（曾因此出过 footer 不可读的 bug）。
- **字体三层分工**：Fraunces（`--display`）只用于标题与项目名；Inter（`--sans`）正文；JetBrains Mono（`--mono`）专职 kicker/meta 元信息层。不新增字体，不新增第二强调色。
- 新页面必须在 `mkdocs.yml` 的 `nav` 中注册，否则不会出现在导航。

## 内容约定

- 四个项目页（`docs/projects/*.md`）共用统一结构：`project-meta` 档案头（角色/状态/技术栈/GitHub）→ 项目一句话 → 为什么做 → 架构（内联 SVG 线稿）→ 可验证证据 → 技术取舍表 → 项目边界 → 页尾联系短句。新增项目页照此结构。
- 架构图一律内联 SVG 线稿：1px 线、mono 标注、无阴影渐变，红色（`--accent`）只标关键约束节点。
- 工程笔记（`docs/agent/concepts/*.md`）第 3 行带 `note-confidence` 徽章（CONFIDENCE — HIGH/MEDIUM），标记体系在 `docs/agent/index.md` 有解释，新笔记需保持。
- 站点各处引用的数字（测试数、行数等）必须与项目仓库实际情况一致，且多处引用同一数字时保持同步（如项目列表页与详情页）。不用文件数/行数当能力证据。
- 对比度约束：正文/小字需满足 WCAG AA（4.5:1），改 `--faint`/`--muted` 等低对比 token 前先核算。
