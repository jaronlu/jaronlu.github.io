import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { projects } from "../data/projects";
import { notes } from "../data/notes";
import { site } from "../data/site";

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
      <h2 className="mt-4 max-w-[22ch] font-display text-[2rem] leading-[1.06] font-semibold tracking-[-0.02em] text-ink sm:text-[2.25rem]">
        {title}
      </h2>
      {children ? (
        <p className="mt-4 max-w-[46ch] text-[0.86rem] leading-relaxed text-muted">
          {children}
        </p>
      ) : null}
    </Reveal>
  );
}

/* ---------- Masthead ---------- */
function Masthead() {
  return (
    <section className="border-b border-line-strong">
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
          <p className="mt-6 max-w-[28ch] font-sans text-[clamp(1.35rem,3vw,1.7rem)] leading-[1.32] font-medium text-ink">
            10 年金融工程经验，
            <br />
            构建<em className="font-semibold text-accent not-italic">可验证、可审计</em>
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
                className="group inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-5 py-2.5 font-mono text-[0.72rem] font-semibold text-paper transition-colors hover:border-accent hover:bg-accent hover:text-white"
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

        {/* 核心能力：具体技术栈 + 可验证成果，而非空泛数量 */}
        <Reveal>
          <div className="mt-8 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Agentic RAG", desc: "LangGraph 嵌套图编排，服务端身份绑定、权限前置、引用校验、合规检查" },
              { label: "知识治理", desc: "MCP 知识操作层，Candidate-first 写入，raw create-only，路径边界强制" },
              { label: "能力分发", desc: "Skills 单一源码，跨 Codex / Claude / Hermes 幂等同步，冲突时停止" },
              { label: "工程验证", desc: "256 测试用例覆盖 SecRAG 全链路，696 行测试覆盖分发引擎，可复现评估" },
            ].map((c) => (
              <div key={c.label} className="bg-paper p-4">
                <div className="font-mono text-[0.62rem] font-semibold tracking-[0.08em] text-accent uppercase">
                  {c.label}
                </div>
                <p className="mt-2 text-[0.76rem] leading-relaxed text-muted">{c.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- What I Solve ---------- */
function WhatISolve() {
  const problems = [
    {
      label: "01",
      title: "把 RAG 从 Demo 推向生产",
      body: "权限前置、引用校验、审计追踪——让问答系统的每一步都可复盘，而不是靠模型自觉。",
      link: "/projects/secrag",
      linkText: "SecRAG",
    },
    {
      label: "02",
      title: "为 Agent 建立知识治理层",
      body: "候选评审、安全边界、跨 Agent 复用——让 Agent 维护知识时不越权、不漂移、可审计。",
      link: "/projects/llm-wiki-mcp",
      linkText: "llm-wiki-mcp",
    },
    {
      label: "03",
      title: "能力分发保持确定性",
      body: "单一源码、冲突保护、幂等同步——让自研 Skills 跨 Codex / Claude / Hermes 保持同一版本。",
      link: "/projects/agent-skills",
      linkText: "agent-skills",
    },
  ];
  return (
    <section className="border-b border-line bg-paper-2">
      <div className="mx-auto max-w-[1180px] px-6 py-14">
        <SectionHead kicker="WHAT I SOLVE / 01" title="不是再做一个 Demo，而是把 Agent 推向生产">
          三个贯穿项目的工程问题，也是大多数团队从 PoC 到上线时卡住的地方。
        </SectionHead>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
          {problems.map((p, i) => (
            <Reveal key={p.label}>
              <article
                className="flex h-full flex-col border-t-2 border-line-strong pt-5"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <span className="font-mono text-[0.62rem] font-semibold text-accent">{p.label}</span>
                <h3 className="mt-3 font-display text-[1.25rem] font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 flex-1 text-[0.82rem] leading-relaxed text-muted">{p.body}</p>
                <Link
                  to={p.link}
                  className="group mt-4 inline-flex items-center gap-2 border-t border-line pt-4 text-ink no-underline"
                >
                  <b className="text-[0.74rem] font-semibold">{p.linkText}</b>
                  <span className="text-[0.85rem] text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Engineering Lens ---------- */
const lens = [
  {
    label: "ACCESS",
    title: "权限在检索前生效",
    body: "模型只接触当前角色可见的材料，不依赖提示词补救。",
    proof: "SecRAG",
    proofSub: "RBAC 检索隔离",
    to: "/projects/secrag",
  },
  {
    label: "WRITE",
    title: "写入先候选，后发布",
    body: "Agent 产出先进入评审层，不直接覆盖正式知识。",
    proof: "llm-wiki-mcp",
    proofSub: "Candidate-first",
    to: "/projects/llm-wiki-mcp",
  },
  {
    label: "DELIVERY",
    title: "能力分发保持确定性",
    body: "用单一源码、冲突保护和幂等验证替代手工同步。",
    proof: "agent-skills",
    proofSub: "配置驱动分发",
    to: "/projects/agent-skills",
  },
];

function EngineeringLens() {
  return (
    <section className="border-y border-line bg-paper-2">
      <div className="mx-auto max-w-[1180px] px-6 py-14">
        <SectionHead kicker="ENGINEERING LENS / 03" title="把工程约束放在模型之前">
          从证券客户端到 Agent 系统，核心判断没有变：边界必须先于能力，关键动作必须可验证。
        </SectionHead>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
          {lens.map((item, i) => (
            <Reveal key={item.label}>
              <article
                className="flex h-full flex-col border-t-2 border-line-strong pt-5"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <span className="font-mono text-[0.62rem] font-semibold text-accent">
                  {item.label}
                </span>
                <h3 className="mt-3 font-display text-[1.25rem] font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-[0.82rem] leading-relaxed text-muted">
                  {item.body}
                </p>
                <Link
                  to={item.to}
                  className="group mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-2.5 border-t border-line pt-4 text-ink no-underline"
                >
                  <b className="text-[0.74rem] font-semibold">{item.proof}</b>
                  <span className="truncate text-[0.68rem] text-muted">{item.proofSub}</span>
                  <span className="text-[0.85rem] text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    ↗
                  </span>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Featured Work ---------- */
function FeaturedWork() {
  const featured = projects.filter((p) => p.featured);
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1180px] px-6 py-14">
        <SectionHead kicker="SELECTED WORK / 02" title="一条贯穿的 Agent 工程链路">
          从可信问答、知识操作层到能力分发，三个项目共享同一组工程判断。
        </SectionHead>
        <Reveal>
          <div className="border-t border-line-strong">
            {featured.map((p, i) => (
              <Link
                key={p.slug}
                to={`/projects/${p.slug}`}
                className="hover-row group grid grid-cols-[2rem_1fr] items-baseline gap-x-4 gap-y-1 border-b border-line py-4 text-ink no-underline sm:grid-cols-[3rem_1fr_auto] sm:gap-x-7"
              >
                <span className="font-mono text-[0.72rem] font-semibold text-faint">
                  P{i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[1.3rem] font-semibold leading-snug tracking-[-0.01em]">
                    {p.name}
                  </span>
                  <span className="mt-1 block text-[0.8rem] text-ink-soft">{p.q}</span>
                </span>
                <span className="col-start-2 hidden text-[0.85rem] text-accent transition-transform group-hover:translate-x-1 sm:col-start-3 sm:block">
                  →
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
        <Reveal>
          <Link
            to="/projects"
            className="group mt-6 inline-flex items-center gap-2 font-mono text-[0.72rem] font-semibold text-ink no-underline"
          >
            查看全部项目
            <span className="text-accent transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Field Notes ---------- */
function FieldNotes() {
  return (
    <section className="border-b border-line bg-paper-2">
      <div className="mx-auto max-w-[1180px] px-6 py-14">
        <SectionHead kicker="FIELD NOTES / 04" title="把学习编译成可复用的工程判断">
          围绕 Agent Runtime、RAG、MCP、Loop、Harness、Eval 与知识治理，记录直接支撑项目设计的约束与取舍。
        </SectionHead>
        <Reveal>
          <div className="border-t border-line-strong">
            {notes.map((n, i) => (
              <Link
                key={n.slug}
                to={`/notes/${n.slug}`}
                className="hover-row group grid grid-cols-[2rem_1fr_1.5rem] items-center gap-x-4 gap-y-0.5 border-b border-line py-3.5 text-ink no-underline sm:grid-cols-[3rem_1fr_2rem] sm:gap-x-7"
              >
                <span className="font-mono text-[0.72rem] font-semibold text-faint">
                  N{i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[1.1rem] font-semibold text-ink">
                    {n.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.76rem] text-muted">
                    {n.description}
                  </span>
                </span>
                <span className="justify-self-end text-center text-[0.95rem] text-accent transition-transform group-hover:translate-x-1">
                  →
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
            查看全部工程笔记
            <span className="text-accent transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Contact ---------- */
function Contact() {
  return (
    <section className="border-b border-line-strong bg-paper-2">
      <div className="mx-auto max-w-[1180px] px-6 py-14">
        <Reveal>
          <span className="kicker accent">CONTACT / 05</span>
          <p className="mt-4 max-w-[40ch] font-display text-[1.55rem] leading-[1.25] font-semibold tracking-[-0.01em] text-ink">
            正在寻找 AI Agent / LLM 应用工程机会——优先考虑需要把 Agent 从 Demo 推向生产的团队。
          </p>
          <p className="mt-3 max-w-[46ch] font-mono text-[0.72rem] tracking-wider text-muted uppercase">
            全职 · 深圳或远程 · 可立即入职
          </p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-2 border-b border-line-strong pb-0.5 font-mono text-[0.78rem] font-semibold text-ink no-underline transition-colors hover:border-accent hover:text-accent"
            >
              {site.email}
              <span>→</span>
            </a>
            <a
              href={site.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border-b border-line-strong pb-0.5 font-mono text-[0.78rem] font-semibold text-ink no-underline transition-colors hover:border-accent hover:text-accent"
            >
              GitHub
              <span>↗</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Home() {
  return (
    <>
      <Masthead />
      <WhatISolve />
      <FeaturedWork />
      <EngineeringLens />
      <FieldNotes />
      <Contact />
    </>
  );
}
