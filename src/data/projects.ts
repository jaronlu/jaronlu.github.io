/** 项目类型：加新项目 = 在 projects 数组加一条 + 新建 src/content/projects/<slug>.tsx + 注册路由。 */
export interface Project {
  slug: string;
  name: string;
  role: string;
  status: string;
  stack: string;
  /** 公开源码地址；私有仓库留空，改用 repoNote 说明 */
  repo?: string;
  /** 私有仓库的说明文案（详情页 meta 条显示） */
  repoNote?: string;
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
    ev: "304 commits · 16,703 行 Python（79 个文件）· 683 个测试定义 · React 前端 + Docker 部署 · 检索/回答/合规三套评估",
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
    ev: "27 commits · 3,980 行源码 · 87 个测试定义 · Candidate-first · raw create-only",
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
    repo: "https://github.com/jaronlu/agent-skills",
    q: "跨 Agent 能力分发基座，自研 Skills 单一源码、冲突保护、幂等同步",
    ev: "146 commits · 12 个自研 Skill · 118 个测试定义 · 配置驱动分发到共享 Skill 目录",
    tagline: "自研 Agent Skills 的单一源码仓库，按 TOML 配置分发到多个 Agent 客户端的共享 Skill 目录，冲突时停止而非覆盖。",
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
    stack: "Python · Markdown · 源码校准",
    repoNote: "私有知识库 · 面试可演示",
    q: "AI 工程知识库与学习运行层，62 篇源码校准文档 + 治理 SOP + 渐进学习协议",
    ev: "424 commits · 241 篇 Markdown · 62 篇 LangChain 源码校准文档 · 学习运行层 + 治理 SOP",
    tagline: "覆盖 LangChain / LlamaIndex / AutoGPT / ComfyUI / pi 等生态的学习工作区：文档按源码校准，进度按单知识点推进，知识写入走治理 SOP。",
    featured: false,
    index: 5,
  },
  {
    slug: "llamaindex-rag",
    name: "LlamaIndex RAG",
    role: "个人学习项目",
    status: "六阶段实现完成",
    stack: "LlamaIndex · BGE · CrossEncoder · FastAPI · SwiftUI",
    repo: "https://github.com/jaronlu/llamaindex-rag",
    q: "把 RAG 拆成加载、切片、索引、检索、重排、回答六段，每段可独立运行与人工核对",
    ev: "78 commits · 193 个测试定义 · 六阶段 CLI + 局域网接口 + iOS 客户端 · 7 题检索评测记录",
    tagline: "不做端到端黑盒：每个阶段单独跑、单独看证据，用 PDF 物理页码、引用核验和检索评测，把「看起来对」变成「可以核对」。",
    featured: true,
    index: 6,
  },
  {
    slug: "doubao-cron",
    name: "doubao-cron",
    role: "个人自动化系统",
    status: "已归档 61 期日报",
    stack: "cron · Python · 飞书 API",
    repoNote: "私有仓库 · 面试可演示",
    q: "两个每天固定时点执行的定时任务，把采集、校验、落盘、推送固化成一条可回查的流水线",
    ev: "439 commits · 61 期日报归档（47 期 AI 早报 + 14 期股市日报）· 142 个测试定义 · 规则路由 + 链接校验 + 飞书推送",
    tagline: "不是一次性脚本：规则文件版本化、执行前先读仓库规则、每条结论带溯源链接，产物按日期归档以便回查。",
    featured: false,
    index: 7,
  },
  {
    slug: "llm-wiki",
    name: "llm-wiki",
    role: "个人知识库",
    status: "持续编译中",
    stack: "Markdown · Schema 契约 · 编译流水线",
    repoNote: "私有知识库 · 面试可演示",
    q: "把原始证据在入库时编译成正式页，查询不再临时拼接；185 个页面全部可从 index 定位",
    ev: "971 commits · 387 份来源（230 已编译 / 157 待处理）· 185 个 Catalog 页面 · 缺口台账 + 审计",
    tagline: "raw 只做证据保全，结论沉淀到正式页；index.md 是唯一目录，MCP 层负责按规则读写。",
    featured: false,
    index: 8,
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
