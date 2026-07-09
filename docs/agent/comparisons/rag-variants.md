# RAG 变体对比

> RAG（Retrieval-Augmented Generation）是一种"检索+生成"架构，不绑定任何具体检索算法。向量相似度、BM25、SQL、知识图谱都可以是它的检索方式。2-Step RAG、Agentic RAG、Graph RAG 不是并列的三种算法，而是同一架构在控制流和知识表示两个维度上的演化。

## 三种 RAG 定义

| 维度 | 2-Step RAG | Agentic RAG | Graph RAG |
|:---|:---|:---|:---|
| **本质** | 线性检索增强流水线 | LLM 自主决策的智能体循环 | 基于知识图谱的结构化检索 |
| **检索核心** | Dense Vector / BM25 / Hybrid Retriever | Agent 动态决定是否查、查什么、用哪个工具 | 图结构中的实体关系与社区摘要 |
| **架构** | 前馈式、固定流程 | 循环迭代、条件分支 | 两阶段（构建索引 + 查询检索） |
| **适用** | 文档问答、FAQ | 多步推理、多工具协作 | 跨文档关联、全局理解 |
| **代价** | 检索不准时引入错误 | 延迟可变、成本更高 | 构建/维护图谱成本高 |

### 2-Step RAG

固定两步：用户问题 → Retriever 检索相关文档片段 → 拼入提示词 → 一次 LLM 调用生成回答。检索永远发生在生成之前，流程可预测。这是 RAG 原始论文（[arXiv 2005.11401](https://arxiv.org/abs/2005.11401)，2020）提出的基础形态，后续所有变体都是在它之上做增强。

核心优势：实现简单、低延迟、单次推理。关键限制：仅当检索命中相关上下文时才降低幻觉，检索不准反而可能引入错误；对不需要检索的问题（如"1+1等于几"）也会固定执行一次检索，浪费 token 和延迟。

### Agentic RAG

不再是固定流水线。Agent（由 LLM 驱动）充当决策中枢，自主决定何时检索、用什么参数、调用哪个工具，检索后是否需要更多步骤。

工作流（循环式）：Agent 思考/决策 → 判断是否需要检索 → 是则调用工具（Retriever / Web Search / SQL / Knowledge Graph）→ 评估信息是否充足 → 不足则回到思考环节，充足则生成最终回答。

> **关键点**：Retriever 只是工具的一种。Agent 可调用的工具包括 Retriever、Web Search、SQL 查询、Knowledge Graph 等——向量检索并非唯一选项。

核心优势：灵活、可自我纠错（没查到相关信息时自动重写问题再查）、通过多步工具调用拆解复杂任务。代价：延迟可变、成本更高。

### Graph RAG

以 Microsoft GraphRAG 为代表，不只是"把文档存成图"，核心在于对图做社区检测与分层摘要，支持传统向量 RAG 难以回答的跨文档全局理解。

**构建流程**（索引阶段）：原始文档 → 切分 Text Units → 抽取 Entity / Relationship / Claim → 构建加权实体图 → Leiden 层次社区检测 → 自底向上生成社区摘要。

**关键概念**：
- **Entity（实体）**：从文本单元中抽取的对象，如人、组织、产品
- **Relationship（关系）**：实体之间的关联，构成加权实体图的边
- **Community Detection（社区检测）**：用 Leiden 算法做层次聚类，把稠密连接的实体划分为嵌套社区
- **Community Summary（社区摘要）**：自底向上为每个社区生成 LLM 摘要，支撑全局问答

**四种检索策略**：

| 检索方式 | 机制 | 适用场景 |
|:---|:---|:---|
| **Local Search** | 定位核心实体，向邻居和关联概念扇出 | 针对具体实体的细节问题 |
| **Global Search** | 基于社区摘要做全局推理，可动态选择社区层级 | 理解整个语料的宏观问题 |
| **DRIFT Search** | 先用社区信息建立宽泛起点，再向实体邻居扇出 | 既要具体又要背景的问题 |
| **Basic Search** | 回退到传统向量相似度检索 | 常规查询 |

## Retriever ≠ RAG

常见误区是把 Retriever 等同于 RAG：

- Retriever 只是 RAG 架构中"检索"这一环的**组件**；RAG 还包含上下文拼接与 LLM 生成。
- Vector Retriever、Graph Retriever、BM25、SQL 查询都只是 Retriever 的不同实现，可互换、可组合（Hybrid）。
- 因此"Graph RAG vs Vector RAG"本质上是**换了检索组件**而非换了架构；"Agentic RAG"则是**换了控制流**，让 Agent 决定调用哪个 Retriever。

## 两个正交维度

三者不是"谁比谁高级"的单线升级，差异落在两个独立维度：

- **控制流维度**：固定流程（2-Step） → Agent 动态决策（Agentic）
- **知识表示维度**：向量存储（Vector RAG） → 图结构存储（Graph RAG）

两个维度可自由组合。最典型的组合：Agentic RAG 作控制层，把 Graph RAG（或 Vector RAG）当作它的一个检索工具调用——由 Agent 决定这次用图检索还是向量检索、要不要再查一轮。

## CRAG 与 Self-RAG

两者解决同一痛点：检索结果不可靠时，朴素 RAG 会照单全收、产生幻觉。

### Corrective RAG（CRAG，纠正式）

在"检索"与"生成"之间插入轻量**检索评估器**，给检索结果打置信度，按分数走分支：

- **高置信** → 直接使用（可再做知识精炼，只保留相关片段）
- **低置信** → 触发纠正，典型是转 **Web Search** 补充外部知识
- **模糊** → 两者结合

本质：外挂评估器做检索后质量纠正。来源：[arXiv 2401.15884](https://arxiv.org/abs/2401.15884)。

### Self-RAG（自反思式）

训练模型输出特殊 **reflection token（反思标记）**，边生成边自评：

- 要不要检索（**Retrieve?**）——简单问题可跳过
- 检索段落是否相关（**Relevant?**）
- 生成句子是否被证据支持（**Supported?**）、是否有用（**Useful?**）

本质：模型内建反思能力，按需检索 + 自我评估。来源：[arXiv 2310.11511](https://arxiv.org/abs/2310.11511)。

### 区别

CRAG 是**检索后**外挂评估器纠错，Self-RAG 是模型**自身**按需检索 + 反思。二者与 Agentic RAG 是交叉关系：CRAG/Self-RAG 解决“检索可靠性”，Agentic RAG 解决“控制流与工具编排”，不是从属关系。

## 更多变体

| 变体               | 增强维度    | 核心机制                                      | 来源                                                   |
| :--------------- | :------ | :---------------------------------------- | :--------------------------------------------------- |
| **Adaptive RAG** | 是否/何时检索 | 先判断问题复杂度：简单不检索、中等单步、复杂多步                  | [arXiv 2403.14403](https://arxiv.org/abs/2403.14403) |
| **HyDE**         | 查询改写    | LLM 先生成"假想答案"，再用答案做向量检索，缓解 query 与文档措辞不匹配 | [arXiv 2212.10496](https://arxiv.org/abs/2212.10496) |
| **RAG-Fusion**   | 查询改写    | 对一个问题生成多个改写查询，分别检索后用 RRF（倒数排名融合）重排合并      | [arXiv 2402.03367](https://arxiv.org/abs/2402.03367) |

> 另有 **Speculative RAG**（小模型并行起草、大模型验证择优，兼顾速度与质量）等方法，未逐一核实原始出处，暂列作待核实参考。

## 怎么选

| 场景 | 方案 | 理由 |
|:---|:---|:---|
| 刚搭建企业知识库、简单 QA/FAQ | 2-Step RAG | 能覆盖约 80% 场景，实现简单、延迟最低，先把最小闭环跑通再考虑增强 |
| 需要 Tool Calling（SQL、Browser、GitHub、MCP 等多工具协同） | Agentic RAG | Retriever 只是 Agent 可调用的工具之一，检索与否、调用哪个工具由 Agent 自主决策 |
| 既有简单 FAQ 又有复杂问题，负载混合 | Adaptive RAG | 简单问题直接回答、复杂问题才走 Agent+RAG 路径，兼顾成本与效果 |
| 知识库质量不稳定、误召回风险高 | CRAG | 检索后插入评估器打分，低置信度触发 Web Search 等兜底，避免错误上下文直接进入生成 |
| 特别关注幻觉、答案必须可追溯 | Self-RAG | 模型自评"回答是否被检索内容支持"，未支持则显式提示，适合法律/医疗/合规场景 |
| 检索效果不好、query 与文档措辞不匹配 | HyDE 或 RAG-Fusion | 二者都用于提升 Recall：HyDE 生成单个假想答案再检索，延迟更低；RAG-Fusion 多路改写查询 + RRF 融合，覆盖面更广但成本更高 |
| 需要实体关系分析、多跳推理（医疗、法律、金融、企业组织关系） | Graph RAG | 构建/维护图谱成本最高，不要用于普通 FAQ |

三者可组合——Agentic RAG 常把 Graph RAG 或 Vector RAG 作为检索工具之一调用。

## 延伸阅读

- [RAG 原理](../concepts/rag-principles.md) — RAG 基础原理
- [Agent 原理](../concepts/agent-principles.md) — Agent 原理
- [券商内部投研知识平台](../../projects/secrag.md) — Agentic RAG 券商项目

## 参考来源

- Lewis et al., [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)
- CRAG: [Corrective Retrieval Augmented Generation](https://arxiv.org/abs/2401.15884)
- Self-RAG: [Learning to Retrieve, Generate, and Critique through Self-Reflection](https://arxiv.org/abs/2310.11511)
- [Microsoft GraphRAG](https://microsoft.github.io/graphrag/)
