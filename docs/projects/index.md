# 项目

这三个项目构成一条完整链路：**SecRAG** 解决垂直场景中的可信问答，**llm-wiki-mcp** 解决知识如何被安全读写，**agent-skills** 解决能力如何在多个 Agent 客户端之间一致分发。

| 项目 | 解决的问题 | 可验证证据 |
|---|---|---|
| [SecRAG](secrag.md) | 金融知识问答如何把权限、验证和审计变成结构约束 | LangGraph 六节点、100+ 单测、权限验收与小样本检索评估 |
| [llm-wiki-mcp](llm-wiki-mcp.md) | Agent 如何在不获得无限文件权限的前提下维护知识库 | Candidate-first、raw create-only、路径防护、94 tests passing |
| [agent-skills](agent-skills.md) | 自研 Skills 如何跨 Codex、Claude、Hermes 保持单一来源 | 配置驱动分发、冲突保护、幂等同步、4 个公开 Skills |

所有数字均来自当前项目源码或 Wiki 中的已核对记录；设计目标与已完成能力分开表达。

## TODO

### KnowledgeOS — AI Knowledge Workspace

**状态：设计阶段（Draft，待 Review → Freeze）**

受 NotebookLM 启发的开源知识工作台，计划以 Document Knowledge Agent 为第一阶段：支持文档管理、多文档联合问答、Citation、AI 总结与学习资料生成。

- MVP 仅覆盖 PDF、DOCX、Markdown、TXT，暂不包含多模态、网页、MCP、Deep Research 或协作功能。
- 技术基线为 Python 3.12、FastAPI、LangGraph、ChromaDB、SQLite / PostgreSQL。
- 当前已建立 8 个 SSOT 设计文档与 6 篇分阶段实现文档；在设计 Review、Freeze 和实现验证完成前，不作为已交付项目展示。
