# AI 工具矩阵

不要把 AI 工具理解成"谁替代谁"，更适合按层看：**应用框架、状态编排、RAG 数据层、记忆层、多 Agent 协作、低代码平台、工程化配套**。

## 容易混淆的点

- **LangChain** 现在更偏高层 Agent / 应用开发框架，不只是"链式 Prompt 编排"
- **LangGraph** 是低层有状态编排 runtime，不是 LangChain 的别名
- **LlamaIndex** 围绕私有数据、上下文增强、RAG、Agent over data
- **OpenAI Swarm** 是实验/教学性质，生产场景看 OpenAI Agents SDK

## 工具分层

### 1. Agent 应用框架 / 编排层

| 工具 | 定位 | 适合场景 |
|------|------|----------|
| LangChain | 高层 Agent 应用框架 | 快速搭建通用 Agent、工具调用、RAG |
| OpenAI Agents SDK | 轻量生产级 Agent SDK | OpenAI 生态、工具调用、多 Agent 交接 |
| Semantic Kernel | 企业系统集成 AI middleware | .NET/C#/Java/Python 混合企业环境 |
| Haystack | 面向生产的 Agents + RAG + 搜索 | 检索链路重、自托管、pipeline 组合 |
| DSPy | 程序化 AI 系统 | prompt/program 优化、评测闭环 |

### 2. 图工作流 / 状态机层

| 工具 | 定位 | 适合场景 |
|------|------|----------|
| LangGraph | 低层有状态编排框架 | 多分支、循环、暂停恢复、人工审核 |
| Prefect | 通用工作流编排平台 | 数据流 + AI 流混合、定时任务 |
| n8n | 低代码工作流自动化 | 内部流程自动化、API 编排 |

### 3. RAG / 数据接入 / 检索层

| 工具 | 定位 | 适合场景 |
|------|------|----------|
| LlamaIndex | 数据接入 + 索引 + 检索框架 | 私有知识库、文档问答 |
| Docling | 文档解析前处理层 | PDF/表格/图片/OCR 预处理 |
| Chroma | 开源向量检索存储 | 本地原型、小中型知识库 |
| Qdrant | 专业向量数据库 | 检索质量、过滤、混合搜索 |
| pgvector | Postgres 向量扩展 | 业务数据在 Postgres |

### 4. 记忆 / 状态增强层

| 工具 | 定位 | 适合场景 |
|------|------|----------|
| Mem0 | 独立记忆层 | 用户偏好、跨会话记忆 |
| LangGraph Checkpointer | 流程状态持久化 | 长任务中断恢复、失败重跑 |
| Redis / Postgres / MongoDB | 通用状态存储底座 | 会话状态、缓存、事件 |

### 5. 多 Agent 协作层

| 工具 | 定位 | 适合场景 |
|------|------|----------|
| AutoGen | 对话式多 Agent 框架 | 多角色协作、代码执行 |
| CrewAI | roles/crews/flows 协作框架 | 团队分工清晰、任务链清楚 |
| MetaGPT | 模拟软件公司 SOP | 角色化协作 + 软件工程流程 |
| OpenAI Swarm | 轻量教学框架 | 学习 handoff、最小抽象 |

### 6. 低代码 / 可视化 AI 平台

| 工具 | 定位 | 适合场景 |
|------|------|----------|
| Dify | 开源 AI 应用平台 | 快速做 AI 应用交付 |
| FastGPT | 知识库问答 + 工作流编排 | 中文场景、内部知识库 |
| Coze / 扣子 | Bot/Workflow/插件平台 | 面向运营或业务团队 |
| n8n | 低代码 AI 平台 | AI + API + SaaS 自动化 |

### 7. 工程化配套

| 工具 | 定位 | 适合场景 |
|------|------|----------|
| LangSmith | tracing/debug/evaluation | 看调用链、查状态、做评测 |
| Prompt flow | Prompt 开发实验评测 | 微软生态内实验调试 |

## 快速选型建议

| 需求 | 推荐工具 |
|------|----------|
| 最快写出 Python Agent | LangChain / OpenAI Agents SDK |
| 可恢复、可中断的长流程 | LangGraph |
| 私有文档知识系统 | LlamaIndex + Docling + Qdrant/pgvector |
| 企业系统集成 | Semantic Kernel + Prompt flow |
| 低代码快速交付 | Dify / FastGPT / Coze / n8n |
| 多角色协作 | AutoGen / CrewAI / MetaGPT |
| 单独补强记忆 | Mem0 |

## 一句话对应关系

- LangChain = 高层 Agent 应用框架
- LangGraph = 低层有状态编排 runtime
- LlamaIndex = 面向私有数据的上下文增强框架
- Chroma/Qdrant/pgvector = 向量检索/存储层
- Mem0 = 独立记忆层
- AutoGen/CrewAI = 多 Agent 协作框架
- Dify/n8n = 低代码 AI 平台
- LangSmith = 调试评测观测配套

## 相关页面

- [LangChain 核心组件](langchain-core-components.md) — LangChain 核心组件
- [LangGraph 基础](langgraph-basics.md) — LangGraph 基础
- [RAG 原理](rag-principles.md) — RAG 原理
- [Agent 框架对比](../comparisons/agent-frameworks.md) — Agent 框架对比
