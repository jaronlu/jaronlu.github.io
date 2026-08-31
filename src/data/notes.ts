/** 笔记类型：加新笔记 = 在 notes 数组加一条 + 新建 src/content/notes/<slug>.tsx + 注册路由。 */
export interface Note {
  slug: string;
  title: string;
  category: "agent" | "knowledge" | "engineering";
  description: string;
  confidence: "HIGH" | "MEDIUM";
  index: number;
}

export const noteCategories = {
  agent: { label: "Agent 系统", order: 1 },
  knowledge: { label: "知识与工具", order: 2 },
  engineering: { label: "工程方法", order: 3 },
} as const;

export const notes: Note[] = [
  {
    slug: "agent-principles",
    title: "Agent 原理",
    category: "agent",
    description: "执行循环、适用边界与失败风险",
    confidence: "HIGH",
    index: 1,
  },
  {
    slug: "agent-runtime",
    title: "Agent Runtime",
    category: "agent",
    description: "State、Store、Context 的职责边界",
    confidence: "HIGH",
    index: 2,
  },
  {
    slug: "rag-principles",
    title: "RAG 原理",
    category: "knowledge",
    description: "检索、生成、引用与评估链路",
    confidence: "HIGH",
    index: 3,
  },
  {
    slug: "mcp-protocol",
    title: "MCP 协议",
    category: "knowledge",
    description: "Host、Client、Server 与工具边界",
    confidence: "HIGH",
    index: 4,
  },
  {
    slug: "loop-engineering",
    title: "Loop Engineering",
    category: "engineering",
    description: "从提示词到反馈循环系统",
    confidence: "MEDIUM",
    index: 5,
  },
  {
    slug: "knowledge-governance-sop",
    title: "知识治理 SOP",
    category: "engineering",
    description: "可追溯的 AI 学习文档工作流与源码校准机制",
    confidence: "HIGH",
    index: 6,
  },
  {
    slug: "harness-engineering",
    title: "Harness Engineering",
    category: "engineering",
    description: "Agent 运行环境的工程约束：权限、验证、恢复与观测",
    confidence: "HIGH",
    index: 7,
  },
  {
    slug: "eval-engineering",
    title: "Eval Engineering",
    category: "engineering",
    description: "把 Agent 质量变成可回归的工程信号",
    confidence: "HIGH",
    index: 8,
  },
];

export const noteBySlug = (slug: string) => notes.find((n) => n.slug === slug);
