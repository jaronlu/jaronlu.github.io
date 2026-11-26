import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { noteBySlug } from "../data/notes";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
/** 笔记正文同样按路由懒加载，避免首页一次性加载全部笔记。 */
const contentMap: Record<string, LazyExoticComponent<ComponentType>> = {
  "agent-principles": lazy(() =>
    import("../content/notes/agent-principles").then((m) => ({ default: m.AgentPrinciplesContent }))
  ),
  "agent-runtime": lazy(() =>
    import("../content/notes/agent-runtime").then((m) => ({ default: m.AgentRuntimeContent }))
  ),
  "rag-principles": lazy(() =>
    import("../content/notes/rag-principles").then((m) => ({ default: m.RagPrinciplesContent }))
  ),
  "mcp-protocol": lazy(() =>
    import("../content/notes/mcp-protocol").then((m) => ({ default: m.McpProtocolContent }))
  ),
  "loop-engineering": lazy(() =>
    import("../content/notes/loop-engineering").then((m) => ({ default: m.LoopEngineeringContent }))
  ),
  "knowledge-governance-sop": lazy(() =>
    import("../content/notes/knowledge-governance-sop").then((m) => ({ default: m.KnowledgeGovernanceSopContent }))
  ),
  "harness-engineering": lazy(() =>
    import("../content/notes/harness-engineering").then((m) => ({ default: m.HarnessEngineeringContent }))
  ),
  "eval-engineering": lazy(() =>
    import("../content/notes/eval-engineering").then((m) => ({ default: m.EvalEngineeringContent }))
  ),
};

export function NoteDetail() {
  const { slug } = useParams();
  const note = slug ? noteBySlug(slug) : undefined;
  const Content = slug ? contentMap[slug] : undefined;

  useDocumentMeta(
    note ? `${note.title} · 工程笔记 · Jaron Lu` : "工程笔记 · Jaron Lu",
    note?.description
  );

  if (!note || !Content) {
    return <Navigate to="/notes" replace />;
  }

  return (
    <div className="mx-auto max-w-text px-6 pt-10 pb-4">
      <Link
        to="/notes"
        className="text-[0.875rem] text-muted no-underline transition-colors hover:text-accent"
      >
        全部笔记
      </Link>

      <h1 className="mt-6 font-display text-[2.25rem] leading-[1.1] font-semibold tracking-[-0.02em] text-ink sm:text-[2.5rem]">
        {note.title}
      </h1>
      <p className="mt-4 max-w-[42em] text-[1.0625rem] leading-[1.75] text-ink-soft">{note.description}</p>

      <div className="prose mt-10">
        <span className="note-confidence">
          置信度 {note.confidence}：
          {note.confidence === "HIGH" ? "结论已对照官方文档或项目代码核对" : "基于实践经验，尚未完整验证"}
        </span>
        <Suspense fallback={<p className="text-[0.875rem] text-muted">正在载入正文…</p>}>
          <Content />
        </Suspense>
      </div>
    </div>
  );
}
