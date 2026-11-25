/**
 * Agent 知识体系课程目录（39 课）。
 *
 * 数据来源：私有仓库 doubao-cron/knowledge/ai-agent/ 的系统学习笔记。
 * 本站只收录精校过的课文全文（slug 非空的条目），其余课程仅展示目录；
 * 框架类课程（第⑤层）时效敏感，官网校准完成前不公开全文。
 */

/** 课程的六层结构：从概念到生产，与私有仓库的知识池分层一一对应。 */
export const courseTiers = {
  1: { label: "基础概念", order: 1 },
  2: { label: "核心机制", order: 2 },
  3: { label: "架构模式", order: 3 },
  4: { label: "工程落地", order: 4 },
  5: { label: "框架工具", order: 5 },
  6: { label: "评估与生产", order: 6 },
} as const;

export type CourseTier = keyof typeof courseTiers;

export interface CourseLesson {
  /** 课号 01–39，与私有仓库编号一致 */
  num: number;
  title: string;
  /** 目录页一句话简介 */
  oneLine: string;
  tier: CourseTier;
  /** 收录全文的 slug；为空表示全文未发布（目录条目不可点） */
  slug?: string;
  /** true = 已对照官方文档逐条校准过 */
  calibrated?: boolean;
}

export const courseLessons: CourseLesson[] = [
  // ── ① 基础概念 ──
  { num: 1, title: "Agent 的定义与本质", tier: 1, slug: "agent-definition", oneLine: "判别标准是多步自主闭环，不是单轮问答", },
  { num: 2, title: "LLM 作推理引擎", tier: 1, oneLine: "概率文本生成如何承担决策职责，以及它的能力边界" },
  { num: 3, title: "Agent vs 普通 LLM 调用", tier: 1, oneLine: "单轮调用与自主闭环的分界：谁决定下一步、失败后谁兜底" },
  { num: 4, title: "Agent 发展史与里程碑", tier: 1, oneLine: "从 ReAct 到行业收敛定义：概念演化的关键节点" },
  // ── ② 核心机制 ──
  { num: 5, title: "RAG：基础 / 高级 / Graph / Hybrid", tier: 2, oneLine: "检索增强生成的四条路线与各自适用场景" },
  { num: 6, title: "Function Calling 与 Tool Use", tier: 2, oneLine: "让模型拿到「手」：工具描述、参数校验与结果回填" },
  { num: 7, title: "ReAct 推理", tier: 2, oneLine: "推理与行动交替循环，用观察结果修正下一步" },
  { num: 8, title: "CoT / ToT / GoT 思维链", tier: 2, oneLine: "线性推演、分支搜索与图结构三种思考形态" },
  { num: 9, title: "Memory 记忆", tier: 2, slug: "agent-memory", oneLine: "短期窗口、长期向量库与记忆管理的遗忘策略" },
  { num: 10, title: "Planning 规划", tier: 2, slug: "agent-planning", oneLine: "任务分解、反思与自我纠错：规划质量决定任务上限" },
  { num: 11, title: "Action Selection 动作选择", tier: 2, oneLine: "动作空间怎么设计，Agent 怎么决定下一步做什么" },
  // ── ③ 架构模式 ──
  { num: 12, title: "Single Agent 单智能体", tier: 3, oneLine: "单体的完整解剖：循环、状态与终止条件" },
  { num: 13, title: "Multi-Agent 多智能体协作", tier: 3, slug: "multi-agent", calibrated: true, oneLine: "角色分工、通信协议、辩论与投票机制" },
  { num: 14, title: "Supervisor 主管模式", tier: 3, oneLine: "中心化调度的收益与代价：谁有权分配任务" },
  { num: 15, title: "Router 路由模式", tier: 3, oneLine: "意图分流如何实现，路由错了会发生什么" },
  { num: 16, title: "Pipeline 流水线模式", tier: 3, oneLine: "阶段固定、职责单一、每步可回归的编排形态" },
  { num: 17, title: "Agentic Workflow 编排", tier: 3, slug: "agentic-workflow", oneLine: "何时用图引擎动态编排，何时把流程写死" },
  // ── ④ 工程落地 ──
  { num: 18, title: "Prompt 工程 for Agent", tier: 4, oneLine: "系统提示词是 Agent 的第一层「操作系统」" },
  { num: 19, title: "上下文窗口管理", tier: 4, slug: "context-window", oneLine: "压缩、裁剪与分层：上下文就是 Agent 的内存" },
  { num: 20, title: "Token 成本优化", tier: 4, oneLine: "计费结构、缓存命中与模型分级的成本设计" },
  { num: 21, title: "错误处理与重试", tier: 4, oneLine: "工具失败、超时与不可逆操作的兜底设计" },
  { num: 22, title: "流式输出", tier: 4, oneLine: "流式协议与前端呈现的工程约束" },
  { num: 23, title: "并发与异步", tier: 4, oneLine: "并行工具调用与异步编排的时序陷阱" },
  { num: 24, title: "可观测性与调试", tier: 4, oneLine: "trace、结构化日志与执行回放" },
  { num: 25, title: "Agent 安全与对齐", tier: 4, slug: "agent-safety", oneLine: "提示注入、权限最小化与 Human-in-the-Loop" },
  // ── ⑤ 框架工具（时效敏感，全文待官网校准后发布）──
  { num: 26, title: "LangChain 与 LangGraph", tier: 5, oneLine: "用图引擎建模 State / Node / Edge 的循环系统" },
  { num: 27, title: "LlamaIndex", tier: 5, oneLine: "数据框架定位与 RAG 组件全家桶" },
  { num: 28, title: "AutoGen", tier: 5, oneLine: "微软系多智能体会话框架的设计取舍" },
  { num: 29, title: "CrewAI", tier: 5, oneLine: "角色驱动的多智能体团队编排" },
  { num: 30, title: "Dify", tier: 5, oneLine: "低代码 LLMOps 平台的能力与边界" },
  { num: 31, title: "Coze 扣子", tier: 5, oneLine: "字节系 Agent 搭建平台的定位" },
  { num: 32, title: "Semantic Kernel", tier: 5, oneLine: "微软 .NET 系 Agent 框架的设计思路" },
  { num: 33, title: "MCP 协议", tier: 5, oneLine: "工具接入的标准化协议：Host / Client / Server" },
  // ── ⑥ 评估与生产 ──
  { num: 34, title: "Agent 评估指标", tier: 6, oneLine: "任务完成率之外，还要度量什么" },
  { num: 35, title: "评测基准与数据集", tier: 6, oneLine: "主流基准的适用边界与读数姿势" },
  { num: 36, title: "多模态 Agent", tier: 6, oneLine: "视觉输入与 GUI 操作带来的新问题域" },
  { num: 37, title: "Agent 浏览器与 RPA", tier: 6, oneLine: "浏览器自动化与传统 RPA 的分界线" },
  { num: 38, title: "生产级 Agent 架构设计", tier: 6, slug: "production-architecture", oneLine: "从 demo 到生产的距离：权限、审计、降级与回归" },
  { num: 39, title: "成本与性能权衡", tier: 6, oneLine: "延迟、质量、成本三角的取舍方法" },
];

/** 索引页顶部声明。 */
export const courseManifest = {
  total: courseLessons.length,
  published: courseLessons.filter((l) => l.slug).length,
  headline:
    "Agent = 消息协议 + 生成参数 + 运行框架（Harness）+ 能力模块 + 多 Agent 协作 + 工程治理。",
} as const;

export const courseBySlug = (slug: string) =>
  courseLessons.find((l) => l.slug === slug);
