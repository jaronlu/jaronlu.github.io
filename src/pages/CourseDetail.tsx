import { lazy, Suspense, useEffect, useRef, type ComponentType, type LazyExoticComponent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ChunkErrorBoundary } from "../components/ChunkErrorBoundary";
import { highlightCodeBlocks } from "../lib/highlight";
import { courseBySlug, courseTiers } from "../data/course";
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
    const LessonHtml = () => {
      const ref = useRef<HTMLDivElement>(null);
      // 带语言标注的围栏在挂载后做语法高亮；裸围栏（ASCII 图/伪代码）保持纯文本。
      useEffect(() => {
        highlightCodeBlocks(ref.current);
      }, []);
      return (
        <div ref={ref} className="prose-body" dangerouslySetInnerHTML={{ __html: mod.default.html }} />
      );
    };
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
    <div className="mx-auto max-w-text px-6 pt-10 pb-4">
      <Link
        to="/agent-course"
        className="text-[0.875rem] text-muted no-underline transition-colors hover:text-accent"
      >
        全部课程
      </Link>

      <h1 className="mt-6 font-display text-[2.25rem] leading-[1.1] font-semibold tracking-[-0.02em] text-ink sm:text-[2.5rem]">
        {lesson.title}
      </h1>
      <p className="mt-4 max-w-[42em] text-[1.0625rem] leading-[1.75] text-ink-soft">{lesson.oneLine}</p>
      <p className="mt-2 text-[0.875rem] text-muted">
        第 {lesson.num} 课，{courseTiers[lesson.tier].label}
      </p>

      <div className="prose mt-9">
        <span className="note-confidence">
          {lesson.calibrated
            ? "来源已逐条核验（链接可访问、论文标题对齐 arXiv）；结论以官方文档为准"
            : "AI 协助整理的学习笔记，持续校准中；与官方文档不一致时以官方为准"}
        </span>
        <Suspense fallback={<p className="text-[0.875rem] text-muted">正在载入课文…</p>}>
          {/* 发版后旧 chunk 失效时给出重新加载入口；换课即换 key，boundary 复位 */}
          <ChunkErrorBoundary key={slug}>
            <Content />
          </ChunkErrorBoundary>
        </Suspense>
      </div>
    </div>
  );
}
