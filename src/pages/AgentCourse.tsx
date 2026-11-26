import { Link } from "react-router-dom";
import { PageHead, SectionTitle } from "../components/PageHead";
import { courseLessons, courseManifest, courseTiers, type CourseLesson } from "../data/course";

const tiers = [1, 2, 3, 4, 5, 6] as const;

const ROW_GRID =
  "grid grid-cols-1 gap-y-0.5 py-3 sm:grid-cols-[minmax(12rem,20rem)_minmax(0,1fr)] sm:items-baseline sm:gap-x-8";

/** 已收录全文的课程行：整行可点进详情页。 */
function PublishedRow({ lesson }: { lesson: CourseLesson }) {
  return (
    <li className="border-b border-line">
      <Link to={`/agent-course/${lesson.slug}`} className={`row-link ${ROW_GRID}`}>
        <span className="row-title font-display text-[1.0625rem] leading-snug font-semibold text-ink">
          {lesson.title}
        </span>
        <span className="text-[0.875rem] leading-relaxed text-muted">{lesson.oneLine}</span>
      </Link>
    </li>
  );
}

/** 未收录全文的课程行：仅目录展示，不可点。 */
function CatalogRow({ lesson }: { lesson: CourseLesson }) {
  return (
    <li className={`border-b border-line ${ROW_GRID}`}>
      <span className="font-display text-[1.0625rem] leading-snug font-semibold text-muted">
        {lesson.title}
      </span>
      <span className="text-[0.875rem] leading-relaxed text-muted">
        {lesson.oneLine}
        <span className="text-faint">（全文整理中）</span>
      </span>
    </li>
  );
}

export function AgentCourse() {
  return (
    <>
      <PageHead
        title="Agent 知识体系"
        metaDescription={`${courseManifest.total} 课 AI Agent 系统课程目录：消息协议、核心机制、架构模式、工程落地、框架工具与生产治理。收录 ${courseManifest.published} 篇全文，来源已逐条核验。`}
      >
        {courseManifest.total} 课，从基础概念到评估与生产分六层。本站收录 {courseManifest.published}{" "}
        篇全文，来源已逐条核验；框架类课程时效敏感，结论以官方文档为准。
      </PageHead>

      <section className="mx-auto max-w-shell px-6">
        {tiers.map((tier) => {
          const lessons = courseLessons.filter((l) => l.tier === tier);
          if (lessons.length === 0) return null;
          return (
            <div key={tier} className="mb-12">
              {/* 首页「知识体系」区块链到 #tier-N；tabIndex 让锚点可接收焦点 */}
              <SectionTitle
                id={`tier-${tier}`}
                title={courseTiers[tier].label}
                meta={`${lessons.length} 课`}
              />
              <ul className="mt-2 border-t border-line">
                {lessons.map((lesson) =>
                  lesson.slug ? (
                    <PublishedRow key={lesson.num} lesson={lesson} />
                  ) : (
                    <CatalogRow key={lesson.num} lesson={lesson} />
                  )
                )}
              </ul>
            </div>
          );
        })}

        <p className="max-w-[46em] text-[0.9375rem] leading-[1.75] text-muted">
          这套课程是学习材料；落到工程决策上的结论在{" "}
          <Link to="/notes" className="text-accent underline underline-offset-4 hover:text-ink">
            工程笔记
          </Link>
          ，两边口径一致：边界先于能力，验证先于交付。
        </p>
      </section>
    </>
  );
}
