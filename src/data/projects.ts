/** 项目类型：加新项目 = 在 projects 数组加一条 + 新建 src/content/projects/<slug>.tsx + 注册路由。 */
export interface Project {
  slug: string;
  name: string;
  role: string;
  status: string;
  stack: string;
  repo: string;
  /** 列表页一句话 */
  q: string;
  /** 列表页证据行（mono 元信息层） */
  ev: string;
  /** 详情页 lede（置于 meta 条之下） */
  tagline: string;
  /** 是否在首页精选区块展示 */
  featured?: boolean;
  /** 序号：前三个构成 Agent 工程链路 */
  index: number;
}

export const projects: Project[] = [
  {
    slug: "secrag",
    name: "SecRAG",
    role: "个人独立项目",
    status: "架构验证完成",
    stack: "LangGraph · ChromaDB · FastAPI",
    repo: "https://github.com/jaronlu/SecRAG",
    q: "面向券商投研的 Agentic RAG，把权限、验证、合规和审计固化为嵌套图工作流",
    ev: "106 commits · 11,540 行源码 · 256 测试用例 · React 前端 + Docker 部署 · 检索/回答/合规三套评估",
    tagline: "服务端身份绑定、角色感知多源检索、ReAct 子图工具调用、引用与数字验证、合规检查、SQLite 会话与审计——完整的投研问答原型。",
    featured: true,
    index: 1,
  },
  {
    slug: "llm-wiki-mcp",
    name: "llm-wiki-mcp",
    role: "个人实战项目",
    status: "持续使用中",
    stack: "MCP · Python",
    repo: "https://github.com/jaronlu/llm-wiki-mcp",
    q: "知识库 MCP 操作层，用候选评审机制替代 Agent 对正式知识的直接写入",
    ev: "Candidate-first · raw create-only · 路径防护 · 94 tests passing",
    tagline: "把 `llm-wiki` 的知识库维护流程封装成可复用、可审计的 MCP 工具层。",
    featured: true,
    index: 2,
  },
  {
    slug: "agent-skills",
    name: "agent-skills",
    role: "个人工具仓库",
    status: "日常使用中",
    stack: "Python · TOML 配置",
    repo: "https://github.com/jaronlu/awesome-opc-skills",
    q: "跨 Agent 能力分发基座，自研 Skills 单一源码、冲突保护、幂等同步",
    ev: "69 commits · 5 个自研 Skill · 696 行测试 · 配置驱动分发到 Codex / Claude / Hermes",
    tagline: "自研 Agent Skills 的单一源码仓库，用确定性工具分发到 Codex、Claude 与 Hermes，冲突时停止而非覆盖。",
    featured: true,
    index: 3,
  },
  {
    slug: "clip-flow",
    name: "ClipFlow",
    role: "个人产品",
    status: "macOS 已验证",
    stack: "Flutter · SQLite · 原生 OCR",
    repo: "https://github.com/jaronlu/clip_flow",
    q: "跨平台桌面剪贴板工具，多格式识别、OCR、本地加密与双模式界面",
    ev: "macOS 已验证 · OCR 三平台适配 · AES-256-GCM 本地加密 · 真实界面截图",
    tagline: "基于 Flutter 的桌面剪贴板工具，覆盖多格式识别、搜索、OCR、本地存储与双模式界面。",
    featured: false,
    index: 4,
  },
  {
    slug: "ai-engineering-hub",
    name: "ai-engineering-hub",
    role: "个人知识工程",
    status: "持续迭代中",
    stack: "Python · LangChain · LangGraph · Obsidian",
    repo: "https://github.com/jaronlu/ai-engineering-hub",
    q: "AI 工程知识治理与学习系统，7 个专题教程 + 56 篇源码校准文档 + 严格 SOP",
    ev: "116 commits · 4 个生态 · 7 个 Agent Engineering 专题 · 56 篇 LangChain 文档 · 可运行代码 + 验证脚本",
    tagline: "系统化的 AI 工程学习工作区，覆盖 LangChain/LlamaIndex/AutoGPT/ComfyUI 四个生态，7 个 Agent Engineering 专题教程，56 篇经过源码校准的学习文档，以及严格的知识治理 SOP。",
    featured: false,
    index: 5,
  },
];

export const projectBySlug = (slug: string) =>
  projects.find((p) => p.slug === slug);

/** 设计中（尚未交付）条目 */
export const upcoming = [
  {
    name: "KnowledgeOS — AI Knowledge Workspace",
    status: "设计阶段，尚未交付",
    description:
      "受 NotebookLM 启发的开源知识工作台，第一阶段是 Document Knowledge Agent：文档管理、多文档联合问答、Citation、AI 总结与学习资料生成。",
    bullets: [
      "MVP 仅覆盖 PDF、DOCX、Markdown、TXT，暂不包含多模态、网页、MCP、Deep Research 或协作功能。",
      "技术基线为 Python 3.12、FastAPI、LangGraph、ChromaDB、SQLite / PostgreSQL。",
      "设计与实现验证完成前，不作为已交付项目展示。",
    ],
  },
];
