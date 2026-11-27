import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ChunkErrorBoundary } from "../components/ChunkErrorBoundary";
import { projectBySlug } from "../data/projects";
import { PrivateTag } from "../components/PageHead";
import { site } from "../data/site";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
/**
 * 正文按路由懒加载：八个项目的 Markdown 级正文合计占比最大，
 * 静态导入会让首页也下载全部项目文本。这里改成动态 import，Vite 会切成独立 chunk。
 */
const contentMap: Record<string, LazyExoticComponent<ComponentType>> = {
  secrag: lazy(() => import("../content/projects/secrag").then((m) => ({ default: m.SecRAGContent }))),
  "llm-wiki-mcp": lazy(() =>
    import("../content/projects/llm-wiki-mcp").then((m) => ({ default: m.LlmWikiMcpContent }))
  ),
  "agent-skills": lazy(() =>
    import("../content/projects/agent-skills").then((m) => ({ default: m.AgentSkillsContent }))
  ),
  "clip-flow": lazy(() =>
    import("../content/projects/clip-flow").then((m) => ({ default: m.ClipFlowContent }))
  ),
  "ai-engineering-hub": lazy(() =>
    import("../content/projects/ai-engineering-hub").then((m) => ({ default: m.AiEngineeringHubContent }))
  ),
  "llamaindex-rag": lazy(() =>
    import("../content/projects/llamaindex-rag").then((m) => ({ default: m.LlamaIndexRagContent }))
  ),
  "doubao-cron": lazy(() =>
    import("../content/projects/doubao-cron").then((m) => ({ default: m.DoubaoCronContent }))
  ),
  "llm-wiki": lazy(() =>
    import("../content/projects/llm-wiki").then((m) => ({ default: m.LlmWikiContent }))
  ),
};

export function ProjectDetail() {
  const { slug } = useParams();
  const project = slug ? projectBySlug(slug) : undefined;
  const Content = slug ? contentMap[slug] : undefined;

  useDocumentMeta(
    project ? `${project.name} · 项目 · Jaron Lu` : "项目 · Jaron Lu",
    project?.q
  );

  if (!project || !Content) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="mx-auto max-w-text px-6 pt-10 pb-4">
      <Link
        to="/projects"
        className="text-[0.875rem] text-muted no-underline transition-colors hover:text-accent"
      >
        全部项目
      </Link>

      <h1 className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-[2.25rem] leading-[1.1] font-semibold tracking-[-0.02em] text-ink sm:text-[2.75rem]">
        {project.name}
        {project.repo ? null : <PrivateTag />}
      </h1>

      <div className="meta-strip mt-7">
        <span>
          <b>角色</b>
          {project.role}
        </span>
        <span>
          <b>状态</b>
          {project.status}
        </span>
        <span>
          <b>技术栈</b>
          {project.stack}
        </span>
        {project.repo ? (
          <a href={project.repo} target="_blank" rel="noreferrer">
            <b>源码</b>
            GitHub
          </a>
        ) : (
          <span>
            <b>源码</b>
            {project.repoNote ?? "私有仓库"}
          </span>
        )}
      </div>

      <div className="prose mt-9">
        <Suspense fallback={<p className="text-[0.875rem] text-muted">正在载入正文…</p>}>
          {/* 发版后旧 chunk 失效时给出重新加载入口；换路由即换 key，boundary 复位 */}
          <ChunkErrorBoundary key={slug}>
            <Content />
          </ChunkErrorBoundary>
        </Suspense>
      </div>

      <footer className="mt-14 border-t border-line pt-6">
        <p className="text-[0.9375rem] leading-[1.75] text-muted">
          对这个项目的设计取舍有想法，或在招相关方向，欢迎写信：
          <a
            href={`mailto:${site.email}`}
            className="text-accent underline underline-offset-4 transition-colors hover:text-ink"
          >
            {site.email}
          </a>
        </p>
      </footer>
    </div>
  );
}
