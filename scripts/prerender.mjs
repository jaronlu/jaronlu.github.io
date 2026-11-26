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
 * 数据源：src/data/projects.ts 与 src/data/course.ts（Node ≥22.18 可直接导入 .ts）。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { projects } from "../src/data/projects.ts";
import { courseLessons } from "../src/data/course.ts";
import { site } from "../src/data/site.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");
const SITE = "https://jaronlu.github.io";
const OG_IMAGE = `${SITE}/og-image.png`;

const SITE_NAME = site.name;
const HOME_DESCRIPTION = site.homeDescription;

/** 每条路由的 title / description / changefreq / priority。 */
const routes = [
  {
    path: "",
    h1: SITE_NAME,
    title: `${SITE_NAME} · ${site.role}`,
    description: HOME_DESCRIPTION,
    priority: "1.0",
    changefreq: "monthly",
  },
  {
    path: "projects",
    h1: "项目",
    title: `项目 · ${SITE_NAME}`,
    description:
      `${projects.length} 个项目的工程记录：可信问答、知识编译、知识操作层、能力分发、RAG 分阶段实现、跨平台客户端与定时自动化。`,
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    path: "about",
    h1: "关于我",
    title: `关于我 · ${SITE_NAME}`,
    description:
      "10 年证券客户端工程经验，把长期处理过的状态、权限、安全、错误恢复与发布约束，迁移到可验证的 Agent 系统中。",
    priority: "0.7",
    changefreq: "yearly",
  },
  ...projects.map((p) => ({
    path: `projects/${p.slug}`,
    h1: p.name,
    title: `${p.name} · 项目 · ${SITE_NAME}`,
    description: p.q,
    priority: "0.8",
    changefreq: "monthly",
  })),
  {
    path: "agent-course",
    h1: "Agent 知识体系",
    title: `Agent 知识体系 · ${SITE_NAME}`,
    description:
      `${courseLessons.length} 课 AI Agent 系统课程目录：消息协议、核心机制、架构模式、工程落地、框架工具与生产治理。收录精校全文，全部标注资料来源与校准状态。`,
    priority: "0.8",
    changefreq: "weekly",
  },
  ...courseLessons
    .filter((l) => l.slug)
    .map((l) => ({
      path: `agent-course/${l.slug}`,
      h1: l.title,
      title: `${l.title} · Agent 知识体系 · ${SITE_NAME}`,
      description: `${l.oneLine}。系统课程第 ${l.num} 课，标注资料来源与校准状态。`,
      priority: "0.6",
      changefreq: "weekly",
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


/**
 * 无 JS 兜底：预渲染时把标题、摘要与导航写进 #root 的 <noscript>。
 * 启用 JS 时浏览器不渲染 noscript，React 挂载又会替换整个 #root，所以交互用户看不到闪屏；
 * 禁用 JS 的抓取器与预览则能读到真实的标题与摘要，不是给爬虫单独准备的隐藏文本。
 * 使用内联样式 + 主题变量，保证浅色 / 深色下都不闪烁、不出现无样式文本。
 */
const ROOT_BLOCK = /<div id="root"><\/div>/;

function fallbackBlock({ h1, description }) {
  const h = escapeAttr(h1);
  const d = escapeAttr(description);
  return [
    '<div id="root"><noscript><div style="max-width:820px;margin:0 auto;padding:72px 24px 40px">',
    '<p style="margin:0 0 18px;font-size:14px;color:var(--muted)">', SITE_NAME, '</p>',
    '<h1 style="margin:0 0 16px;font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(28px,5vw,44px);line-height:1.1;letter-spacing:-.02em;color:var(--ink)">',
    h,
    '</h1>',
    '<p style="margin:0 0 28px;max-width:56ch;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.7;color:var(--ink-soft)">',
    d,
    '</p>',
    '<p style="margin:0;font-size:13px;color:var(--muted)">',
    '<a style="color:var(--accent);text-decoration:none" href="/">首页</a> · ',
    '<a style="color:var(--accent);text-decoration:none" href="/projects/">项目</a> · ',
    '<a style="color:var(--accent);text-decoration:none" href="/agent-course/">知识体系</a> · ',
    '<a style="color:var(--accent);text-decoration:none" href="/about/">关于</a>',
    '</p></div></noscript></div>',
  ].join('');
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
  const html = template
    .replace(SEO_BLOCK, () => seoBlock({ ...route, url }))
    .replace(ROOT_BLOCK, () => fallbackBlock(route));
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
