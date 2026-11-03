import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { projects } from "../data/projects";
import { notes } from "../data/notes";
import { site } from "../data/site";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

/* 首页只承担三件事：定位、精选项目、笔记入口。
   项目全量清单在 /projects，笔记全文与分类在 /notes，联系方式由全站 Footer 承担。 */

const stackLine = ["Agentic RAG", "MCP 知识操作层", "Skills 分发", "评测先行"];

/* 精选行只留一个可核对的数字，完整证据行在项目列表页。 */
const proof: Record<string, string> = {
  secrag: "256 测试用例",
  "llm-wiki-mcp": "94 测试用例",
  "agent-skills": "696 行测试",
  "llamaindex-rag": "171 测试用例",
};

/* 每行补一句它解决的工程约束——原首页三个项目区块的重复表述收敛到这里。 */
const constraint: Record<string, string> = {
  secrag: "权限在检索前生效，引用与数字逐条校验",
  "llm-wiki-mcp": "写入先候选，评审通过才进正式知识",
  "agent-skills": "单一源码，冲突时停止而非覆盖",
  "llamaindex-rag": "每一步都能回到 PDF 原文核对",
};

/* 首页只放三篇，覆盖方法、验证与治理；完整列表在笔记页。 */
const homeNotes = ["rag-principles", "eval-engineering", "harness-engineering"];

/* ---------- 区块头 ---------- */
function SectionHead({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <Reveal className="mb-8">
      <span className="kicker accent">{kicker}</span>
      <h2 className="mt-4 max-w-[24ch] font-display text-[2rem] leading-[1.06] font-semibold tracking-[-0.02em] text-ink sm:text-[2.25rem]">
        {title}
      </h2>
      {children ? (
        <p className="mt-4 max-w-[52ch] text-[0.86rem] leading-relaxed text-muted">
          {children}
        </p>
      ) : null}
    </Reveal>
  );
}

/* ---------- Masthead ---------- */
function Masthead() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1180px] px-6 pt-9 pb-10">
        <Reveal>
          <div className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="kicker">PORTFOLIO — AI AGENT ENGINEERING</span>
            <span className="font-mono text-[0.62rem] font-medium tracking-[0.12em] text-faint uppercase">
              {site.issue}
            </span>
          </div>
        </Reveal>

        <Reveal>
          <h1 className="mt-6 font-display text-[clamp(3.2rem,9vw,5.6rem)] leading-[0.95] font-semibold tracking-[-0.02em] text-ink">
            {site.name}
          </h1>
        </Reveal>

        <Reveal>
          <p className="mt-6 max-w-[46ch] font-sans text-[clamp(1.35rem,3vw,1.7rem)] leading-[1.32] font-medium text-ink">
            10 年证券客户端工程，
            <br />
            现在构建<em className="font-semibold text-accent not-italic">可验证、可审计</em>
            的 AI Agent 系统。
          </p>
        </Reveal>

        <Reveal>
          <div className="mt-6 grid grid-cols-1 items-end gap-6 border-t border-line pt-5 md:grid-cols-[1.1fr_0.9fr]">
            <p className="max-w-[52ch] text-[0.86rem] leading-relaxed text-muted">
              {site.intro}
            </p>
            <div className="flex flex-wrap gap-3 md:justify-self-end">
              <Link
                to="/projects"
                className="group inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-5 py-2.5 font-mono text-[0.72rem] font-semibold text-paper transition-colors hover:border-accent hover:bg-accent hover:text-paper"
              >
                查看项目
                <span className="transition-transform group-hover:translate-x-0.5">↗</span>
              </Link>
              <Link
                to="/about"
                className="group inline-flex items-center gap-2 rounded-full border border-line-strong bg-transparent px-5 py-2.5 font-mono text-[0.72rem] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                了解经历
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-6 flex flex-col gap-2 border-t border-line pt-4 font-mono text-[0.64rem] tracking-[0.08em] text-faint uppercase sm:flex-row sm:items-center sm:justify-between">
            <span>{stackLine.join("  /  ")}</span>
            <span>全职 · 深圳或远程 · 可立即入职</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Selected Work ---------- */
