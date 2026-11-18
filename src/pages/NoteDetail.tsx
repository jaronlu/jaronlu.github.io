import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Reveal } from "../components/Reveal";
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
    <div className="mx-auto max-w-[820px] px-6 pt-10 pb-4">
      <Reveal>
        <Link
          to="/notes"
          className="group inline-flex items-center gap-2 font-mono text-[0.7rem] font-semibold text-muted no-underline transition-colors hover:text-accent"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          全部笔记
        </Link>
      </Reveal>

      <Reveal>
        <span className="kicker accent mt-6">FIELD NOTE / 0{note.index}</span>
        <h1 className="mt-4 font-display text-[2.2rem] leading-[1.1] font-semibold tracking-[-0.02em] text-ink sm:text-[2.5rem]">
          {note.title}
        </h1>
        <p className="mt-3 max-w-[56ch] text-[0.86rem] text-muted">{note.description}</p>
      </Reveal>

      <div className="prose mt-10 min-h-[60vh]">
        <span className="note-confidence">CONFIDENCE — {note.confidence}</span>
        <Suspense fallback={<p className="font-mono text-[0.7rem] text-muted">正在载入正文…</p>}>
          <Content />
        </Suspense>
      </div>
    </div>
  );
}
