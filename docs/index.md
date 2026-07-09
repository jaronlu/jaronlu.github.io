# Jaron 的 AI Agent 工程作品集

> 10 年证券行业客户端开发经验（iOS / HarmonyOS），正在把工程经验迁移到 AI Agent、RAG 与 LangGraph 实践中。
> 这个站点不是日常流水账，而是公开展示项目、系统设计、学习路线和工程判断的作品集。

---

## 我在证明什么

这个站点围绕一个主线展开：把证券客户端长期积累的业务边界、状态管理、权限治理和工程交付经验，迁移到 AI Agent 系统设计里。

| 能力 | 公开材料 |
|------|----------|
| Agent 工作流设计 | [SecRAG](projects/secrag.md) 的 Planner → Retriever → Reasoner → Verifier → Composer → Auditor 六节点图 |
| RAG 知识工程 | [RAG 原理](agent/concepts/rag-principles.md)、[RAG 变体对比](agent/comparisons/rag-variants.md)、SecRAG 的混合检索与引用验证 |
| LangGraph 编排 | [LangGraph 基础](agent/concepts/langgraph-basics.md)、[工作流模式](agent/queries/langgraph-workflow-patterns.md)、条件路由和 State 传递案例 |
| MCP 工具化 | [llm-wiki-mcp](projects/llm-wiki-mcp.md) 的知识库操作层、candidate-first 和跨 Agent 工具契约 |
| 工程判断 | [Agent 框架对比](agent/comparisons/agent-frameworks.md)、[AI 工具矩阵](agent/concepts/ai-tools-matrix.md)、项目边界说明 |

## 推荐阅读路径

### 1. 先看项目

- [SecRAG — 券商投研知识问答 Agent](projects/secrag.md)：一个面向证券投研场景的 Agentic RAG 个人项目，重点展示 RBAC 检索权限、Verifier 校验节点和 LangGraph 六节点工作流设计。
- [llm-wiki-mcp — 个人知识库 MCP 操作层](projects/llm-wiki-mcp.md)：把个人 Markdown 知识库维护流程封装成可被多个 Agent 复用的 MCP 工具契约。

### 2. 再看基础概念

- [AI 工具矩阵](agent/concepts/ai-tools-matrix.md)：LangChain、LangGraph、LlamaIndex、Dify、AutoGen、CrewAI 等工具按工程层次归类。
- [Agent 原理](agent/concepts/agent-principles.md)：Agent 的执行循环、风险和适用边界。
- [LangChain 核心组件](agent/concepts/langchain-core-components.md)：Models、Tools、Agent、Messages 与 LCEL 基础。
- [LangGraph 基础](agent/concepts/langgraph-basics.md)：Node、Edge、State 和有状态工作流。
- [RAG 原理](agent/concepts/rag-principles.md) / [RAG 变体对比](agent/comparisons/rag-variants.md)：从 2-Step RAG 到 Agentic RAG、Graph RAG、CRAG、Self-RAG。

### 3. 最后看学习与表达

- [AI Agent 学习路径](agent/queries/ai-agent-learning-path.md)：从客户端工程转向 AI Agent 岗位的学习主线。
- [Agent 面试高频题](agent/queries/agent-interview-questions.md)：把学习内容整理成可复述的问答。

---

## 内容原则

- 优先发布能体现工程能力的内容：系统设计、实现路径、技术取舍、验证边界。
- 不发布客户内部信息、公司项目细节、未脱敏材料或纯资料搬运。
- 从 `~/llm-wiki/` 中筛选和改写公开版本，发布前清理 Obsidian wikilink、frontmatter 和内部 raw source 路径。

[关于我 →](about.md)
