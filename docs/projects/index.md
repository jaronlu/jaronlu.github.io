# 项目

这三个项目构成一条完整链路：**SecRAG** 解决垂直场景中的可信问答，**llm-wiki-mcp** 解决知识如何被安全读写，**agent-skills** 解决能力如何在多个 Agent 客户端之间一致分发。

| 项目 | 解决的问题 | 可验证证据 |
|---|---|---|
| [SecRAG](secrag.md) | 金融知识问答如何把权限、验证和审计变成结构约束 | LangGraph 六节点、100+ 单测、权限验收与小样本检索评估 |
| [llm-wiki-mcp](llm-wiki-mcp.md) | Agent 如何在不获得无限文件权限的前提下维护知识库 | Candidate-first、raw create-only、路径防护、94 tests passing |
| [agent-skills](agent-skills.md) | 自研 Skills 如何跨 Codex、Claude、Hermes 保持单一来源 | 配置驱动分发、冲突保护、幂等同步、4 个公开 Skills |

所有数字均来自当前项目源码或 Wiki 中的已核对记录；设计目标与已完成能力分开表达。
