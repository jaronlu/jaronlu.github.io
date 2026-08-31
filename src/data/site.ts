/** 站点级配置：加社交入口、改联系方式只需改这里。 */
export const site = {
  name: "Jaron Lu",
  role: "AI Agent Engineer",
  headline: "10 年金融工程经验，\n构建可验证、可审计的 AI Agent 系统。",
  headlineParts: ["10 年金融工程经验，", "构建", "可验证、可审计", "的 AI Agent 系统。"],
  intro:
    "专注 Agentic RAG、LangGraph、MCP 与知识工程。从证券交易链路到 Agent 工作流，核心判断始终不变：边界先于能力，验证先于交付——系统信任不靠模型自觉，靠工程设计。",
  issue: "ISSUE 2026 · SHENZHEN / REMOTE",
  email: "jr.lu.jobs@gmail.com",
  github: "https://github.com/jaronlu",
  linkedin:
    "https://www.linkedin.com/in/%E5%BB%BA%E8%8D%A3-%E9%99%86-a5a10a400/",
  copyright: "© 2026 Jaron Lu",
} as const;

export const nav = [
  { label: "首页", to: "/" },
  { label: "项目", to: "/projects" },
  { label: "工程笔记", to: "/notes" },
  { label: "关于", to: "/about" },
] as const;
