# 项目实践

独立设计与实现的项目，用于验证从客户端工程到 AI Agent 工程的实际落地能力。这里优先放能说明需求、架构、实现、验证和边界的项目，而不是 Demo 列表。

## SecRAG — 券商投研知识问答 Agent

面向证券行业投研场景的 Agentic RAG 系统，基于 LangGraph 编排检索、推理、验证、合规检查全流程。

这个项目重点证明三件事：

- 能把证券业务里的角色权限和合规约束前置到检索链路，而不是生成答案后再过滤。
- 能用 LangGraph 把 Agent 流程拆成可审计节点，并通过条件路由处理检索不足、验证失败等分支。
- 能把 RAG 从“能回答”推进到“有引用、可校验、可复盘”的工程形态。

[→ 查看项目详情](secrag.md)

## llm-wiki-mcp — 个人知识库 MCP 操作层

面向个人 `llm-wiki` 知识库的 MCP 操作层，把搜索、读取、raw source 收集、候选页生成、lint 和健康检查封装成可复用工具。

这个项目重点证明三件事：

- 能把 Markdown 知识库从“文件夹路径”抽象成面向 Agent 的知识操作层。
- 能用 MCP 工具契约固化 raw create-only、formal candidate-first、路径边界和公开发布安全检查。
- 能让 Hermes、Claude Code、Cursor、LangGraph 或自研 Agent 复用同一套知识维护 workflow。

[→ 查看项目详情](llm-wiki-mcp.md)
