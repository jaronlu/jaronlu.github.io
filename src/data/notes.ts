/** 笔记类型：加新笔记 = 在 notes 数组加一条 + 新建 src/content/notes/<slug>.tsx + 注册路由。 */
export interface Note {
  slug: string;
  title: string;
  category: "agent" | "knowledge" | "engineering";
  description: string;
  /** 页面 meta description；卡片仍用上面的短描述，避免列表被长句撑开。 */
  metaDescription: string;
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
    metaDescription:
      "Agent 的核心组成、执行循环与适用边界：从单次 API 调用到有状态循环，差别在谁决定下一步、失败后如何恢复。",
    confidence: "HIGH",
    index: 1,
  },
  {
    slug: "agent-runtime",
    title: "Agent Runtime",
    category: "agent",
    description: "State、Store、Context 的职责边界",
    metaDescription:
      "Agent Runtime 中 State、Store、Context 的职责边界：长任务里状态放哪、上下文如何收缩、恢复时读哪一份。",
    confidence: "HIGH",
    index: 2,
  },
  {
    slug: "rag-principles",
    title: "RAG 原理",
    category: "knowledge",
    description: "检索、生成、引用与评估链路",
    metaDescription:
      "检索、生成、引用与评估四段链路：引用是否可信取决于检索质量，以及最常见的三个失败位置。",
    confidence: "HIGH",
    index: 3,
  },
  {
    slug: "mcp-protocol",
    title: "MCP 协议",
    category: "knowledge",
    description: "Host、Client、Server 与工具边界",
    metaDescription:
      "MCP 的 Host、Client、Server 分工与工具边界：工具描述、返回值与权限为什么必须显式约束，而不是靠模型自觉。",
    confidence: "HIGH",
    index: 4,
  },
  {
    slug: "loop-engineering",
    title: "Loop Engineering",
    category: "engineering",
    description: "从提示词到反馈循环系统",
    metaDescription:
      "从一次性提示词到可收敛的反馈循环：终止条件、错误恢复、轮次预算与状态记录分别怎么定义。",
    confidence: "MEDIUM",
    index: 5,
  },
  {
    slug: "knowledge-governance-sop",
    title: "知识治理 SOP",
    category: "engineering",
    description: "可追溯的 AI 学习文档工作流与源码校准机制",
    metaDescription:
      "把 AI 学习文档做成可追溯流程：一手来源核验、版本留痕、冲突处理，以及哪些内容只能留在私有仓库。",
    confidence: "HIGH",
    index: 6,
  },
  {
    slug: "harness-engineering",
    title: "Harness Engineering",
    category: "engineering",
    description: "Agent 运行环境的工程约束：权限、验证、恢复与观测",
    metaDescription:
      "Agent 运行环境的工程约束：权限、工具、验证、恢复与观测，以及为什么能力要长在约束之上。",
    confidence: "HIGH",
    index: 7,
  },
  {
    slug: "eval-engineering",
    title: "Eval Engineering",
    category: "engineering",
    description: "把 Agent 质量变成可回归的工程信号",
    metaDescription:
      "把 Agent 质量拆成可回归的信号：数据集、判定口径、通过率与失败样本的追踪方式。",
    confidence: "HIGH",
    index: 8,
  },
];

export const noteBySlug = (slug: string) => notes.find((n) => n.slug === slug);
