interface HeadlinePhrase {
  text: string;
  /** 该短语前留一个空格（中文与拉丁词之间的间距）；空格由渲染方放在短语外层 */
  gap?: true;
}

/**
 * 首页主标题（h1）。两行，每行由不可拆的短语组成：从 390px 手机到宽屏都保持两行，更窄时按短语换行；
 * 行尾不带标点。Home 与预渲染的无 JS 外壳都读这一份。
 */
const headline: HeadlinePhrase[][] = [
  [{ text: "10 年证券客户端工程，" }, { text: "现在构建" }],
  [{ text: "可验证、" }, { text: "可审计的" }, { text: "AI Agent 系统", gap: true }],
];

/** 站点级配置：加社交入口、改联系方式只需改这里。 */
export const site = {
  name: "Jaron Lu",
  role: "AI Agent Engineer",
  headline,
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

/** 首页主标题的纯文本形态：预渲染的无 JS 外壳用它做 h1（与 Home 渲染出的文字逐字一致）。 */
export const headlineText = site.headline
  .map((line) => line.map((phrase) => (phrase.gap ? " " : "") + phrase.text).join(""))
  .join("");

/** 主导航；首页由左上角站名承担，不单列。 */
export const nav = [
  { label: "项目", to: "/projects" },
  { label: "知识体系", to: "/agent-course" },
  { label: "关于", to: "/about" },
] as const;
