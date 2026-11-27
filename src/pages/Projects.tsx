import { Link } from "react-router-dom";
import { PageHead, PrivateTag } from "../components/PageHead";
import { projects, upcoming } from "../data/projects";

export function Projects() {
  const next = upcoming[0];
  return (
    <>
      {/* 只有标题，不带导语：数字口径不在页面上解释 */}
      <PageHead
        title="项目"
        metaDescription={`${projects.length} 个项目的工程记录：可信问答、知识编译、知识操作层、能力分发、RAG 分阶段实现、跨平台客户端与定时自动化。`}
      />

      <section className="mx-auto max-w-shell px-6">
        <ul className="border-t border-line">
          {projects.map((p) => (
            <li key={p.slug} className="border-b border-line">
              <Link to={`/projects/${p.slug}`} className="row-link block py-5">
                <span className="row-title block font-display text-[1.25rem] leading-snug font-semibold text-ink">
                  {p.name}
                  {p.repo ? null : <PrivateTag className="ml-2" />}
                </span>
                <span className="mt-1 block max-w-[46em] text-[0.9375rem] leading-[1.65] text-ink-soft">
                  {p.q}
                </span>
                <span className="mt-2 block max-w-[52em] text-[0.8125rem] leading-relaxed text-muted">
                  {p.ev}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-16 border-t border-line-strong pt-6">
          <h2 className="font-display text-[1.25rem] leading-snug font-semibold text-ink">{next.name}</h2>
          <p className="mt-1 text-[0.875rem] text-accent">{next.status}</p>
          <p className="mt-3 max-w-[46em] text-[0.9375rem] leading-[1.75] text-ink-soft">{next.description}</p>
          <ul className="mt-3 max-w-[46em] list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-[1.75] text-muted [li::marker]:text-accent">
            {next.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