function SelectedWork() {
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1180px] px-6 py-14">
        <SectionHead kicker="SELECTED WORK / 01" title="四个项目，同一条工程主线">
          先定边界，再谈能力：可信问答、知识治理、能力分发，以及把检索链路拆开逐段验证。
        </SectionHead>
        <Reveal>
          <div className="border-t border-line">
            {featured.map((p, i) => (
              <Link
                key={p.slug}
                to={`/projects/${p.slug}`}
                className="hover-row group grid grid-cols-[2rem_1fr] items-start gap-x-4 gap-y-1 border-b border-line py-5 text-ink no-underline sm:grid-cols-[3rem_1fr_auto] sm:gap-x-7"
              >
                <span className="font-mono text-[0.72rem] font-semibold text-faint sm:pt-1">
                  P{i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[1.3rem] font-semibold leading-snug tracking-[-0.01em] transition-colors group-hover:text-accent">
                    {p.name}
                  </span>
                  <span className="mt-1 block text-[0.82rem] leading-relaxed text-ink-soft">
                    {p.q}
                  </span>
                  <span className="mt-1.5 block font-mono text-[0.66rem] tracking-[0.04em] text-muted">
                    {constraint[p.slug]}
                  </span>
                </span>
                <span className="col-start-2 hidden font-mono text-[0.66rem] text-faint sm:col-start-3 sm:block sm:pt-1.5">
                  {proof[p.slug]}
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
        <Reveal>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <Link
              to="/projects"
              className="group inline-flex items-center gap-2 font-mono text-[0.72rem] font-semibold text-ink no-underline"
            >
              全部 {projects.length} 个项目
              <span className="text-accent transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <span className="font-mono text-[0.66rem] text-faint">
              另有 {rest.map((p) => p.name).join("、")}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Field Notes ---------- */
function FieldNotes() {
  const picked = homeNotes.flatMap((slug) => notes.filter((n) => n.slug === slug));

  return (
    <section className="border-b border-line bg-paper-2">
      <div className="mx-auto max-w-[1180px] px-6 py-14">
        <SectionHead kicker="FIELD NOTES / 02" title="把学习编译成可复用的工程判断">
          只列三篇直接支撑项目设计的笔记：检索链路怎么验证、质量怎么回归、Agent 运行环境要哪些约束。
        </SectionHead>
        <Reveal>
          <div className="border-t border-line">
            {picked.map((n) => (
              <Link
                key={n.slug}
                to={`/notes/${n.slug}`}
                className="hover-row group grid grid-cols-[1fr_auto] items-center gap-x-4 border-b border-line py-4 text-ink no-underline"
              >
                <span className="min-w-0">
                  <span className="block font-display text-[1.12rem] font-semibold text-ink">
                    {n.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.76rem] text-muted">
                    {n.description}
                  </span>
                </span>
                <span className="font-mono text-[0.6rem] tracking-[0.08em] text-faint">
                  {n.confidence}
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
        <Reveal>
          <Link
            to="/notes"
            className="group mt-6 inline-flex items-center gap-2 font-mono text-[0.72rem] font-semibold text-ink no-underline"
          >
            全部 {notes.length} 篇工程笔记
            <span className="text-accent transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function Home() {
  useDocumentMeta(
    "Jaron Lu · AI Agent Engineer",
    "Jaron Lu 的工程作品集：可信 RAG、知识操作层、Agent Skills 与 RAG 分阶段实现。把金融客户端的工程约束，编译成可信的 AI Agent 系统。"
  );

  return (
    <>
      <Masthead />
      <SelectedWork />
      <FieldNotes />
    </>
  );
}
