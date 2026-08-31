# jaronlu.github.io

Jaron Lu 的个人求职作品集站，基于 **Vite + React + TypeScript + Tailwind CSS** 构建，托管于 GitHub Pages（https://jaronlu.github.io）。

设计语言沿用原站的 Editorial / Magazine 风格：纸墨双色 + 单一编辑红强调色，Fraunces（标题）· Inter（正文）· JetBrains Mono（元信息）三层字体，深浅色模式自适应。

## 本地运行

```bash
# 安装依赖（首次）
npm install

# 启动本地预览（默认 http://127.0.0.1:5173）
./run-local.sh
# 或：HOST=0.0.0.0 PORT=8080 ./run-local.sh

# 严格构建校验（部署前必须通过）
npm run build
```

## 目录结构

```
package.json             # 依赖与脚本（dev / build / preview / typecheck）
vite.config.ts           # Vite + React + Tailwind 插件配置
index.html               # 入口 HTML（字体、SEO meta）
public/
├── 404.html             # GitHub Pages SPA 深链回退
└── favicon.svg
src/
├── index.css            # 设计 token（纸墨色 / 字体 / 深浅色）+ 基础样式
├── data/
│   ├── site.ts          # 站点配置：姓名、邮箱、社交、导航
│   ├── projects.ts      # 项目元数据（加新项目改这里）
│   └── notes.ts         # 笔记元数据（加新笔记改这里）
├── content/
│   ├── projects/        # 项目详情页正文组件
│   └── notes/           # 笔记详情页正文组件
├── components/          # 布局与通用组件（Nav / Footer / Reveal / PageHead…）
├── pages/               # 路由页面（Home / Projects / Notes / About / 404…）
└── assets/images/       # 本地图片资源
```

## 拓展内容

数据驱动，加内容不必改页面代码：

- **新增项目**：在 `src/data/projects.ts` 的 `projects` 数组加一条 → 新建 `src/content/projects/<slug>.tsx` 写正文 → 在 `src/pages/ProjectDetail.tsx` 的 `contentMap` 注册。列表页、首页精选会自动出现。
- **新增笔记**：在 `src/data/notes.ts` 的 `notes` 数组加一条 → 新建 `src/content/notes/<slug>.tsx` 写正文 → 在 `src/pages/NoteDetail.tsx` 的 `contentMap` 注册。
- **社交 / 联系方式**：改 `src/data/site.ts`。

## 部署

先提交所有修改，然后运行：

```bash
./deploy-github.sh
```

脚本会检查当前分支与工作区状态，执行 `npm run build` 严格构建，再将 `master` 推送到 GitHub。推送后，`.github/workflows/deploy.yml` 自动构建 `dist/` 并发布到 GitHub Pages。

## 旧版 MkDocs 内容

`docs/` 与 `mkdocs.yml` 是上一版 MkDocs 的内容源与配置，内容已全部迁移到 `src/`，仅保留作归档，不参与当前构建。
