import { Link } from "react-router-dom";
import { PageHead } from "../components/PageHead";
import { Reveal } from "../components/Reveal";
import { courseLessons, courseManifest, courseTiers, type CourseLesson } from "../data/course";

const tierOrder = [1, 2, 3, 4, 5, 6] as const;

/** 全文已发布课程的校准状态：首页、目录页、详情页共用同一套说法。 */
const statusLabel = (lesson: CourseLesson) =>
  lesson.calibrated ? "CALIBRATED" : "CALIBRATING";

/** 已收录全文的课程行：可点击进详情页。 */
function PublishedRow({ lesson }: { lesson: CourseLesson }) {
  return (
    <Link
      to={`/agent-course/${lesson.slug}`}
      className="hover-row group grid grid-cols-[2rem_1fr_auto] items-center gap-x-4 gap-y-0.5 border-b border-line py-4 text-ink no-underline sm:grid-cols-[3rem_1fr_auto_auto] sm:gap-x-7"
    >
      <span className="font-mono text-[0.72rem] font-semibold text-faint">
        L{String(lesson.num).padStart(2, "0")}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[1.15rem] font-semibold text-ink">
          {lesson.title}
        </span>
        <span className="mt-0.5 block truncate text-[0.76rem] text-muted">
          {lesson.oneLine}
        </span>
        {/* 窄屏放不下右侧徽章，把状态贴在标题下方，保证移动端也能看到校准状态 */}
        <span
          className={`mt-1 block font-mono text-[0.58rem] font-semibold tracking-[0.08em] sm:hidden ${
            lesson.calibrated ? "text-muted" : "text-accent"
          }`}
        >
          {statusLabel(lesson)}
        </span>
      </span>
      <span
        className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold tracking-[0.08em] sm:inline-flex ${
          lesson.calibrated ? "border-line text-muted" : "border-line text-accent"
        }`}
      >
        {statusLabel(lesson)}
      </span>
      <span className="justify-self-end text-center text-[0.95rem] text-accent transition-transform group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}

/** 未收录全文的课程行：仅目录展示，不可点。 */
function CatalogRow({ lesson }: { lesson: CourseLesson }) {
  return (
    <div className="grid grid-cols-[2rem_1fr] items-center gap-x-4 gap-y-0.5 border-b border-line py-4 sm:grid-cols-[3rem_1fr] sm:gap-x-7">
      <span className="font-mono text-[0.72rem] font-semibold text-faint">
        L{String(lesson.num).padStart(2, "0")}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[1.15rem] font-semibold text-faint">
          {lesson.title}
        </span>
        <span className="mt-0.5 block truncate text-[0.76rem] text-faint">
          {lesson.oneLine}
        </span>
      </span>
    </div>
  );
}

export function AgentCourse() {
  return (
    <>
      <PageHead
        kicker="AGENT CURRICULUM"
        title="Agent 知识体系"
        metaDescription={`${courseManifest.total} 课 AI Agent 系统课程目录：消息协议、核心机制、架构模式、工程落地、框架工具与生产治理。收录 ${courseManifest.published} 篇精校全文，全部标注资料来源与校准状态。`}
      >
        把 Agent 知识拆成六层：概念、机制、架构、工程、框架、生产。每篇课文都标注资料来源与校准状态。
      </PageHead>

      <section className="border-b border-line">
        <div className="mx-auto max-w-[1180px] px-6 py-10">
          <Reveal>
            <p className="mb-8 max-w-[62ch] text-[0.82rem] leading-relaxed text-muted">
              <b className="text-ink">{courseManifest.total} 课</b>
              系统学习笔记（AI 协助整理，逐课标注论文 / 官方文档来源），本站收录其中{" "}
              <b className="text-ink">{courseManifest.published} 篇</b>全文，第 37 课源稿整理中、暂只列目录。
              框架类课程（第⑤层）时效敏感，结论以官方文档为准。
            </p>
          </Reveal>

          {tierOrder.map((tier) => {
            const lessons = courseLessons.filter((l) => l.tier === tier);
            if (lessons.length === 0) return null;
            return (
              <div key={tier} className="mb-10">
                <Reveal>
                  <h2 className="mb-3 font-mono text-[0.68rem] font-semibold tracking-[0.14em] text-accent uppercase">
                    {courseTiers[tier].label}
                  </h2>
                </Reveal>
                <Reveal>
                  <div className="border-t border-line">
                    {lessons.map((lesson) =>
                      lesson.slug ? (
                        <PublishedRow key={lesson.num} lesson={lesson} />
                      ) : (
                        <CatalogRow key={lesson.num} lesson={lesson} />
                      )
                    )}
                  </div>
                </Reveal>
              </div>
            );
          })}

          <Reveal>
            <p className="max-w-[62ch] text-[0.76rem] leading-relaxed text-faint">
              这套课程是学习材料；落到工程决策上的结论已蒸馏进{" "}
              <Link to="/notes" className="text-accent underline underline-offset-[3px]">
                工程笔记
              </Link>
              ，两边的口径一致：边界先于能力，验证先于交付。
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
