import { Link, Navigate, useParams } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { projectBySlug } from "../data/projects";
import { site } from "../data/site";
import { AgentSkillsContent } from "../content/projects/agent-skills";
import { AiEngineeringHubContent } from "../content/projects/ai-engineering-hub";
import { ClipFlowContent } from "../content/projects/clip-flow";
import { LlmWikiMcpContent } from "../content/projects/llm-wiki-mcp";
import { SecRAGContent } from "../content/projects/secrag";

const contentMap = {
  secrag: SecRAGContent,
  "llm-wiki-mcp": LlmWikiMcpContent,
  "agent-skills": AgentSkillsContent,
  "clip-flow": ClipFlowContent,
  "ai-engineering-hub": AiEngineeringHubContent,
} as const;

export function ProjectDetail() {
  const { slug } = useParams();
  const project = slug ? projectBySlug(slug) : undefined;
  const Content = slug ? contentMap[slug as keyof typeof contentMap] : undefined;

  if (!project || !Content) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="mx-auto max-w-[820px] px-6 pt-10 pb-4">
      <Reveal>
        <Link
          to="/projects"
          className="group inline-flex items-center gap-2 font-mono text-[0.7rem] font-semibold text-muted no-underline transition-colors hover:text-accent"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          全部项目
        </Link>
      </Reveal>

      <Reveal>
        <span className="kicker accent mt-6">PROJECT / 0{project.index}</span>
        <h1 className="mt-4 font-display text-[2.2rem] leading-[1.1] font-semibold tracking-[-0.02em] text-ink sm:text-[2.7rem]">
          {project.name}
        </h1>
      </Reveal>

      <Reveal>
        <div className="meta-strip mt-8">
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
          <a href={project.repo} target="_blank" rel="noreferrer">
            <b>源码</b>
            GitHub ↗
          </a>
        </div>
      </Reveal>

      <Reveal>
        <blockquote className="prose mt-6 max-w-[62ch] border-l-2 border-accent pl-5 text-[0.86rem] text-muted">
          {project.tagline}
        </blockquote>
      </Reveal>

      <div className="prose mt-10">
        <Content />
      </div>

      <footer className="mt-14 border-t border-line pt-6">
        <p className="text-[0.84rem] text-muted">
          对这个项目的设计取舍有想法，或在招相关方向 →
          <a href={`mailto:${site.email}`} className="ml-2 font-mono text-[0.78rem] font-semibold text-accent">
            {site.email}
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            className="ml-4 font-mono text-[0.78rem] font-semibold text-accent"
          >
            GitHub ↗
          </a>
        </p>
      </footer>
    </div>
  );
}
