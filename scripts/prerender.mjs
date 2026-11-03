/**
 * 构建后预渲染：为每条路由生成带独立 meta 的静态 HTML 外壳。
 *
 * 解决的问题：
 * 1. 纯 CSR 的 SPA 全站共用 index.html 一份 title/description → 被判重复页；
 * 2. GitHub Pages 对未知路径返回 404.html（HTTP 404），深链刷新等于 404；
 * 3. 社交平台与不执行 JS 的爬虫抓不到标题、描述与封面。
 *
 * 做法：复制 dist/index.html 到 dist/<route>/index.html，替换 <!--seo:start--><!--seo:end-->
 * 之间的 meta 区块。正文仍由 React 接管，路由行为不变。
 *
 * 数据源：src/data/projects.ts 与 src/data/notes.ts（Node ≥22.18 可直接导入 .ts）。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { projects } from "../src/data/projects.ts";
import { notes } from "../src/data/notes.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");
const SITE = "https://jaronlu.github.io";
const OG_IMAGE = `${SITE}/og-image.png`;

const SITE_NAME = "Jaron Lu";
const HOME_DESCRIPTION =
  "Jaron Lu 的工程作品集：可信 RAG、知识操作层、Agent Skills 与 RAG 分阶段实现。把金融客户端的工程约束，编译成可信的 AI Agent 系统。";

/** 每条路由的 title / description / changefreq / priority。 */
const routes = [
  {
    path: "",
    title: `${SITE_NAME} · AI Agent Engineer`,
    description: HOME_DESCRIPTION,
    priority: "1.0",
    changefreq: "monthly",
  },
  {
    path: "projects",
    title: `项目 · ${SITE_NAME}`,
    description:
      "六个项目的工程记录：可信问答、RAG 分阶段实现、知识治理、能力分发与跨平台客户端。",
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    path: "notes",
    title: `工程笔记 · ${SITE_NAME}`,
    description:
      "围绕 Agent Runtime、RAG、MCP 与 Loop Engineering 的工程笔记，记录直接支撑项目设计的约束、取舍与验证方法。",
    priority: "0.8",
    changefreq: "monthly",
  },
  {
    path: "about",
    title: `关于我 · ${SITE_NAME}`,
    description:
      "10 年证券客户端工程经验，把长期处理过的状态、权限、安全、错误恢复与发布约束，迁移到可验证的 Agent 系统中。",
    priority: "0.7",
    changefreq: "yearly",
  },
  ...projects.map((p) => ({
    path: `projects/${p.slug}`,
    title: `${p.name} · 项目 · ${SITE_NAME}`,
    description: p.q,
    priority: "0.8",
    changefreq: "monthly",
  })),
  ...notes.map((n) => ({
    path: `notes/${n.slug}`,
    title: `${n.title} · 工程笔记 · ${SITE_NAME}`,
    description: n.description,
    priority: "0.7",
    changefreq: "monthly",
  })),
];

const escapeAttr = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const urlFor = (path) => (path ? `${SITE}/${path}/` : `${SITE}/`);

function seoBlock({ title, description, url }) {
  const t = escapeAttr(title);
  const d = escapeAttr(description);
  return [
    "<!--seo:start-->",
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="zh_CN" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Jaron Lu — AI Agent Engineer 作品集封面" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    "<!--seo:end-->",
  ].join("\n    ");
}

const SEO_BLOCK = /<!--seo:start-->[\s\S]*?<!--seo:end-->/;
const template = readFileSync(join(DIST, "index.html"), "utf8");

if (!SEO_BLOCK.test(template)) {
  console.error("[prerender] dist/index.html 缺少 <!--seo:start--> 标记块，无法注入 meta。");
  process.exit(1);
}

let written = 0;
for (const route of routes) {
  const url = urlFor(route.path);
  const html = template.replace(SEO_BLOCK, () => seoBlock({ ...route, url }));
  const out = join(DIST, route.path, "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  written += 1;
}

const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${urlFor(r.path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
writeFileSync(join(DIST, "sitemap.xml"), sitemap);

console.log(`[prerender] ${written} 条路由已生成静态外壳，sitemap.xml 已写入 dist/`);
