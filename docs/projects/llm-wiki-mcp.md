# llm-wiki-mcp — 个人知识库 MCP 操作层

<div class="project-meta">
  <span><b>角色</b>个人实战项目</span>
  <span><b>状态</b>持续使用中</span>
  <span><b>技术栈</b>MCP · Python</span>
  <a href="https://github.com/jaronlu/llm-wiki-mcp"><b>源码</b>GitHub ↗</a>
</div>

> 把 `llm-wiki` 的知识库维护流程封装成可复用、可审计的 MCP 工具层。

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

<figure class="arch-figure">
<svg viewBox="0 0 820 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="llm-wiki-mcp 五层架构：Agent 层经 MCP 到 Tool、Workflow、Service、Storage 层">
  <defs>
    <marker id="warr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L8,4 L0,8" fill="none" stroke="var(--ink)" stroke-width="1.2"/>
    </marker>
  </defs>
  <style>
    .wn { fill: none; stroke: var(--line-strong); stroke-width: 1; }
    .wt { font-family: var(--mono); font-size: 11px; fill: var(--ink); font-weight: 600; letter-spacing: 0.08em; }
    .ws { font-family: var(--sans); font-size: 11px; fill: var(--muted); }
    .wa { font-family: var(--mono); font-size: 10px; fill: var(--accent); font-weight: 600; }
    .wl { stroke: var(--ink); stroke-width: 1; fill: none; }
  </style>
  <rect class="wn" x="60" y="12" width="700" height="42"/>
  <text class="wt" x="76" y="38">AGENT</text>
  <text class="ws" x="180" y="38">Claude Code · Hermes · Cursor · LangGraph · 自研 Agent</text>
  <line class="wl" x1="410" y1="54" x2="410" y2="72" marker-end="url(#warr)"/>
  <text class="wa" x="424" y="68">MCP — 同一套工具契约</text>
  <rect class="wn" x="60" y="76" width="700" height="42"/>
  <text class="wt" x="76" y="102">TOOL</text>
  <text class="ws" x="180" y="102">search_wiki · read_page · read_raw_source · run_lint · knowledge_health_review</text>
  <line class="wl" x1="410" y1="118" x2="410" y2="136" marker-end="url(#warr)"/>
  <rect class="wn" x="60" y="140" width="700" height="42"/>
  <text class="wt" x="76" y="166">WORKFLOW</text>
  <text class="ws" x="180" y="166">Capture → Search → Compile → Review → Apply → Publish → Health Review</text>
  <line class="wl" x1="410" y1="182" x2="410" y2="200" marker-end="url(#warr)"/>
  <rect class="wn" x="60" y="204" width="700" height="42"/>
  <text class="wt" x="76" y="230">SERVICE</text>
  <text class="ws" x="180" y="230">Search Engine · Candidate Builder · Frontmatter Validator · Log Manager</text>
  <line class="wl" x1="410" y1="246" x2="410" y2="264" marker-end="url(#warr)"/>
  <rect class="wn" x="60" y="268" width="700" height="42"/>
  <text class="wt" x="76" y="294">STORAGE</text>
  <text class="ws" x="180" y="294">正式页（candidate-first）· Raw Sources（create-only）· Index · Log · Config</text>
</svg>
<figcaption>Agent 不直接接触文件系统：所有读写经过工具契约和 workflow 层，安全边界（candidate-first、create-only、路径限制）落在结构上。</figcaption>
</figure>

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
- [Loop Engineering](../agent/concepts/loop-engineering.md)


---

**联系**：对这个项目的设计取舍有想法，或在招相关方向 → [jr.lu.jobs@gmail.com](mailto:jr.lu.jobs@gmail.com) · [GitHub](https://github.com/jaronlu)
