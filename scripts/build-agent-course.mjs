/**
 * 课程正文构建脚本：把 src/content/agent-course/lessons/*.md 转成 JSON 模块。
 *
 * 背景：课程课文是长文（单篇 2~10 万字），不适合逐篇手写 TSX 组件。
 * 做法：构建时用 marked 把 markdown 转成 HTML 字符串，输出到
 *   src/content/agent-course/generated/<slug>.json  （{ html: "..." }）
 * CourseDetail 通过 import.meta.glob 按路由懒加载对应 JSON，避免全量打进主包。
 *
 * 图片：课文里的相对路径图片（![](...)）在运行时会按页面 URL 解析，一定会问错地址，
 * 所以这里统一把源文件（默认 src/content/agent-course/asserts/）拷到 public/agent-course/asserts/，
 * 并把 HTML 里的引用改写成绝对 URL。课文侧仍然写相对路径，作者不用关心产物路径。
 *
 * generated/*.json 会提交进仓库（和 lockfile 同理）：保证 `npm run dev` 不依赖
 * 先跑本脚本；md 或 asserts/ 有改动时重跑 `npm run build`（或 `node scripts/build-agent-course.mjs`）即可。
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LESSONS_DIR = join(ROOT, "src/content/agent-course/lessons");
const OUT_DIR = join(ROOT, "src/content/agent-course/generated");
const PUBLIC_ASSETS_DIR = join(ROOT, "public/agent-course/asserts");
const ASSETS_URL_BASE = "/agent-course/asserts";

// GFM 表格是课文的主要排版手段；GitHub 风格 markdown 与源文件写法一致。
marked.use({ gfm: true });

/** 只处理本地相对路径的图片；远程 URL、data: 与以 / 开头的绝对路径原样保留。 */
const LOCAL_IMAGE = /!\[([^\]]*)\]\((?!https?:|data:|[/#])([^)\s]+)\)/g;

const copiedAssets = new Set();

function copyLocalImages(md, file) {
  const lessonDir = dirname(join(LESSONS_DIR, file));
  return md.replace(LOCAL_IMAGE, (whole, alt, target) => {
    const sourcePath = resolve(lessonDir, target);
    if (!existsSync(sourcePath)) {
      console.warn(`[agent-course] 缺资源：${file} → ${target}（不会发布，图片将 404）`);
      return whole;
    }
    const name = basename(sourcePath);
    mkdirSync(PUBLIC_ASSETS_DIR, { recursive: true });
    copyFileSync(sourcePath, join(PUBLIC_ASSETS_DIR, name));
    copiedAssets.add(name);
    return `![${alt}](${ASSETS_URL_BASE}/${name})`;
  });
}

const files = readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".md"));
if (files.length === 0) {
  console.error("[agent-course] lessons/ 目录下没有 md 文件，先落盘清洗后的课文。");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const file of files) {
  const slug = file.replace(/\.md$/, "");
  const md = copyLocalImages(readFileSync(join(LESSONS_DIR, file), "utf8"), file);
  const html = marked.parse(md, { async: false });
  const out = join(OUT_DIR, `${slug}.json`);
  writeFileSync(out, JSON.stringify({ html }));
  console.log(`[agent-course] ${slug}  ${Math.round(html.length / 1024)}KB html`);
}
if (copiedAssets.size > 0) {
  console.log(`[agent-course] 资源 ${copiedAssets.size} 个 → public/agent-course/asserts/`);
}
console.log(`[agent-course] 共 ${files.length} 篇课文已转换 → generated/`);
