import { Link, Navigate, useParams } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { noteBySlug } from "../data/notes";
import { AgentPrinciplesContent } from "../content/notes/agent-principles";
import { AgentRuntimeContent } from "../content/notes/agent-runtime";
import { LoopEngineeringContent } from "../content/notes/loop-engineering";
import { McpProtocolContent } from "../content/notes/mcp-protocol";
import { RagPrinciplesContent } from "../content/notes/rag-principles";

const contentMap = {
  "agent-principles": AgentPrinciplesContent,
  "agent-runtime": AgentRuntimeContent,
  "rag-principles": RagPrinciplesContent,
  "mcp-protocol": McpProtocolContent,
  "loop-engineering": LoopEngineeringContent,
} as const;

export function NoteDetail() {
  const { slug } = useParams();
  const note = slug ? noteBySlug(slug) : undefined;
  const Content = slug ? contentMap[slug as keyof typeof contentMap] : undefined;

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

      <div className="prose mt-10">
        <span className="note-confidence">CONFIDENCE — {note.confidence}</span>
        <Content />
      </div>
    </div>
  );
}
