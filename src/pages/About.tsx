import { Link } from "react-router-dom";
import { PageHead } from "../components/PageHead";
import { Reveal } from "../components/Reveal";
import { site } from "../data/site";

const timeline = [
  {
    span: "2015—2024",
    practice: "iOS 证券客户端与核心 SDK",
    takeaway: "主导交易链路、实时行情推送与客户端安全体系，负责多券商适配与模块化架构治理",
  },
  {
    span: "2024—2026",
    practice: "HarmonyOS 证券项目",
    takeaway: "技术负责人，设计 ArkTS 状态编排与公共能力层，落地闪电交易、路由体系与跨端复用",
  },
  {
    span: "2026—至今",
    practice: "AI Agent / RAG / MCP",
    takeaway: "独立设计 Agentic RAG、知识操作层与能力分发基座，覆盖权限治理、引用验证与审计追踪",
  },
];

const stack = [
  {
    group: "AI / Agent",
    items: "LangGraph、LangChain、RAG、MCP、ChromaDB、FastAPI",
  },
  {
    group: "客户端",
    items: "Objective-C / iOS、ArkTS / ArkUI、Flutter",
  },
  {
    group: "工程化",
    items: "Python / uv、CI/CD、自动化脚本、模块化治理、知识库工程",
  },
];

const currentProjects = [
  {
    name: "SecRAG",
    desc: "面向机构投研的 Agentic RAG，重点解决检索权限、数字与引用验证、审计追踪。",
    to: "/projects/secrag",
  },
  {
    name: "llm-wiki-mcp",
    desc: "受治理的知识操作层，用候选评审代替 Agent 对正式知识页的直接写入。",
    to: "/projects/llm-wiki-mcp",
  },
  {
    name: "agent-skills",
    desc: "自研 Skills 的单一源码与跨 Codex、Claude、Hermes 分发基座。",
    to: "/projects/agent-skills",
  },
];

export function About() {
  return (
    <>
      <PageHead kicker="ABOUT" title="关于我">
        把长期处理过的状态、权限、安全、错误恢复和发布约束，迁移到可验证的 Agent 系统中。
      </PageHead>

      <div className="mx-auto max-w-[820px] px-6 py-12">
        <Reveal>
          <div className="prose">
            <p>
              我是 Jaron Lu，10 年证券金融客户端工程经验，目前专注 AI Agent 与 LLM 应用工程。
            </p>
            <p>
              从证券交易链路到 Agent 工作流，我的工程直觉始终一致：系统可信度不来自功能多，而来自边界清、验证严、可追溯。我把金融场景的权限治理、错误恢复和发布约束迁移到 Agent 系统设计中，专注解决"模型能回答不等于回答可信"这个核心问题。
            </p>
          </div>
        </Reveal>

        <Reveal>
          <h2 className="mt-12 mb-4 font-display text-[1.55rem] font-semibold tracking-[-0.01em] text-ink">
            经历主线
          </h2>
          <div className="border-t border-line">
            {timeline.map((t) => (
              <div
                key={t.span}
                className="grid grid-cols-[6.5rem_1fr] gap-x-5 gap-y-1 border-b border-line py-4 sm:grid-cols-[10rem_1fr]"
              >
                <span className="font-mono text-[0.72rem] font-semibold text-faint">
                  {t.span}
                </span>
                <div className="min-w-0">
                  <p className="text-[0.9rem] font-medium text-ink">{t.practice}</p>
                  <p className="mt-0.5 text-[0.8rem] text-muted">{t.takeaway}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <h2 className="mt-12 mb-4 font-display text-[1.55rem] font-semibold tracking-[-0.01em] text-ink">
            为什么转到 AI Agent
          </h2>
          <div className="prose border-l-2 border-accent pl-5">
            <p>
              10 年证券客户端工程让我习惯了一个判断：交易链路不能出错，行情推送不能丢，权限边界不能越。这些约束塑造了我的工程直觉——系统的可信度不来自功能多，而来自边界清、验证严、可追溯。
            </p>
            <p>
              AI Agent 恰恰是最需要这种工程纪律的领域。模型能回答不等于回答可信，工具能调用不等于调用安全，Agent 能自主不等于结果可审计。大多数 Demo 停在"能跑"，但生产系统需要回答：谁能看什么？输出基于什么证据？出错了怎么追溯？
            </p>
            <p>
              我把金融场景的工程约束迁移到 Agent 系统设计中，专注解决权限、验证和可审计性这些"不性感但决定系统能不能上线"的问题。
            </p>
          </div>
        </Reveal>

        <Reveal>
          <h2 className="mt-12 mb-4 font-display text-[1.55rem] font-semibold tracking-[-0.01em] text-ink">
            当前项目
          </h2>
          <ul className="space-y-3 border-t border-line pt-4 text-[0.88rem] leading-relaxed text-muted">
            {currentProjects.map((p) => (
              <li key={p.name}>
                <Link to={p.to} className="font-semibold text-accent">
                  {p.name}
                </Link>
                ：{p.desc}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal>
          <h2 className="mt-12 mb-4 font-display text-[1.55rem] font-semibold tracking-[-0.01em] text-ink">
            技术栈
          </h2>
          <div className="border-t border-line">
            {stack.map((s) => (
              <div
                key={s.group}
                className="grid grid-cols-[6rem_1fr] gap-x-5 border-b border-line py-3.5"
              >
                <span className="font-mono text-[0.66rem] font-semibold tracking-[0.06em] text-accent uppercase">
                  {s.group}
                </span>
                <span className="text-[0.84rem] text-ink-soft">{s.items}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <h2 className="mt-12 mb-4 font-display text-[1.55rem] font-semibold tracking-[-0.01em] text-ink">
            联系
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-5">
            <a
              href={site.github}
              target="_blank"
              rel="noreferrer"
              className="border-b border-line-strong pb-0.5 font-mono text-[0.8rem] font-semibold text-ink no-underline transition-colors hover:border-accent hover:text-accent"
            >
              github.com/jaronlu ↗
            </a>
            <a
              href={`mailto:${site.email}`}
              className="border-b border-line-strong pb-0.5 font-mono text-[0.8rem] font-semibold text-ink no-underline transition-colors hover:border-accent hover:text-accent"
            >
              {site.email}
            </a>
            <a
              href={site.linkedin}
              target="_blank"
              rel="noreferrer"
              className="border-b border-line-strong pb-0.5 font-mono text-[0.8rem] font-semibold text-ink no-underline transition-colors hover:border-accent hover:text-accent"
            >
              LinkedIn ↗
            </a>
          </div>
        </Reveal>
      </div>
    </>
  );
}
