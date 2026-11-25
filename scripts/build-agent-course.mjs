/**
 * 课程正文构建脚本：把 src/content/agent-course/lessons/*.md 转成 JSON 模块。
 *
 * 背景：课程课文是长文（单篇 2~10 万字），不适合像工程笔记那样逐篇手写 TSX 组件。
 * 做法：构建时用 marked 把 markdown 转成 HTML 字符串，输出到
 *   src/content/agent-course/generated/<slug>.json  （{ html: "..." }）
 * CourseDetail 通过 import.meta.glob 按路由懒加载对应 JSON，避免全量打进主包。
 *
 * generated/*.json 会提交进仓库（和 lockfile 同理）：保证 `npm run dev` 不依赖
 * 先跑本脚本；md 有改动时重跑 `npm run build`（或 `node scripts/build-agent-course.mjs`）即可。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LESSONS_DIR = join(ROOT, "src/content/agent-course/lessons");
const OUT_DIR = join(ROOT, "src/content/agent-course/generated");

// GFM 表格是课文的主要排版手段；GitHub 风格 markdown 与源文件写法一致。
marked.use({ gfm: true });

const files = readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".md"));
if (files.length === 0) {
  console.error("[agent-course] lessons/ 目录下没有 md 文件，先落盘清洗后的课文。");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const file of files) {
  const slug = file.replace(/\.md$/, "");
  const md = readFileSync(join(LESSONS_DIR, file), "utf8");
  const html = marked.parse(md, { async: false });
  const out = join(OUT_DIR, `${slug}.json`);
  writeFileSync(out, JSON.stringify({ html }));
  console.log(`[agent-course] ${slug}  ${Math.round(html.length / 1024)}KB html`);
}
console.log(`[agent-course] 共 ${files.length} 篇课文已转换 → generated/`);
