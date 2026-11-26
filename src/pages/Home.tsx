import { Link } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { SectionTitle } from "../components/PageHead";
import { courseLessons, courseManifest, courseTiers } from "../data/course";
import { projects } from "../data/projects";
import { site } from "../data/site";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

/* 首页只有三块：一句话定位与联系方式、全部项目、课程入口。
   项目的完整证据行在 /projects，课程目录与全文在 /agent-course。 */

const tiers = ([1, 2, 3, 4, 5, 6] as const)
  .map((tier) => ({
    tier,
    label: courseTiers[tier].label,
    count: courseLessons.filter((l) => l.tier === tier).length,
  }))
  .sort((a, b) => courseTiers[a.tier].order - courseTiers[b.tier].order);

function Hero() {
  return (
    <section className="mx-auto max-w-shell px-6 pt-16 sm:pt-24">
      <Reveal>
        {/* 每个短语是一个不可拆的整体：宽屏三行，窄屏按短语换行，不会把「可审计」拆开 */}
        <h1 className="font-display text-[clamp(1.75rem,5vw,4rem)] leading-[1.14] font-semibold tracking-[-0.02em] text-ink">
          <span className="inline-block">10 年证券客户端工程，</span>
          <span className="inline-block">现在构建可验证、可审计的</span>
          <span className="inline-block">AI Agent 系统。</span>
        </h1>
      </Reveal>
      <Reveal delay={90}>
        <p className="mt-8 max-w-[44em] text-[1.0625rem] leading-[1.75] text-ink-soft">
          {site.intro}
        </p>
      </Reveal>
      <Reveal delay={180}>
        <p className="mt-6 max-w-[44em] text-[0.9375rem] leading-[1.75] text-muted">
          {site.availability}
        </p>
        <a
          href={`mailto:${site.email}`}
          className="mt-2 inline-block text-[0.9375rem] text-accent underline underline-offset-4 transition-colors hover:text-ink"
        >
          {site.email}
        </a>
      </Reveal>
    </section>
  );
}

function ProjectIndex() {
  return (
    <section className="mx-auto max-w-shell px-6 pt-16">
      <SectionTitle title="项目" meta={`${projects.length} 个`} to="/projects" />
      <p className="mt-2 max-w-[42em] text-[0.9375rem] leading-[1.75] text-muted">
        不该看的看不到，要改的先过审，说出口的能翻回原文。
      </p>
      <ul className="mt-4 border-t border-line">
        {projects.map((p) => (
          <li key={p.slug} className="border-b border-line">
            <Link
              to={`/projects/${p.slug}`}
              className="row-link grid grid-cols-1 gap-y-1.5 py-5 sm:grid-cols-[minmax(0,1fr)_max-content] sm:items-baseline sm:gap-x-12"
            >
              <span className="min-w-0">
                <span className="row-title block font-display text-[1.25rem] leading-snug font-semibold text-ink">
                  {p.name}
                </span>
                <span className="mt-1 block max-w-[42em] text-[0.9375rem] leading-[1.65] text-ink-soft">
                  {p.q}
                </span>
              </span>
              <span className="text-[0.875rem] whitespace-nowrap text-muted sm:text-right">
                {p.proof}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CourseIndex() {
  return (
    <section className="mx-auto max-w-shell px-6 pt-16">
      <SectionTitle title="知识体系" meta={`${courseManifest.total} 课`} to="/agent-course" />
      <p className="mt-2 max-w-[42em] text-[0.9375rem] leading-[1.75] text-muted">
        系统学习笔记，AI 协助整理，来源已逐条核验；本站收录 {courseManifest.published} 篇全文。
      </p>
      {/* 六层各链到目录页对应小节（#tier-N） */}
      <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-4">
        {tiers.map((t) => (
          <li key={t.tier}>
            <Link
              to={`/agent-course#tier-${t.tier}`}
              className="row-link inline-flex items-baseline gap-x-1.5 text-[0.9375rem]"
            >
              <span className="row-title text-ink">{t.label}</span>
              <span className="text-[0.8125rem] text-muted">{t.count} 课</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Home() {
  useDocumentMeta(`${site.name} · ${site.role}`, site.homeDescription);

  return (
    <>
      <Hero />
      <ProjectIndex />
      <CourseIndex />
    </>
  );
}
