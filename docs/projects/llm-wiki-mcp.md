# llm-wiki-mcp — 个人知识库 MCP 操作层

> 个人实战项目，用于把 `llm-wiki` 的知识库维护流程封装成可复用、可审计的 MCP 工具层。

## 项目一句话

`llm-wiki-mcp` 不是一个普通文件系统 MCP，也不是把 `read_file(path)` 包一层协议。它的目标是给个人 Markdown 知识库提供一层面向 Agent 的知识操作接口，让不同 Agent 能用同一套工具完成搜索、读取、raw source 收集、候选页生成、lint 和健康检查。

## 为什么做这个项目

只把 `~/llm-wiki/` 路径交给 Agent，能解决“能不能读文件”，但解决不了“能不能按知识库规则稳定维护”的问题：

- 每个 Agent 都要重新理解 `raw/`、正式页、草稿、索引和日志的边界。
- 普通文件工具缺少 frontmatter、sources、confidence、wikilinks 等知识库语义。
- 直接写文件容易绕过 candidate-first、raw create-only、路径越界和公开发布安全检查。
- Hermes、Claude Code、Cursor 或自研 Agent 之间难以复用同一套知识维护契约。

这个项目的核心判断是：

> 路径解决“能不能读”；MCP 解决“能不能稳定、安全、按规则地读写和维护”。

## 系统定位

`llm-wiki-mcp` 的定位是 **Knowledge Operation Layer**，不是 FileSystem Layer。

```text
Agent Layer
  Claude Code / Hermes / Cursor / LangGraph / OpenAI Agents
        ↓ MCP
Tool Layer
  search_wiki / read_page / read_raw_source / run_lint / knowledge_health_review
        ↓
Workflow Layer
  Capture / Search / Compile / Review / Apply / Publish / Health Review
        ↓
Service Layer
  Search Engine / Candidate Builder / Frontmatter Validator / Log Manager
        ↓
Storage Layer
  Formal Pages / Raw Sources / Candidate Cache / Index / Log / Config
```

## 能力证据矩阵

| 能力 | 项目中的落点 |
|------|--------------|
| MCP 工具设计 | `init_wiki`、`inspect_wiki`、`search_wiki`、`read_page`、`read_raw_source`、`run_lint` 等工具契约 |
| 知识生命周期建模 | Capture → Triage → Distill → Merge → Link → Validate → Retrieve → Review |
| 安全边界 | 路径必须限制在 `wiki_root` 内，raw source 默认 create-only，正式页 candidate-first |
| 候选评审机制 | 正式页、index、log、source manifest 通过 Candidate / Review Bundle 统一评审 |
| 多 Agent 复用 | Hermes、Claude Code、Cursor、LangGraph、自研 Agent 通过同一 MCP server 操作 Wiki |
| 质量治理 | `run_lint` 和 `knowledge_health_review` 返回结构化检查结果 |

## 工具能力模型

第一阶段重点不是做“大而全”的文件管理器，而是把知识库维护中高频、边界清晰的能力固化为工具。

| 类别 | 工具 | 作用 |
|------|------|------|
| Bootstrap | `init_wiki` / `inspect_wiki` | 初始化或识别最小 LLM Wiki 结构 |
| Search | `search_wiki` | 搜索正式页或 raw source，并返回 metadata |
| Read | `read_page` / `read_raw_source` | 区分正式知识页和原始证据层 |
| Capture | `create_raw_source` / `append_log` | 收集原始资料和结构化记录 |
| Compile | `compile_page` / `create_update_candidate` | 生成正式页或更新候选，不直接写正式区 |
| Governance | `run_lint` / `knowledge_health_review` | 检查链接、来源、重复主题和低置信页面 |
| Publish | `write_public_draft` / `validate_public_safety` | 生成公开站点草稿并做安全检查 |

## 设计取舍

| 方案 | 取舍 |
|------|------|
| 直接给 Agent 文件系统权限 | 简单，但每个 Agent 都要重新理解 Wiki 规则，误写风险高 |
| 只做 `read_file` / `write_file` 包装 | 实现轻，但没有 frontmatter、sources、candidate 和 lint 语义 |
| 做完整文件管理器 | 能力多，但会扩大权限边界，偏离知识库维护目标 |
| 做知识操作层 MCP | 工具数量更克制，但能把 Wiki 生命周期、安全边界和跨 Agent 复用固化下来 |

## 项目边界说明

当前公开表达按设计与实战验证材料处理，不夸大为完整产品化系统：

- 项目重点是 MCP 工具契约、知识生命周期、安全边界和 workflow 编排设计。
- 不把 MCP 设计成 Git 管理器、网页发布器、Prompt 管理器或完整文件管理器。
- Semantic Search 可以作为内部检索模式演进，但不要求默认依赖向量数据库。
- 正式页、index、schema 和已有 raw 的修改应保持 candidate-first，不让 MCP 自动越权写入。

## 与这个站点的关系

这个站点的内容来自个人 `llm-wiki` 的筛选、脱敏和公开改写。`llm-wiki-mcp` 正好服务于这个流程：它把“从知识库中找资料、读正式页、核对 raw source、生成公开草稿、检查敏感信息”变成可复用的工具链，而不是每次靠临时提示词和文件路径手工操作。

## 相关页面

- [MCP 协议](../agent/concepts/mcp-protocol.md)
- [LLM-WIKI 方法论](../agent/karpathy/llm-wiki.md)
- [Loop Engineering](../agent/concepts/loop-engineering.md)
