# AI Agent 工程笔记

这里放公开版 AI Agent 工程笔记，主要来自个人 `llm-wiki` 的筛选与改写。发布标准不是“学过什么”，而是“外部读者能否看出问题拆解、工程边界和技术取舍”。

## 入门与选型

- [AI 工具矩阵](concepts/ai-tools-matrix.md) — 常见 AI 工具按工程层次归类
- [AI Agent 学习路径](queries/ai-agent-learning-path.md) — 岗位画像与自学路线
- [Agent 框架对比](comparisons/agent-frameworks.md) — LangChain / LangGraph / AutoGen / CrewAI / MetaGPT / OpenAI Agents SDK

## 核心概念

- [Agent 原理](concepts/agent-principles.md) — 核心组成、执行循环、适用场景和风险
- [Agent Runtime](concepts/agent-runtime.md) — State、Store、Context
- [LangChain 核心组件](concepts/langchain-core-components.md) — Models、Tools、Agent、Messages、LCEL
- [LangGraph 基础](concepts/langgraph-basics.md) — Node、Edge、State 和图工作流
- [LangChain vs LangGraph](comparisons/langchain-vs-langgraph.md) — 高层框架与底层编排的边界

## RAG 与知识库

- [RAG 原理](concepts/rag-principles.md) — 离线准备、在线问答、关键优化点
- [RAG 变体对比](comparisons/rag-variants.md) — 2-Step RAG、Agentic RAG、Graph RAG、CRAG、Self-RAG

## MCP、多 Agent 与工程方法

- [MCP 协议](concepts/mcp-protocol.md) — Server / Client / Host 与工具协议边界
- [多 Agent 协作模式](concepts/multi-agent-patterns.md) — Subagents、Handoffs、Skills、Router
- [Loop Engineering](concepts/loop-engineering.md) — 从提示词到反馈循环系统

## 实战与问答

- [LangChain Agent 入门实战](queries/langchain-agent-hello-world.md)
- [LangGraph 工作流模式](queries/langgraph-workflow-patterns.md)
- [Agent 面试高频问题](queries/agent-interview-questions.md)

## Karpathy 工程方法论

- [Karpathy 工程方法论](karpathy/index.md)
- [CLAUDE 规范](karpathy/claude-spec.md)
- [LLM-WIKI 方法论](karpathy/llm-wiki.md)
- [循环工程：提示词自动优化](karpathy/loop-engineering.md)
