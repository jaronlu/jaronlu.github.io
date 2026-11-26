/** 站点级配置：加社交入口、改联系方式只需改这里。 */
export const site = {
  name: "Jaron Lu",
  role: "AI Agent Engineer",
  /** 首页主标题（h1） */
  headline: "10 年证券客户端工程，现在构建可验证、可审计的 AI Agent 系统。",
  /** 首页第二段：做什么 + 核心判断 */
  intro: "专注 Agentic RAG、LangGraph、MCP 与知识工程。系统信任不靠模型自觉，靠工程设计。",
  /** 求职状态，只在首页出现一次 */
  availability: "正在找 AI Agent / LLM 应用工程的机会，深圳或远程，可立即入职。",
  /** 首页 meta description；scripts/prerender.mjs 读同一份，避免两处口径不一 */
  homeDescription:
    "Jaron Lu 的工程作品集：可信 RAG、知识编译与操作层、Agent Skills、定时自动化。把金融客户端的工程约束，编译成可信的 AI Agent 系统。",
  email: "jr.lu.jobs@gmail.com",
  github: "https://github.com/jaronlu",
  linkedin: "https://www.linkedin.com/in/jaronlu/",
  copyright: "© 2026 Jaron Lu",
} as const;

/** 主导航；首页由左上角站名承担，不单列。 */
export const nav = [
  { label: "项目", to: "/projects" },
  { label: "知识体系", to: "/agent-course" },
  { label: "关于", to: "/about" },
] as const;
