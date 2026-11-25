import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { courseBySlug } from "../data/course";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

/**
 * 课程正文 JSON（scripts/build-agent-course.mjs 产物，{ html } 结构）。
 * 用 import.meta.glob 注册成懒加载组件：访问哪课才拉哪课的 JSON，不进主包。
 */
const lessonModules = import.meta.glob<{ default: { html: string } }>(
  "../content/agent-course/generated/*.json"
);

const contentMap: Record<string, LazyExoticComponent<ComponentType>> = {};
for (const [path, loader] of Object.entries(lessonModules)) {
  const slug = path.split("/").pop()?.replace(/\.json$/, "") ?? "";
  contentMap[slug] = lazy(async () => {
    const mod = await loader();
    // marked 产出的 HTML 来自仓库内自己清洗过的课文，非用户输入，可直接注入。
    const LessonHtml = () => (
      <div className="prose-body" dangerouslySetInnerHTML={{ __html: mod.default.html }} />
    );
    return { default: LessonHtml };
  });
}

export function CourseDetail() {
  const { slug } = useParams();
  const lesson = slug ? courseBySlug(slug) : undefined;
  const Content = slug ? contentMap[slug] : undefined;

  useDocumentMeta(
    lesson ? `${lesson.title} · Agent 知识体系 · Jaron Lu` : "Agent 知识体系 · Jaron Lu",
    lesson ? `${lesson.oneLine}。系统课程第 ${lesson.num} 课，标注资料来源与校准状态。` : undefined
  );

  if (!lesson || !lesson.slug || !Content) {
    return <Navigate to="/agent-course" replace />;
  }

  return (
    <div className="mx-auto max-w-[820px] px-6 pt-10 pb-4">
      <Reveal>
        <Link
          to="/agent-course"
          className="group inline-flex items-center gap-2 font-mono text-[0.7rem] font-semibold text-muted no-underline transition-colors hover:text-accent"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          全部课程
        </Link>
      </Reveal>

      <Reveal>
        <span className="kicker accent mt-6">AGENT CURRICULUM / L{String(lesson.num).padStart(2, "0")}</span>
        <h1 className="mt-4 font-display text-[2.2rem] leading-[1.1] font-semibold tracking-[-0.02em] text-ink sm:text-[2.5rem]">
          {lesson.title}
        </h1>
        <p className="mt-3 max-w-[56ch] text-[0.86rem] text-muted">{lesson.oneLine}</p>
      </Reveal>

      <div className="prose mt-10 min-h-[60vh]">
        <span className="note-confidence">
          {lesson.calibrated
            ? "CALIBRATED — 已对照官方文档逐条校准"
            : "学习笔记 — AI 协助整理，持续校准中；与官方文档不一致时以官方为准"}
        </span>
        <Suspense fallback={<p className="font-mono text-[0.7rem] text-muted">正在载入课文…</p>}>
          <Content />
        </Suspense>
      </div>
    </div>
  );
}
