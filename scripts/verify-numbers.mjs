/**
 * 数字核验：src/data/projects.ts 里每个项目 ev 开头的「N commits」，是否与本机或 GitHub 上的仓库一致。
 *
 * 站上的提交数是手动同步的。项目仓库会持续往前走，
 * 在刷新站上数字之前先跑这个脚本，它会列出哪些项目已经对不上。
 *
 *   npm run verify:num                      # 有不一致时退出码 1
 *   GITHUB_TOKEN=xxx npm run verify:num     # 带令牌，避开匿名限流（60 次/小时）
 *
 * 取值口径（与站上给访客的复算命令 `git rev-list --count HEAD` 对齐）：
 * - 公开仓库（projects.ts 里有 repo）：查 GitHub API，得到访客在 GitHub 上看到的数；
 * - 私有仓库（无 repo）：读本机克隆的 HEAD，目录由 LOCAL_DIRS 指定，找不到就跳过。
 *
 * 退出码：0 = 全部一致或有跳过；1 = 有不一致；2 = 有仓库没能核验（限流、网络、git 失败）。
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { projects } from "../src/data/projects.ts";

/** 各项目本机克隆的目录名；可用环境变量 SITE_PROJECTS_ROOT 改根目录。 */
const PROJECTS_ROOT = process.env.SITE_PROJECTS_ROOT ?? join(homedir(), "Desktop", "01_Workspaces");
const LOCAL_DIRS = {
  secrag: "SecRAG",
  "agent-skills": "agent-skills",
  "llm-wiki-mcp": "llm-wiki-mcp",
  "clip-flow": "clip_flow",
  "ai-engineering-hub": "ai-engineering-hub",
  "doubao-cron": "doubao-cron",
  "llamaindex-rag": "LlamaIndex_RAG",
};

/** ev 开头的提交数，如「304 commits · …」→ 304；没有则返回 null（不核验）。 */
function commitsOnSite(ev) {
  const match = ev.match(/^([\d,]+)\s+commits?\b/i);
  return match ? Number(match[1].replace(/,/g, "")) : null;
}

async function githubCommits(repoUrl) {
  const match = repoUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!match) throw new Error(`无法解析仓库地址：${repoUrl}`);
  const api = `https://api.github.com/repos/${match[1]}/${match[2]}/commits?per_page=1`;
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "jaronlu.github.io verify-numbers" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const response = await fetch(api, { headers });
  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const hint = remaining === "0" ? "（匿名额度已用完，带 GITHUB_TOKEN 重试）" : "";
    throw new Error(`GitHub API ${response.status}${hint}`);
  }
  // 提交数 = 分页的最后一页页码（per_page=1）；不足一页时没有 Link 头，就是本页的条数
  const last = response.headers.get("link")?.match(/[?&]page=(\d+)>;\s*rel="last"/);
  if (last) return Number(last[1]);
  return (await response.json()).length;
}

function localCommits(slug) {
  const dir = LOCAL_DIRS[slug];
  if (!dir) return { skipped: "未配置本机目录" };
  const root = join(PROJECTS_ROOT, dir);
  if (!existsSync(join(root, ".git"))) return { skipped: `本机没有 ${root}` };
  const count = execFileSync("git", ["-C", root, "rev-list", "--count", "HEAD"], { encoding: "utf8" }).trim();
  return { count: Number(count) };
}

const rows = [];
for (const project of projects) {
  const site = commitsOnSite(project.ev);
  if (site === null) {
    rows.push({ slug: project.slug, site: "—", actual: "—", status: "skip", note: "ev 未声明提交数" });
    continue;
  }
  try {
    if (project.repo) {
      const actual = await githubCommits(project.repo);
      rows.push({ slug: project.slug, site, actual, status: actual === site ? "ok" : "diff", note: "GitHub" });
    } else {
      const result = localCommits(project.slug);
      if (result.skipped) rows.push({ slug: project.slug, site, actual: "—", status: "skip", note: result.skipped });
      else rows.push({ slug: project.slug, site, actual: result.count, status: result.count === site ? "ok" : "diff", note: "本机克隆" });
    }
  } catch (error) {
    rows.push({ slug: project.slug, site, actual: "?", status: "error", note: error.message });
  }
}

const width = Math.max(...rows.map((row) => row.slug.length));
for (const row of rows) {
  const mark = { ok: "✓", diff: "✗", skip: "·", error: "?" }[row.status];
  console.log(`${mark} ${row.slug.padEnd(width)}  站上 ${String(row.site).padStart(5)}  实际 ${String(row.actual).padEnd(5)}  ${row.note}`);
}

const diffs = rows.filter((row) => row.status === "diff").length;
const errors = rows.filter((row) => row.status === "error").length;
if (diffs > 0) {
  console.error(`\n[verify-numbers] ${diffs} 个项目的提交数与仓库不一致，更新 src/data/projects.ts 的 ev 与对应项目页正文。`);
  process.exit(1);
}
if (errors > 0) {
  console.error(`\n[verify-numbers] ${errors} 个仓库没能核验，结果不完整。`);
  process.exit(2);
}
console.log(`\n[verify-numbers] ${rows.length} 个项目已核对，提交数全部一致。`);
