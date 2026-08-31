import { Link } from "react-router-dom";
import { PageHead } from "../components/PageHead";
import { Reveal } from "../components/Reveal";
import { projects, upcoming } from "../data/projects";

export function Projects() {
  return (
    <>
      <PageHead kicker="PROJECTS" title="项目">
        前三个项目构成一条 Agent 工程链路：<b className="text-ink">SecRAG</b>{" "}
        解决垂直场景中的可信问答，<b className="text-ink">llm-wiki-mcp</b>{" "}
        解决知识如何被安全读写，<b className="text-ink">agent-skills</b>{" "}
        解决能力如何在多个 Agent 客户端之间一致分发。{" "}
        <b className="text-ink">ClipFlow</b>{" "}
        补充跨平台桌面客户端的产品与工程实践。
      </PageHead>

      <section className="border-b border-line">
        <div className="mx-auto max-w-[1180px] px-6 py-10">
          <Reveal>
            <div className="border-t border-line">
              {projects.map((p) => (
                <Link
                  key={p.slug}
                  to={`/projects/${p.slug}`}
                  className="hover-row group grid grid-cols-1 gap-y-1.5 border-b border-line py-5 text-ink no-underline sm:grid-cols-[3rem_1fr] sm:gap-x-7"
                >
                  <span className="font-mono text-[0.72rem] font-semibold text-faint sm:pt-1">
                    0{p.index}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-[1.35rem] font-semibold tracking-[-0.01em] text-ink transition-colors group-hover:text-accent">
                      {p.name}
                    </span>
                    <span className="mt-1 block text-[0.8rem] text-ink-soft">{p.q}</span>
                    <span className="mt-2 block font-mono text-[0.66rem] tracking-[0.02em] text-muted">
                      {p.ev}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
          <p className="mt-6 max-w-[62ch] text-[0.78rem] leading-relaxed text-faint">
            所有数字均来自当前项目源码或 Wiki 中的已核对记录；设计目标与已完成能力分开表达。
          </p>
        </div>
      </section>

      <section className="border-b border-line bg-paper-2">
        <div className="mx-auto max-w-[1180px] px-6 py-12">
          <Reveal>
            <span className="kicker accent">IN PROGRESS</span>
            <h2 className="mt-4 font-display text-[1.55rem] font-semibold tracking-[-0.01em] text-ink">
              {upcoming[0].name}
            </h2>
            <p className="mt-2 font-mono text-[0.68rem] font-semibold tracking-[0.06em] text-accent uppercase">
              {upcoming[0].status}
            </p>
            <p className="mt-4 max-w-[64ch] text-[0.86rem] leading-relaxed text-muted">
              {upcoming[0].description}
            </p>
            <ul className="mt-4 max-w-[64ch] list-disc space-y-2 pl-5 text-[0.84rem] leading-relaxed text-muted">
              {upcoming[0].bullets.map((b) => (
                <li key={b} className="[&::marker]:text-accent">
                  {b}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
