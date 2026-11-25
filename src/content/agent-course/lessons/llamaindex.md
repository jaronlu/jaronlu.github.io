## 一、结论前置

1. **LlamaIndex 是“RAG-First”的数据框架——核心定位是“把你的私有数据接入 LLM”，五阶段流水线（Load→Parse/Chunk→Index→Retrieve→Synthesize）系统化了 RAG 的完整流程，官方口径为“数百个数据连接器”（hundreds of connectors）和 20+ 种向量存储（官方功能表，生态集成包已过百）是它的生态优势**。与 LangChain 的区别：LangChain 把问题框架为“编排”（orchestration），LlamaIndex 把问题框架为“数据摄入和索引”（data ingestion and indexing）。LlamaIndex 的核心原语是 DataConnectors（加载器）、NodeParsers（分块器）、Indexes（向量/摘要/树/关键词/知识图谱/属性图）、Retrievers、QueryEngines、Workflows。**选型原则：以 RAG/知识库为核心的应用用 LlamaIndex，以 Agent 编排为核心的应用用 LangChain/LangGraph，两者可以配合使用**。

2. **LlamaIndex 的独特优势是“可组合索引”（Composable Indexes）——把检索建模为一棵有类型的索引树，顶层 SummaryIndex 路由到各文档的 VectorStoreIndex，再路由到 PropertyGraphIndex 处理关系问题，这在异构语料库（财务报告+支持工单+Slack历史+工程规范）场景下比“一个向量库存所有”信号更强**。VectorStoreIndex 是最流行的索引类型（语义搜索的基础），但 LlamaIndex 支持多种索引类型，每种针对不同的查询模式优化。索引可以组合成一个查询引擎，根据查询类型自动选择使用向量搜索、关键词搜索、结构化查询还是混合检索。这种“多索引+智能路由”的设计是 LlamaIndex 区别于其他 RAG 框架的核心竞争力（现行实现是 RouterQueryEngine+QueryEngineTool；旧版 ComposableGraph 属 legacy，见下文代码示例）。

3. **LlamaIndex 的生产级架构分为三个独立服务——摄入（Ingestion）、索引（Indexing）、查询（Query with Routing）——通过异步队列连接，支持独立扩展和版本化向量存储，查询服务分离检索和生成并加断路器**。摄入服务是事件驱动、幂等的管道；索引服务是专用的，带版本化向量存储（支持灰度切换和回滚）；查询服务分离检索（Retrieval）和生成（Generation），加断路器防止级联故障。主要权衡是运维复杂度 vs 独立扩展能力。LlamaIndex 还内置评估（Evaluation）工具，可以衡量检索质量和回答准确性，这是生产级 RAG 必不可少的闭环。

---

## 二、通俗类比 + 专业定义

### 通俗类比

#### LlamaIndex = 图书馆的智能管理系统

- **Load（加载）= 图书采购和入库**：
  - 图书馆从各种渠道采购图书：出版社（PDF）、书店（Word）、捐赠者（Google Drive）、期刊（Notion/Confluence）、报纸（Slack）、档案室（GitHub）、数据库（SQL）、网站（网页）、视频（YouTube）
  - LlamaIndex 的数据连接器（LlamaHub，官方口径数百个连接器）就像图书馆的“采购渠道”——可以从任何来源获取数据
  - 采购来的图书登记为“Document”（文档）——原始数据的抽象

- **Parse/Chunk（解析/分块）= 图书拆分成章节**：
  - 一本厚厚的书（Document）不能直接检索——需要拆分成章节/段落（Nodes）
  - NodeParser 就像“图书拆分员”——按规则把书拆分成小块（可配置 chunk size、overlap、分割策略）
  - 拆分时保留元数据（书名、作者、章节号、页码）——这样检索结果可以溯源
  - 为什么要拆分？因为 LLM 的上下文窗口有限，一次只能读几块内容；拆分后可以只检索最相关的几块，而不是整本书

- **Index（索引）= 图书分类和编目**：
  - 拆分后的章节（Nodes）需要建立索引，方便快速检索
  - **VectorStoreIndex（向量索引）= 语义检索系统**：
    - 给每章内容生成“语义指纹”（Embedding 向量），存储到向量数据库
    - 检索时，把问题也生成“语义指纹”，找最相似的章节
    - 优点：能理解语义，“如何升职”和“职业发展”能匹配上
    - 这是最流行的索引类型
  - **SummaryIndex（摘要索引）= 按序翻遍全书**：
    - 注意：SummaryIndex 本身不生成摘要——它把所有节点按顺序排列，检索时遍历（默认返回全部）节点
    - 适合小数据集上的“概览类”问题（“这本书讲了什么？”）
    - 它的“摘要”角色出现在可组合索引里：给每个子索引写一段 index summary，供顶层 Router 判断该路由到哪个子索引
  - **TreeIndex（树索引）= 图书分类树**：
    - 章节按层次组织成树，从根节点（大类）到叶节点（具体章节）
    - 检索时从根开始，逐层向下选择，适合“层次类”问题
  - **KnowledgeGraphIndex（知识图谱索引）= 人物关系图**：
    - 从书中提取实体（人物、地点、事件）和关系，构建知识图谱
    - 适合“关系类”问题（“A 和 B 是什么关系？”）
  - **可组合索引 = 图书馆的联合检索系统**：
    - 顶层是“总目录”（SummaryIndex），下面是各类别的“书架”（VectorStoreIndex），再下面是“关系图”（PropertyGraphIndex）
    - 检索时，系统根据问题类型自动选择走哪个索引——“概览问题”走摘要，“细节问题”走向量，“关系问题”走知识图谱
    - 这比“所有书都放一个向量库”更精准，因为不同类型的问题需要不同的检索方式

- **Retrieve（检索）= 图书检索员**：
  - 读者提问（Query），检索员根据问题从索引中找最相关的章节（top-k Nodes）
  - 可以加过滤条件（元数据过滤）：“只找 2025 年出版的书”、“只找技术类书籍”
  - 检索结果按相关性排序，取前 k 个

- **Synthesize（合成）= 专家撰写回答**：
  - 检索到相关章节后，LLM（专家）阅读这些章节，基于内容撰写回答
  - 回答可以附带引用来源（“根据第 3 章第 2 节...”）
  - 这就是 RAG 的“生成”阶段——基于检索到的私有数据生成回答，而不是只靠 LLM 的训练知识

- **Query Engine（查询引擎）= 咨询台**：
  - 整合检索和合成的一站式界面——读者提问，咨询台自动完成检索+合成，返回回答
  - 可以切换不同的 LLM、不同的检索策略，不用改代码
  - 这是 LlamaIndex 最常用的接口

- **Chat Engine（聊天引擎）= 参考咨询馆员**：
  - 支持多轮对话——读者可以追问、澄清，馆员记住上下文
  - 适合“对话式”的知识查询

- **Postprocessors（后处理器）= 检索结果优化**：
  - 检索到初步结果后，可以进一步优化：
    - Reranking（重排序）：用更精准的模型重新排序检索结果
    - 去重：移除重复的章节
    - 元数据过滤：按条件筛选
  - 就像检索员找到 20 本相关的书后，资深馆员再从中精选出最相关的 5 本

- **Workflows（工作流）= 复杂的研究流程**：
  - 简单的问答用 Query Engine 就够了
  - 复杂的任务（如“深度研究一个主题，写一份报告”）需要多步骤的工作流
  - Workflows 提供事件驱动的编排，可以定义多步骤、有状态的工作流
  - 就像“研究项目”——需要检索、阅读、总结、撰写、修改多个步骤

### 专业定义

| 概念 | 定义 |
|------|------|
| **LlamaIndex** | 用于构建基于私有数据的 LLM 应用的 Python/TypeScript 框架。核心定位是“数据框架”，专注于 RAG（检索增强生成）和基于数据的 Agent。 |
| **RAG（Retrieval-Augmented Generation）** | 检索增强生成——结合检索（从私有数据中找相关信息）和生成（LLM 基于检索结果生成回答）的技术模式。解决 LLM 不知道私有数据和知识过时的问题。 |
| **Data Connector（数据连接器）** | 从各种来源（PDF、数据库、API、网页、SaaS）摄取数据的组件。LlamaHub 提供数百个连接器（官方口径 hundreds of connectors）。 |
| **Document（文档）** | LlamaIndex 中原始数据的抽象，包含文本内容和元数据。是数据加载后的基本单位。 |
| **Node（节点）** | Document 分块后的最小单元，包含文本片段、元数据、与其他 Node 的关系。是索引和检索的基本单位。 |
| **NodeParser（节点解析器）** | 将 Document 分割成 Nodes 的组件，可配置 chunk size、overlap、分割策略。 |
| **Index（索引）** | 组织 Nodes 的数据结构，支持高效检索。LlamaIndex 支持多种索引类型：VectorStoreIndex、SummaryIndex、TreeIndex、KeywordTableIndex、KnowledgeGraphIndex、PropertyGraphIndex。 |
| **VectorStoreIndex（向量存储索引）** | 最流行的索引类型，将 Nodes 转换为 Embedding 向量存储到向量数据库，支持基于语义相似度的检索。 |
| **Composable Index（可组合索引）** | LlamaIndex 的独特特性——将多个索引组合成树结构，顶层索引路由到下层索引，支持异构语料库的智能检索。 |
| **Retriever（检索器）** | 从索引中检索相关 Nodes 的组件，支持 top-k、元数据过滤、混合检索。 |
| **Query Engine（查询引擎）** | 整合检索和 LLM 合成的问答界面，是 LlamaIndex 最常用的接口。 |
| **Chat Engine（聊天引擎）** | 支持多轮对话的界面，记住上下文，适合对话式知识查询。 |
| **Postprocessor（后处理器）** | 检索后对结果进行优化的组件，包括 Reranking（重排序）、去重、元数据过滤。 |
| **Response Synthesizer（响应合成器）** | 基于检索到的 Nodes 和用户查询，用 LLM 生成最终回答的组件。 |
| **Embedding（嵌入）** | 将文本转换为数值向量的技术，向量表示文本的语义含义。相似语义的文本在向量空间中距离近。 |
| **Vector Store（向量存储）** | 存储和检索 Embedding 向量的数据库，LlamaIndex 官方功能表列 20+ 种向量存储（生态集成包已过百，见资料来源）。 |
| **Workflows（工作流）** | LlamaIndex 的事件驱动编排框架，支持构建多步骤、有状态的复杂 Agent 工作流。 |
| **Evaluation（评估）** | 衡量 RAG 系统质量的工具，包括检索质量（检索到的内容是否相关）和回答准确性（回答是否正确、是否有幻觉）。 |
| **LlamaHub** | LlamaIndex 的社区连接器仓库，提供数百个数据加载器、20+ 种向量存储（官方功能表口径）及各种 LLM 和工具集成。 |
| **Ingestion Pipeline（摄入管道）** | 数据从原始来源到索引的完整处理流程，包括加载、解析、分块、嵌入、存储。生产级架构中通常是独立的服务。 |

---

## 三、底层机制

### 一、LlamaIndex 的五阶段 RAG 流水线

> 官方文档把 RAG 划分为 Loading、Indexing、Storing、Querying、Evaluation 五个阶段。本节的五阶段（Load→Parse/Chunk→Index→Retrieve→Synthesize）是从实现视角的等价拆分：Parse/Chunk 对应官方 Indexing 内的转换（transform）步骤，Storing（持久化到向量库/文档库）并入 Index 阶段，Retrieve+Synthesize 合起来对应官方 Querying，Evaluation 见后文评估闭环。

```
用户查询
    ↓
┌─────────────────────────────────────────────────────────┐
│                    RAG 五阶段流水线                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Load（加载）                                          │
│     数据连接器 → Document 对象                            │
│     (PDF/数据库/API/网页/SaaS → 统一的 Document)          │
│                                                           │
│  2. Parse/Chunk（解析/分块）                              │
│     NodeParser → Nodes                                    │
│     (Document → 可配置大小/重叠的文本块)                   │
│                                                           │
│  3. Index（索引）                                         │
│     Embedding + Vector Store → Index                     │
│     (Nodes → 向量 → 索引数据结构)                          │
│                                                           │
│  4. Retrieve（检索）                                      │
│     Retriever → top-k relevant Nodes                     │
│     (查询 → 向量匹配 → 最相关的 Nodes)                     │
│                                                           │
│  5. Synthesize（合成）                                    │
│     LLM → 最终回答                                        │
│     (查询 + 检索到的 Nodes → LLM 生成回答)                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
    ↓
最终回答（附带引用来源）
```

#### 阶段 1：Load（加载）
```python
from llama_index.core import SimpleDirectoryReader
from llama_index.readers.web import SimpleWebPageReader
from llama_index.readers.github import GithubRepositoryReader

# 从本地目录加载 PDF
documents = SimpleDirectoryReader("./data").load_data()

# 从网页加载
documents = SimpleWebPageReader(html_to_text=True).load_data(
    ["https://example.com/article"]
)

# 从 GitHub 加载
documents = GithubRepositoryReader(
    owner="owner", repo="repo",
).load_data(branch="main")

# Document 对象包含 text 和 metadata
print(documents[0].text)       # 文本内容
print(documents[0].metadata)   # 元数据（来源、日期等）
```

#### 阶段 2：Parse/Chunk（解析/分块）
```python
from llama_index.core.node_parser import SentenceSplitter

# 配置分块器
parser = SentenceSplitter(
    chunk_size=512,      # 每块最大 token 数
    chunk_overlap=50,    # 相邻块的重叠 token 数
)

# 将 Document 分割成 Nodes
nodes = parser.get_nodes_from_documents(documents)

# Node 包含 text、metadata、relationships
print(nodes[0].text)
print(nodes[0].metadata)
print(nodes[0].relationships)  # 与其他 Node 的关系（前一个/后一个/源文档）
```

#### 阶段 3：Index（索引）
```python
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore

# 简单方式：从 Nodes 直接构建向量索引
index = VectorStoreIndex(nodes)

# 生产方式：指定向量存储
import chromadb
chroma_client = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = chroma_client.get_or_create_collection("my_collection")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

index = VectorStoreIndex.from_documents(
    documents, storage_context=storage_context
)
```

#### 阶段 4 & 5：Retrieve + Synthesize（查询引擎）
```python
# Query Engine 整合了检索和合成
query_engine = index.as_query_engine(
    similarity_top_k=5,          # 检索 top-5 相关节点
    response_mode="compact",     # 响应模式
)

# 查询
response = query_engine.query("什么是 RAG？")
print(response.response)  # 最终回答

# 查看引用来源
for node in response.source_nodes:
    print(f"来源: {node.metadata.get('file_name')}, 相似度: {node.score}")
```

### 二、多种索引类型详解

| 索引类型 | 检索方式 | 适用场景 | 优势 | 劣势 |
|---------|---------|---------|------|------|
| **VectorStoreIndex** | 语义相似度（向量距离） | 大多数 RAG 场景、语义搜索 | 理解语义、灵活、生态成熟 | 不精确匹配、需要 Embedding 模型 |
| **SummaryIndex** | 遍历所有节点（或摘要路由） | 概览类问题、小数据集 | 简单、全面 | 大数据集慢、成本高 |
| **TreeIndex** | 从根到叶的层次遍历 | 层次类问题、文档结构清晰 | 层次化、可解释 | 构建慢、可能错过相关内容 |
| **KeywordTableIndex** | 关键词匹配 | 精确关键词搜索、术语查询 | 精确、快速、不需要 Embedding | 不理解语义、同义词问题 |
| **KnowledgeGraphIndex** | 知识图谱遍历（实体+关系） | 关系类问题、多跳推理 | 理解实体关系、可解释 | 构建复杂、需要实体提取 |
| **PropertyGraphIndex** | 属性图查询（带属性的实体关系） | 复杂关系查询、结构化数据 | 更丰富的关系表达、支持属性 | 构建复杂、查询语言学习成本 |

#### 可组合索引（Composable Indexes）示例

现行推荐写法是 RouterQueryEngine：每个子索引的 Query Engine 封装成 QueryEngineTool，由 LLM 选择器根据问题和各 Tool 的 description 做路由。

```python
from llama_index.core import VectorStoreIndex
from llama_index.core.query_engine import RouterQueryEngine
from llama_index.core.selectors import LLMSingleSelector
from llama_index.core.tools import QueryEngineTool

# 为每类文档建独立索引（可各自用不同的分块/检索策略）
finance_index = VectorStoreIndex.from_documents(finance_docs)   # 财报
ticket_index = VectorStoreIndex.from_documents(ticket_docs)     # 客服工单
spec_index = VectorStoreIndex.from_documents(spec_docs)         # 工程规范

# 每个子索引封装成 Tool；description 是路由依据，要写清各自擅长回答什么
tools = [
    QueryEngineTool.from_defaults(
        query_engine=finance_index.as_query_engine(),
        name="finance_reports",
        description="财报数据：收入、利润、季度对比等精确数字问题",
    ),
    QueryEngineTool.from_defaults(
        query_engine=ticket_index.as_query_engine(),
        name="support_tickets",
        description="客服工单：客户投诉、故障处理流程",
    ),
    QueryEngineTool.from_defaults(
        query_engine=spec_index.as_query_engine(),
        name="eng_specs",
        description="工程规范：配置方法、架构约定",
    ),
]

# 顶层 Router：LLMSingleSelector 根据问题语义选择一个子索引
query_engine = RouterQueryEngine(
    selector=LLMSingleSelector.from_defaults(),
    query_engine_tools=tools,
)
response = query_engine.query("Q3 的收入是多少")
# 路由判断“Q3 收入”最匹配 finance_reports → 走财报索引 → 向量检索 → 合成回答
```

> 旧版还有 `ComposableGraph.from_indices(...)`（`llama_index.core.indices.composability`），用顶层 SummaryIndex + index_summaries 做组合——代码仍可用，但官方文档已下线该模块指南页，属 legacy 写法，新项目用 RouterQueryEngine。

### 三、高级检索策略

#### 混合检索（Hybrid Retrieval）
```python
from llama_index.core.retrievers import QueryFusionRetriever
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.retrievers.bm25 import BM25Retriever

# 向量检索器
vector_retriever = VectorIndexRetriever(index=index, similarity_top_k=5)

# 关键词检索器（BM25）
bm25_retriever = BM25Retriever.from_defaults(index=index, similarity_top_k=5)

# 融合检索器（查询改写 + 结果融合）
fusion_retriever = QueryFusionRetriever(
    retrievers=[vector_retriever, bm25_retriever],
    similarity_top_k=5,
    num_queries=4,  # 生成 4 个改写查询
    use_async=True,
)

# 使用融合检索器
retrieved_nodes = fusion_retriever.retrieve("什么是 RAG？")
```

#### 重排序（Reranking）
```python
from llama_index.core.postprocessor import SentenceTransformerRerank
from llama_index.postprocessor.cohere_rerank import CohereRerank

# 检索后重排序
reranker = SentenceTransformerRerank(
    model="cross-encoder/ms-marco-MiniLM-L-2-v2",
    top_n=3,  # 只保留 top-3
)

query_engine = index.as_query_engine(
    similarity_top_k=10,  # 先检索 10 个
    node_postprocessors=[reranker],  # 重排序后保留 3 个
)
```

#### 元数据过滤
```python
from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter

# 按元数据过滤
filters = MetadataFilters(
    filters=[
        ExactMatchFilter(key="category", value="技术"),
        ExactMatchFilter(key="year", value="2025"),
    ]
)

retriever = index.as_retriever(
    similarity_top_k=5,
    filters=filters,  # 只检索"技术类、2025年"的文档
)
```

### 四、生产级架构

#### 三服务架构
```
┌─────────────────────────────────────────────────────────────┐
│                    生产级 LlamaIndex 架构                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    异步队列    ┌──────────────┐         │
│  │  摄入服务     │ ─────────────→ │  索引服务     │         │
│  │  (Ingestion)  │                │  (Indexing)   │         │
│  │              │                │              │         │
│  │ • 事件驱动    │                │ • 版本化向量库 │         │
│  │ • 幂等处理    │                │ • 灰度切换    │         │
│  │ • 多源连接器  │                │ • 回滚支持    │         │
│  │ • 分块+嵌入   │                │ • 索引重建    │         │
│  └──────────────┘                └──────┬───────┘         │
│                                         │                    │
│                                         │ 读取索引            │
│                                         ↓                    │
│  ┌──────────────────────────────────────────────────┐      │
│  │              查询服务 (Query + Routing)            │      │
│  │                                                  │      │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐  │      │
│  │  │  检索层   │ →  │  后处理   │ →  │  生成层   │  │      │
│  │  │Retrieval │    │Postproc  │    │Generation│  │      │
│  │  └──────────┘    └──────────┘    └────┬─────┘  │      │
│  │                                         │         │      │
│  │  ┌─────────────────────────────────┐   │         │      │
│  │  │         断路器 (Circuit Breaker) │ ←─┘         │      │
│  │  │  • 故障检测                      │             │      │
│  │  │  • 降级策略                      │             │      │
│  │  │  • 恢复探测                      │             │      │
│  │  └─────────────────────────────────┘             │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 摄入服务（Ingestion Service）
- 事件驱动：监听数据变更事件（文件上传、数据库更新、API 推送）
- 幂等处理：相同数据重复处理不会产生重复索引（用文档 ID 去重）
- 多源连接器：支持各种数据源的并行摄入
- 分块+嵌入：在摄入时完成分块和嵌入计算，减轻查询服务负担
- 错误处理：摄入失败的数据进入死信队列，支持重试

#### 索引服务（Indexing Service）
- 版本化向量存储：每个版本的索引独立存储，支持灰度切换
- 灰度切换：新版本索引先接收少量流量，验证质量后全量切换
- 回滚支持：新版本有问题可以快速回滚到旧版本
- 索引重建：支持全量重建和增量更新
- 索引优化：定期优化向量索引（如重建 IVF 索引、压缩向量）

#### 查询服务（Query Service）
- 分离检索和生成：检索层（Retrieval）和生成层（Generation）独立扩展
- 断路器：LLM 服务故障时，断路器跳闸，返回缓存结果或降级回答
- 缓存：查询结果缓存（语义缓存），重复查询直接返回缓存
- 限流：防止查询过载，保护后端服务
- 监控：查询延迟、检索质量、回答准确性的实时监控

#### 评估闭环
```python
from llama_index.core.evaluation import (
    RetrieverEvaluator,
    FaithfulnessEvaluator,
    RelevancyEvaluator,
)
# 注意：不要 import ResponseEvaluator——当前版本里它只是 FaithfulnessEvaluator 的别名

# 检索质量评估：检索到的内容是否相关
retriever_evaluator = RetrieverEvaluator.from_metric_names(
    ["hit_rate", "mrr"], retriever=retriever
)

# 回答忠实度评估：回答是否基于检索内容（无幻觉）
faithfulness_evaluator = FaithfulnessEvaluator()

# 回答相关性评估：回答是否回答了用户问题
relevancy_evaluator = RelevancyEvaluator()

# 评估查询
eval_result = faithfulness_evaluator.evaluate_response(
    query="什么是 RAG？", response=response
)
print(f"忠实度: {eval_result.passing}, 分数: {eval_result.score}")
```

### 五、LlamaIndex Workflows（事件驱动编排）

```python
from llama_index.core.workflow import (
    Workflow, StartEvent, StopEvent, step, Event, Context
)

# 定义事件
class RetrieveEvent(Event):
    query: str

# 定义工作流
class RAGWorkflow(Workflow):
    @step
    async def retrieve(self, ctx: Context, ev: StartEvent) -> RetrieveEvent:
        """检索步骤"""
        query = ev.query
        nodes = retriever.retrieve(query)
        await ctx.store.set("nodes", nodes)  # 保存到上下文
        return RetrieveEvent(query=query, nodes=nodes)

    @step
    async def synthesize(self, ctx: Context, ev: RetrieveEvent) -> StopEvent:
        """合成步骤"""
        response = response_synthesizer.synthesize(ev.query, ev.nodes)
        return StopEvent(result=response)

# 运行工作流
workflow = RAGWorkflow(timeout=60)
result = await workflow.run(query="什么是 RAG？")
print(result)
```

---

## 四、最小可运行代码示例

### 完整的生产级 RAG 系统（多源摄入 + 混合检索 + 重排序 + 评估）

```python
import os
from llama_index.core import (
    VectorStoreIndex, SimpleDirectoryReader, StorageContext,
    Settings
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.retrievers import VectorIndexRetriever, QueryFusionRetriever
from llama_index.retrievers.bm25 import BM25Retriever
from llama_index.core.postprocessor import SentenceTransformerRerank
from llama_index.core.evaluation import FaithfulnessEvaluator, RelevancyEvaluator
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb

# ========== 1. 全局配置 ==========
# LlamaIndex 的 OpenAI / 嵌入组件自动读取 OPENAI_API_KEY / OPENAI_BASE_URL；
# LLM_MODEL 必填；嵌入模型可选 EMBEDDING_MODEL（默认 OpenAI 官方）
Settings.llm = OpenAI(model=os.environ["LLM_MODEL"], temperature=0.1)
Settings.embed_model = OpenAIEmbedding(model=os.environ.get("EMBEDDING_MODEL", "text-embedding-3-small"))
Settings.chunk_size = 512
Settings.chunk_overlap = 50

# ========== 2. 数据摄入（多源） ==========
def load_data():
    """从多个来源加载数据"""
    all_documents = []

    # 来源 1：本地 PDF 文档
    pdf_docs = SimpleDirectoryReader(
        "./data/pdfs",
        required_exts=[".pdf"],
        recursive=True
    ).load_data()
    for doc in pdf_docs:
        doc.metadata["source_type"] = "pdf"
    all_documents.extend(pdf_docs)

    # 来源 2：Markdown 文档
    md_docs = SimpleDirectoryReader(
        "./data/markdown",
        required_exts=[".md"],
    ).load_data()
    for doc in md_docs:
        doc.metadata["source_type"] = "markdown"
    all_documents.extend(md_docs)

    print(f"加载了 {len(all_documents)} 个文档")
    return all_documents

# ========== 3. 构建索引（持久化向量存储） ==========
def build_index(documents):
    """构建向量索引，使用 Chroma 持久化存储"""
    # 初始化 Chroma
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    chroma_collection = chroma_client.get_or_create_collection("rag_collection")
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    # 构建索引（如果已有索引，会加载；否则创建）
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        show_progress=True,
    )
    return index

# ========== 4. 配置高级检索（混合检索 + 重排序） ==========
def create_advanced_query_engine(index):
    """创建带混合检索和重排序的查询引擎"""
    # 向量检索器
    vector_retriever = VectorIndexRetriever(
        index=index,
        similarity_top_k=10,
    )

    # BM25 关键词检索器
    bm25_retriever = BM25Retriever.from_defaults(
        index=index,
        similarity_top_k=10,
    )

    # 融合检索器（查询改写 + 结果融合）
    fusion_retriever = QueryFusionRetriever(
        retrievers=[vector_retriever, bm25_retriever],
        similarity_top_k=10,
        num_queries=4,  # 生成 4 个改写查询
        use_async=True,
    )

    # 重排序器
    reranker = SentenceTransformerRerank(
        model="cross-encoder/ms-marco-MiniLM-L-2-v2",
        top_n=5,  # 重排序后保留 top-5
    )

    # 查询引擎
    query_engine = index.as_query_engine(
        retriever=fusion_retriever,
        node_postprocessors=[reranker],
        response_mode="compact",
        streaming=True,  # 流式输出
    )
    return query_engine

# ========== 5. 评估 ==========
def evaluate_rag(query_engine, test_questions):
    """评估 RAG 系统的质量"""
    faithfulness_evaluator = FaithfulnessEvaluator()
    relevancy_evaluator = RelevancyEvaluator()

    results = []
    for question in test_questions:
        response = query_engine.query(question)

        # 忠实度评估（是否有幻觉）
        faith_result = faithfulness_evaluator.evaluate_response(
            query=question, response=response
        )

        # 相关性评估（是否回答了问题）
        relev_result = relevancy_evaluator.evaluate_response(
            query=question, response=response
        )

        results.append({
            "question": question,
            "answer": response.response,
            "faithfulness": faith_result.passing,
            "relevancy": relev_result.passing,
            "sources": [node.metadata.get("file_name") for node in response.source_nodes],
        })

    # 统计
    faith_rate = sum(r["faithfulness"] for r in results) / len(results)
    relev_rate = sum(r["relevancy"] for r in results) / len(results)
    print(f"忠实度: {faith_rate:.2%}, 相关性: {relev_rate:.2%}")
    return results

# ========== 6. 主流程 ==========
def main():
    # 加载数据
    documents = load_data()

    # 构建索引
    index = build_index(documents)

    # 创建高级查询引擎
    query_engine = create_advanced_query_engine(index)

    # 测试查询
    response = query_engine.query("什么是 RAG？它的工作原理是什么？")
    print("\n=== 回答 ===")
    for text in response.response_gen:  # 流式输出
        print(text, end="")

    print("\n\n=== 引用来源 ===")
    for node in response.source_nodes:
        print(f"- {node.metadata.get('file_name')} (相似度: {node.score:.4f})")

    # 评估
    print("\n=== 评估 ===")
    test_questions = [
        "什么是 RAG？",
        "RAG 和微调有什么区别？",
        "如何选择 chunk size？",
    ]
    evaluate_rag(query_engine, test_questions)

if __name__ == "__main__":
    main()
```

### 多轮对话的 Chat Engine

```python
from llama_index.core import VectorStoreIndex
from llama_index.core.memory import ChatMemoryBuffer

# 构建索引
index = VectorStoreIndex.from_documents(documents)

# 创建 Chat Engine（带记忆）
chat_engine = index.as_chat_engine(
    chat_mode="condense_plus_context",  #  condense 问题 + 上下文检索
    memory=ChatMemoryBuffer.from_defaults(token_limit=4096),
    similarity_top_k=5,
)

# 多轮对话
while True:
    user_input = input("你: ")
    if user_input.lower() in ["退出", "exit", "quit"]:
        break

    response = chat_engine.chat(user_input)
    print(f"AI: {response}")

    # 查看引用来源
    if response.source_nodes:
        print("来源:")
        for node in response.source_nodes[:3]:
            print(f"  - {node.metadata.get('file_name', '未知')}")

# 重置对话
chat_engine.reset()
```

---

## 五、易混概念对比表

| 维度 | LlamaIndex | LangChain |
|------|-----------|-----------|
| 定位 | 数据框架（Data Framework） | 编排框架（Orchestration Framework） |
| 核心问题 | 如何把私有数据接入 LLM | 如何编排 LLM、工具、Agent |
| 核心原语 | DataConnectors、NodeParsers、Indexes、Retrievers、QueryEngines | Chains、Agents、Tools、Memory、Retrievers |
| RAG 支持 | RAG-First，最先进的 RAG 算法 | 基础 RAG 支持，更灵活但需要自己组装 |
| 数据连接器 | 数百个（LlamaHub，官方口径） | 丰富，但不如 LlamaIndex 专注 |
| 向量存储集成 | 20+ 种（官方功能表，生态包已过百） | 丰富 |
| 索引类型 | 多种（向量/摘要/树/关键词/知识图谱/属性图）+ 可组合 | 主要是向量索引 |
| Agent 编排 | Workflows（事件驱动） | LangGraph（状态图，更强大） |
| 评估 | 内置评估工具 | 需要 LangSmith 平台 |
| 学习曲线 | 中（RAG 概念集中） | 中高（概念多、更新快） |
| 适用场景 | 知识库、RAG 应用、文档问答 | Agent、工具调用、复杂工作流 |
| 推荐组合 | LlamaIndex 做 RAG + LangGraph 做 Agent | LangChain 做编排 + LlamaIndex 做检索 |

| 维度 | VectorStoreIndex | SummaryIndex | KnowledgeGraphIndex |
|------|-----------------|-------------|-------------------|
| 检索方式 | 语义相似度 | 遍历/摘要路由 | 知识图谱遍历 |
| 适用问题 | “是什么”、“怎么做” | “概览”、“总结” | “关系”、“多跳推理” |
| 构建成本 | 中（需要 Embedding） | 低 | 高（需要实体提取） |
| 检索速度 | 快（向量索引） | 慢（遍历） | 中（图遍历） |
| 可解释性 | 中（相似度分数） | 高（摘要可解释） | 高（关系路径可解释） |
| 大数据集 | ✅ 适合 | ❌ 不适合 | ⚠️ 中等 |
| 示例 | “如何配置 RAG？” | “这本书讲了什么？” | “A 和 B 是什么关系？” |

| 维度 | 简单 RAG | 高级 RAG（LlamaIndex 生产级） |
|------|---------|---------------------------|
| 检索 | 单一向量检索 | 混合检索（向量+BM25）+ 查询改写 |
| 后处理 | 无 | 重排序 + 去重 + 元数据过滤 |
| 分块 | 固定大小 | 语义分块 + 父子分块 |
| 索引 | 单一向量索引 | 可组合多索引 |
| 评估 | 无 | 检索质量 + 回答忠实度 + 相关性 |
| 缓存 | 无 | 语义缓存 |
| 监控 | 无 | 延迟 + 质量 + 成本监控 |
| 适用场景 | 原型、小数据集 | 生产、大数据集、高质量要求 |

| 组件 | 职责 | 关键配置 |
|------|------|---------|
| DataConnector | 从来源加载数据 | 来源类型、过滤条件 |
| NodeParser | 分块 | chunk_size、chunk_overlap、分割策略 |
| EmbeddingModel | 向量化 | 模型选择、维度、批量大小 |
| VectorStore | 存储向量 | 存储类型、索引类型、距离度量 |
| Retriever | 检索 | top_k、过滤条件、检索模式 |
| Postprocessor | 后处理 | 重排序模型、top_n、过滤规则 |
| ResponseSynthesizer | 生成回答 | LLM、响应模式、提示模板 |
| Evaluator | 评估 | 评估指标、测试集、阈值 |

---

## 六、3个实战中的常见坑

### 坑 1：chunk size 拍脑袋设成 1024，不考虑文档类型和 Embedding 模型——结果是“检索到的内容不相关”或“上下文窗口浪费”，RAG 质量差

**现象**：团队搭建 RAG 系统时，chunk size 直接用默认值 1024，没有根据文档类型和 Embedding 模型调整。结果是：①技术文档（代码、API 文档）被拆得太碎，一个函数定义被拆到两个 chunk 里，检索到的内容不完整；②长文档（书籍、报告）被拆得太大，一个 chunk 包含多个主题，检索到的 chunk 虽然相关但包含大量无关内容，浪费上下文窗口；③chunk size 设成 1024，单个 chunk 塞进多个主题，Embedding 的语义表征被稀释，检索匹配度下降。团队花了很多时间调 LLM、换向量数据库，但 RAG 质量始终上不去——根因是 chunk size 不对。

#### 避坑
- **chunk size 不是“一个值适用所有场景”，需要根据文档类型、Embedding 模型、查询模式调整**：
  - **技术文档（代码、API、配置）**：chunk size 小一些（256-512），保持代码块/函数的完整性，overlap 大一些（50-100）防止上下文断裂
  - **长文档（书籍、报告、论文）**：chunk size 大一些（512-1024），保持段落/章节的完整性，overlap 中等（50）
  - **短文档（邮件、聊天记录、FAQ）**：chunk size 可以等于文档长度，不需要拆分
  - **混合文档**：用语义分块（Semantic Chunking），根据语义边界自动拆分，而不是固定大小

- **chunk size 要匹配 Embedding 模型的输入上限**：
  - OpenAI text-embedding-3 系列：最大输入 8191 tokens（官方规格）
  - BGE-M3：最大输入 8192 tokens（论文规格）
  - 一般原则：chunk size 必须低于模型上限；但没有对所有模型和任务通用的“最佳长度”——用检索评估（hit_rate/mrr）对比几个候选值（如 256/512/1024），按数据选型
  - 如果需要大 chunk（如保持代码完整性），可以用“父子分块”（Parent-Child Chunking）——小 chunk 用于检索，大 chunk 用于生成

- **overlap（重叠）的作用是防止上下文断裂**：
  - overlap 太小：一个完整的概念被拆到两个 chunk 里，检索到一个 chunk 时缺少上下文
  - overlap 太大：chunk 之间重复内容多，浪费存储空间和检索时间
  - 一般原则：overlap = chunk_size 的 10-20%
  - 技术文档：overlap 可以大一些（20%），因为代码上下文很重要
  - 普通文档：overlap 中等（10%）

- **分块策略的选择**：
  - **SentenceSplitter（默认）**：按句子边界拆分，保持句子完整性——大多数场景适用
  - **SemanticSplitter**：按语义边界拆分，相邻句子语义相似度低时拆分——适合语义变化大的文档
  - **CodeSplitter**：按代码结构（函数、类）拆分——适合代码文档
  - **MarkdownSplitter**：按 Markdown 标题拆分——适合 Markdown 文档
  - 不要所有文档都用 SentenceSplitter——根据文档类型选择合适的分块器

- **父子分块（Parent-Child Chunking）的高级技巧**：
  ```python
  # 现行方案：HierarchicalNodeParser 层级分块 + AutoMergingRetriever 自动合并
  # （旧写法 from llama_index.core import SimpleNodeParser 在当前版本已移除，
  #   且只建两个独立 parser 也建立不了父子关系）
  from llama_index.core import VectorStoreIndex, StorageContext
  from llama_index.core.node_parser import HierarchicalNodeParser, get_leaf_nodes
  from llama_index.core.retrievers import AutoMergingRetriever
  from llama_index.core.storage.docstore import SimpleDocumentStore

  # 层级分块：由大到小三层（父 2048 → 中 512 → 叶 128）
  parser = HierarchicalNodeParser.from_defaults(chunk_sizes=[2048, 512, 128])
  nodes = parser.get_nodes_from_documents(documents)
  leaf_nodes = get_leaf_nodes(nodes)  # 叶节点 = 小 chunk，用于检索

  # 全量节点（含父节点）存 docstore；向量索引只放叶节点
  docstore = SimpleDocumentStore()
  docstore.add_documents(nodes)
  storage_context = StorageContext.from_defaults(docstore=docstore)
  index = VectorStoreIndex(leaf_nodes, storage_context=storage_context)

  # 检索命中叶节点后，按命中比例自动向上合并到父节点，用更完整的上下文生成
  # 这样既保证了检索的精准（小 chunk），又保证了生成的上下文完整（大 chunk）
  base_retriever = index.as_retriever(similarity_top_k=6)
  retriever = AutoMergingRetriever(
      base_retriever, storage_context, simple_ratio_thresh=0.5
  )
  ```

- **评估分块质量的方法**：
  - 用检索评估（Retriever Evaluator）测量 hit_rate 和 mrr——不同 chunk size 对比
  - 人工抽查：检索到的 chunk 是否真的相关？是否包含完整的上下文？
  - 端到端评估：用不同 chunk size 构建索引，评估回答质量（忠实度、相关性）
  - 不要“拍脑袋”设 chunk size——用数据驱动的方式选择最优值

- **类比**：就像“切菜”——
  - 炒肉丝：肉要切细丝（小 chunk），容易熟、入味
  - 炖牛肉：肉要切大块（大 chunk），不容易烂、有口感
  - 拌黄瓜：黄瓜可以不切（短文档不拆分）
  - 不能所有菜都切一样大——根据菜的类型（文档类型）和烹饪方式（Embedding 模型）选择合适的大小
  - 切菜的手艺（分块策略）直接影响菜的味道（RAG 质量）

### 坑 2：只做向量检索，不做混合检索和重排序——“同义词查不到”、“关键词匹配不上”、“检索结果排序不准”，RAG 召回率低

**现象**：团队的 RAG 系统只用向量检索（VectorStoreIndex），结果是：①用户问“如何升职”，但文档里写的是“职业发展路径”——向量检索能匹配上（语义相似），但用户问“API 错误码 403 是什么意思”，文档里写的是“HTTP 403 Forbidden”——向量检索可能匹配不上（因为“错误码”和“Forbidden”语义不完全相同）；②用户问“配置文件里的 timeout 参数”，文档里确实有，但向量检索把它排到了第 10 位（top_k=5 就错过了）——因为向量相似度不高，但关键词完全匹配；③技术术语、产品名、错误码等精确匹配的场景，向量检索的召回率明显低于关键词检索。团队以为是“Embedding 模型不好”，换了几个模型还是不行——根因是只用向量检索，缺少混合检索和重排序。

#### 避坑
- **生产级 RAG 必须用混合检索（Hybrid Retrieval）——向量检索 + 关键词检索，取长补短**：
  - **向量检索的优势**：理解语义，同义词、改写、相关概念都能匹配——适合“是什么”、“怎么做”这类语义问题
  - **向量检索的劣势**：精确匹配（术语、错误码、产品名、ID）可能不准，因为向量空间中这些词的表示可能不相似
  - **关键词检索（BM25）的优势**：精确匹配，术语、错误码、产品名、ID 都能精准匹配——适合“查特定词”这类精确问题
  - **关键词检索的劣势**：不理解语义，同义词、改写匹配不上
  - **混合检索 = 向量检索 + 关键词检索 + 结果融合**——两种检索的结果合并、去重、排序，取两者的并集，召回率更高

- **LlamaIndex 中的混合检索实现**：
  ```python
  from llama_index.core.retrievers import QueryFusionRetriever, VectorIndexRetriever
  from llama_index.retrievers.bm25 import BM25Retriever

  # 向量检索器
  vector_retriever = VectorIndexRetriever(index=index, similarity_top_k=10)
  # BM25 关键词检索器
  bm25_retriever = BM25Retriever.from_defaults(index=index, similarity_top_k=10)

  # 融合检索器
  fusion_retriever = QueryFusionRetriever(
      retrievers=[vector_retriever, bm25_retriever],
      similarity_top_k=10,
      num_queries=4,  # 查询改写：生成 4 个语义相似的查询，提高召回率
      use_async=True,
  )
  ```
  - `QueryFusionRetriever` 不仅融合多个检索器的结果，还会做“查询改写”——生成多个语义相似的查询，分别检索后合并，进一步提高召回率
  - 这是 LlamaIndex 的高级特性，生产级 RAG 推荐使用

- **重排序（Reranking）是混合检索的必要补充——检索到 top-10 后，用更精准的模型重新排序，取 top-5**：
  - 为什么需要重排序？向量检索和 BM25 的排序都不完美——向量检索按语义相似度排序，BM25 按关键词匹配度排序，但都不是“真正的相关性”
  - 重排序模型（Cross-Encoder）是专门为“相关性排序”训练的——输入查询和文档，输出相关性分数，比向量检索和 BM25 精准得多
  - 流程：先检索 top-10（召回率优先），再重排序取 top-5（精准度优先）——这样既保证了召回率，又保证了排序质量
  - 常用的重排序模型：Cohere Rerank、bge-reranker、cross-encoder/ms-marco

- **元数据过滤（Metadata Filtering）可以大幅提高检索精准度**：
  - 给文档添加丰富的元数据（来源、日期、类别、作者、标签）
  - 检索时按元数据过滤——“只查 2025 年的技术文档”、“只查 API 参考”
  - 这样可以缩小检索范围，减少无关结果，提高精准度
  - 元数据过滤是“粗筛”，向量/关键词检索是“细筛”——先粗筛再细筛，效率和质量都更高

- **检索质量的评估和优化**：
  - 用 `RetrieverEvaluator` 测量 hit_rate（命中率）和 mrr（平均倒数排名）
  - hit_rate：top-k 检索结果中是否包含相关文档——衡量召回率
  - mrr：相关文档在检索结果中的排名——衡量排序质量
  - 对比不同检索策略（纯向量 vs 混合 vs 混合+重排序）的 hit_rate 和 mrr，选择最优
  - 不要“感觉检索质量不好”——用数据量化，针对性优化

- **类比**：就像“找书”——
  - 纯向量检索 = 按“主题相似”找书——能找到相关主题的书，但可能错过标题完全匹配的书
  - 纯关键词检索 = 按“书名/关键词”找书——能精准找到特定书名的书，但可能错过主题相关但标题不同的书
  - 混合检索 = 同时按“主题相似”和“书名关键词”找书，合并结果——两种方式的书都能找到，召回率更高
  - 重排序 = 找到 20 本书后，资深图书管理员再从中精选出最相关的 5 本——排序更精准
  - 元数据过滤 = 先限定“只在技术类书架找”，再检索——缩小范围，提高效率
  - 生产级“找书系统”应该是：先按类别过滤（元数据）→ 同时按主题和书名找（混合检索）→ 精选最相关的（重排序）

### 坑 3：把 LlamaIndex 当“黑盒”用——`index.as_query_engine()` 一行代码搞定，不理解内部机制，遇到检索质量差、回答幻觉、性能问题时无法排查和优化

**现象**：团队用 LlamaIndex 搭建 RAG 系统，代码非常简单——`index = VectorStoreIndex.from_documents(docs)`、`query_engine = index.as_query_engine()`、`response = query_engine.query(question)`，三行代码就跑起来了。但上线后问题不断：①检索质量差，用户问的问题经常找不到相关内容；②回答有幻觉，LLM 编造文档中没有的内容；③性能差，查询延迟高，并发上不去；④无法排查问题，不知道是分块的问题、检索的问题、还是 LLM 的问题。团队想优化，但不知道从哪里入手——因为把 LlamaIndex 当黑盒，不理解内部的五个阶段（Load→Parse→Index→Retrieve→Synthesize），不知道每个阶段可以独立配置和优化。

#### 避坑
- **理解 LlamaIndex 的五阶段流水线，每个阶段都可以独立配置、替换、优化**：
  ```
  Query Engine 不是黑盒，它是这五个阶段的组合：
  1. Load（加载）→ 可以换不同的 DataConnector
  2. Parse（分块）→ 可以换不同的 NodeParser，调 chunk_size/overlap
  3. Index（索引）→ 可以换不同的 Index 类型、Vector Store、Embedding 模型
  4. Retrieve（检索）→ 可以换不同的 Retriever，调 top_k，加过滤
  5. Synthesize（合成）→ 可以换不同的 LLM、Response Mode、Prompt 模板
  ```
  - 出问题时，先定位是哪个阶段的问题，再针对性优化——不要“整体换一个框架”

- **检索质量差时，按这个顺序排查**：
  1. **分块对吗？** chunk size 是否合适？文档是否被正确拆分？代码块是否完整？
  2. **Embedding 模型对吗？** 是否用了合适的 Embedding 模型？是否支持中文？维度是否合适？
  3. **检索策略对吗？** 是否只用了向量检索？是否需要混合检索？top_k 是否足够？
  4. **元数据过滤对吗？** 是否需要按类别/日期过滤？过滤条件是否太严格（导致漏检）？
  5. **索引类型对吗？** 是否需要 SummaryIndex 或 KnowledgeGraphIndex？是否需要可组合索引？
  - 用 `RetrieverEvaluator` 量化检索质量（hit_rate、mrr），不要凭感觉

- **回答有幻觉时，按这个顺序排查**：
  1. **检索到的内容相关吗？** 如果检索到的内容不相关，LLM 只能靠自己的知识回答，容易幻觉
  2. **检索到的内容完整吗？** 如果内容被拆碎了，LLM 看到的是不完整的上下文，容易误解
  3. **Response Mode 对吗？** `compact`（压缩上下文后生成）比 `refine`（逐块 refine）更不容易幻觉，但可能遗漏细节
  4. **Prompt 模板对吗？** 是否明确告诉 LLM“只基于提供的上下文回答，不要编造”？
  5. **LLM 温度对吗？** temperature 设低一些（0.1），减少随机性和幻觉
  - 用 `FaithfulnessEvaluator` 量化幻觉率，不要凭感觉

- **性能差时，按这个顺序排查**：
  1. **检索慢吗？** 向量数据库是否优化？索引类型是否合适？top_k 是否太大？
  2. **Embedding 计算慢吗？** 是否批量计算？是否用了更快的 Embedding 模型？是否缓存了 Embedding？
  3. **LLM 调用慢吗？** 是否用了流式输出？是否用了更快的模型？是否有语义缓存？
  4. **并发能力够吗？** 是否异步？是否有连接池？是否有限流？
  - 生产级架构应该分离摄入、索引、查询服务，独立扩展

- **用 LlamaIndex 的评估工具建立质量闭环**：
  ```python
  # 不要只看"回答看起来对不对"，要用数据量化
  from llama_index.core.evaluation import (
      RetrieverEvaluator, FaithfulnessEvaluator, RelevancyEvaluator
  )

  # 1. 检索质量：hit_rate（召回率）、mrr（排序质量）
  # 2. 回答忠实度：回答是否基于检索内容（无幻觉）
  # 3. 回答相关性：回答是否回答了用户问题
  # 定期跑评估，监控质量变化，优化时有数据支撑
  ```
  - 建立测试集（标准问题+标准答案），每次改动后跑评估，对比质量变化
  - 这是生产级 RAG 必不可少的闭环——没有评估，就不知道优化是否有效

- **不要排斥高级特性，但也不要过度工程**：
  - 简单场景（小数据集、原型验证）：用默认配置即可，`index.as_query_engine()` 三行代码搞定
  - 生产场景（大数据集、高质量要求）：逐步引入高级特性——混合检索 → 重排序 → 语义分块 → 可组合索引 → 评估闭环
  - 不要一上来就把所有高级特性都用上——复杂度高、维护难，可能还不如简单配置
  - 也不要一直用默认配置——生产级问题需要生产级方案
  - 渐进式优化：先用简单方案跑起来，用评估工具发现瓶颈，再针对性引入高级特性

- **类比**：就像“开车”——
  - 黑盒用法 = 只会踩油门和刹车，不理解发动机、变速箱、刹车的工作原理——车出问题了不知道是发动机的问题还是刹车的问题，只能送修理厂
  - 理解流水线 = 理解车的各个系统（发动机、变速箱、刹车、悬挂），每个系统可以独立检查、调整、更换——车出问题了能定位是哪个系统的问题，自己就能修
  - 简单场景（城市通勤）= 自动挡车，踩油门就走，不用理解太多
  - 复杂场景（越野、赛道）= 需要理解各个系统，根据路况调整——悬挂调软/硬、变速箱调手动/自动、刹车调灵敏度
  - LlamaIndex 也是一样——简单场景用默认配置，复杂场景需要理解流水线、针对性优化，不要一直当黑盒

---

## 七、进阶问题（引导往下挖）

### 问题 1：LlamaIndex 的“可组合索引”（Composable Indexes）在什么场景下真正有价值？什么时候“一个向量库存所有”就够了？可组合索引的运维复杂度和收益如何权衡？

#### 引导思考
- **“一个向量库存所有”的局限性**：
  - 假设我们有一个异构语料库：财务报告（PDF，长文档）、支持工单（JSON，短文档）、Slack 历史（聊天记录，碎片化）、工程规范（Markdown，结构化）
  - 把所有这些都放一个向量库，用统一的 chunk size（如 512）和检索策略：
    - 财务报告：512 chunk 可能太小，一个财务分析段落被拆碎，检索到的内容不完整
    - 支持工单：512 chunk 可能太大，一个工单只有 100 字，浪费了上下文
    - Slack 历史：512 chunk 可能包含多个不相关的对话片段，语义不集中
    - 工程规范：512 chunk 可能合适，但需要按标题结构拆分，而不是固定大小
  - 统一的检索策略也有问题：
    - “财务报告中 Q3 的收入是多少？”——需要精确匹配“Q3”、“收入”，向量检索可能不准
    - “Slack 中大家对新功能怎么看？”——需要语义检索，找相关的讨论
    - “工程规范中如何配置缓存？”——需要按标题路由到“配置”章节，再向量检索
  - 一个向量库 + 统一策略 = 所有场景都“还行”，但没有一个场景“很好”

- **可组合索引的价值场景**：

  **场景 1：异构语料库（不同类型、不同结构的文档混合）**：
  - 每种文档类型用独立的索引，配置适合该类型的 chunk size、分块策略、检索方式
  - 顶层用 SummaryIndex 或 Router 做智能路由——根据问题类型选择合适的子索引
  - 这样每种文档类型都能达到最优的检索质量，而不是“平均水平”

  **场景 2：多租户/多部门知识库**：
  - 每个部门（财务、法务、工程、市场）有独立的索引，数据隔离
  - 顶层 Router 根据用户身份和问题类型，路由到对应部门的索引
  - 支持权限控制——财务数据只有财务部门的人能检索
  - 索引可以独立更新、独立扩展，不会互相影响

  **场景 3：层次化文档（书籍、手册、规范）**：
  - 顶层是书籍/手册的摘要索引（SummaryIndex），回答“概览类”问题
  - 中层是章节级的向量索引（VectorStoreIndex），回答“章节级”问题
  - 底层是知识图谱索引（KnowledgeGraphIndex），回答“关系类”问题
  - 检索时从顶层开始，逐层向下路由，既高效又精准

  **场景 4：需要不同检索策略的混合问题**：
  - 有些问题需要精确匹配（错误码、产品名、ID）→ 用关键词索引
  - 有些问题需要语义理解（概念解释、方法说明）→ 用向量索引
  - 有些问题需要多跳推理（关系、因果）→ 用知识图谱索引
  - 可组合索引可以同时包含多种索引类型，根据问题自动选择

- **“一个向量库存所有”就够了的场景**：

  **场景 1：同质语料库（所有文档类型相同、结构相似）**：
  - 比如全是技术文档（Markdown），或者全是产品手册（PDF）
  - 统一的 chunk size 和检索策略就能达到很好的效果
  - 不需要可组合索引，增加复杂度没有收益

  **场景 2：小数据集（< 1000 个文档）**：
  - 数据量小，检索质量问题不明显
  - 可组合索引的运维复杂度超过了收益
  - 先用简单方案，数据量增长后再考虑可组合索引

  **场景 3：原型验证和快速迭代**：
  - 目标是快速验证想法，不是追求最优检索质量
  - 简单方案更快、更易调试
  - 验证成功后，再根据瓶颈引入可组合索引

  **场景 4：查询模式单一（所有问题都是同一种类型）**：
  - 比如所有问题都是“概念解释”（语义检索），或者都是“关键词查询”（精确匹配）
  - 一种索引类型就能满足所有查询
  - 不需要多种索引组合

- **可组合索引的运维复杂度**：
  - **索引管理**：多个索引需要独立构建、更新、监控——运维成本是单索引的 N 倍
  - **路由准确性**：顶层 Router 的路由准确性直接影响整体质量——路由错了，子索引再准也没用
  - **跨索引检索**：有些问题需要跨多个索引检索（如“财务和工程都涉及的问题”）——需要结果合并和去重
  - **一致性**：多个索引的 Embedding 模型、chunk 策略可能不同——结果融合时需要归一化
  - **调试难度**：检索质量差时，需要排查是路由的问题、子索引的问题、还是结果融合的问题——比单索引复杂

- **权衡决策框架**：
  ```
  需要可组合索引吗？
  ├── 语料库是异构的吗？（多种文档类型/结构）
  │   ├── 是 → 可能需要
  │   └── 否 → 单索引够了
  ├── 数据量大吗？（> 10000 文档）
  │   ├── 是 → 可能需要（优化检索质量的收益大）
  │   └── 否 → 单索引够了（复杂度超过收益）
  ├── 查询模式多样吗？（语义/精确/关系等多种类型）
  │   ├── 是 → 可能需要（多种索引类型互补）
  │   └── 否 → 单索引够了
  ├── 需要多租户/权限隔离吗？
  │   ├── 是 → 需要（独立索引+权限控制）
  │   └── 否 → 单索引够了
  └── 团队有能力运维多索引吗？
      ├── 是 → 可以考虑
      └── 否 → 先用单索引，后续再演进
  ```

- **渐进式演进路径**：
  1. **阶段 1**：单向量索引 + 默认配置——快速跑起来
  2. **阶段 2**：单向量索引 + 高级检索（混合检索+重排序+元数据过滤）——优化检索质量
  3. **阶段 3**：按文档类型分索引（如 PDF 一个索引、Markdown 一个索引）+ Router——初步可组合
  4. **阶段 4**：完整的可组合索引（多种索引类型+层次结构+智能路由）——生产级
  - 不要一上来就做阶段 4——从阶段 1 开始，用评估工具发现瓶颈，逐步演进
  - 每个阶段都要有评估数据支撑，确认“引入复杂度确实带来了质量提升”

- **类比**：就像“超市的商品布局”——
  - 一个大货架放所有商品（单向量库）= 简单，但找特定商品慢，商品分类不清晰
  - 分区布局（可组合索引）= 生鲜区、日用品区、电器区、食品区，每个区有自己的货架和分类方式，入口有导览图（Router）告诉你去哪个区
  - 小超市（小数据集）= 一个大货架就够了，分区反而麻烦
  - 大超市（大数据集）= 必须分区，否则顾客找不到商品
  - 异构商品（异构语料库）= 必须分区，生鲜需要冷藏，电器需要展示，食品需要保质期管理——不同区有不同的管理方式
  - 可组合索引就是“超市的分区布局”——在合适的场景下能大幅提升检索效率和质量，但需要额外的运维成本

### 问题 2：LlamaIndex 和 LangChain/LangGraph 如何配合使用？各自的边界在哪里？在什么场景下应该用 LlamaIndex 的 Workflows，什么场景下应该用 LangGraph？

#### 引导思考
- **LlamaIndex 和 LangChain 的定位差异**：
  - **LlamaIndex**：数据框架，专注于“把私有数据接入 LLM”——核心是 RAG 流水线（加载、分块、索引、检索、合成）
  - **LangChain**：编排框架，专注于“编排 LLM、工具、Agent”——核心是 Chain、Agent、Tool、Memory
  - **LangGraph**：编排运行时，专注于“有状态、持久化、人机交互的 Agent 编排”——核心是 StateGraph、Checkpoint、Interrupt
  - 三者不是竞争关系，而是互补关系——可以配合使用

- **推荐的配合架构**：
  ```
  ┌─────────────────────────────────────────────────────┐
  │                   Agent 应用                          │
  ├─────────────────────────────────────────────────────┤
  │                                                     │
  │  ┌──────────────┐    调用工具     ┌──────────────┐ │
  │  │  LangGraph   │ ←────────────→ │  LlamaIndex  │ │
  │  │  (Agent 编排) │    RAG 工具     │  (RAG 管道)  │ │
  │  │              │                 │              │ │
  │  │ • 状态管理    │                 │ • 数据加载    │ │
  │  │ • 循环控制    │                 │ • 分块索引    │ │
  │  │ • 持久化      │                 │ • 混合检索    │ │
  │  │ • 人机交互    │                 │ • 重排序      │ │
  │  │ • 多 Agent    │                 │ • 评估        │ │
  │  └──────────────┘                 └──────────────┘ │
  │         │                                  ↑         │
  │         │ 调用其他工具                        │         │
  │         ↓                                  │         │
  │  ┌──────────────┐                          │         │
  │  │  其他工具     │ ─────────────────────────┘         │
  │  │ (搜索/代码/   │   检索结果作为上下文                 │
  │  │  邮件/API)   │                                    │
  │  └──────────────┘                                    │
  └─────────────────────────────────────────────────────┘
  ```

  **核心思路**：
  - **LangGraph 负责 Agent 编排**：决定“做什么”（任务分解、工具选择、循环控制、状态管理）
  - **LlamaIndex 负责 RAG 管道**：当 Agent 需要“查资料”时，调用 LlamaIndex 的 Query Engine 作为工具，返回检索结果和回答
  - **LlamaIndex 的 RAG 能力封装成 Tool**：LangGraph 的 Agent 可以像调用其他工具一样调用 LlamaIndex 的检索能力
  - **两者解耦**：RAG 管道可以独立优化（换分块策略、换检索策略、换向量库），不影响 Agent 编排；Agent 编排可以独立优化（换控制流、加人机交互、加多 Agent），不影响 RAG 管道

- **具体实现示例**：
  ```python
  # ===== LlamaIndex 部分：构建 RAG 管道 =====
  from llama_index.core import VectorStoreIndex
  from llama_index.core.tools import QueryEngineTool

  index = VectorStoreIndex.from_documents(documents)
  query_engine = index.as_query_engine(similarity_top_k=5)

  # 把 Query Engine 封装成 Tool
  rag_tool = QueryEngineTool.from_defaults(
      query_engine=query_engine,
      name="knowledge_base_search",
      description="查询公司知识库，回答关于产品、技术、流程的问题",
  )

  # ===== LangChain/LangGraph 部分：构建 Agent =====
  # 所需环境变量：OPENAI_API_KEY / OPENAI_BASE_URL / LLM_MODEL（ChatOpenAI 自动读取前两个）
  import os
  # 注意：langgraph.prebuilt.create_react_agent 自 LangGraph v1.0 起弃用，迁移为 langchain.agents.create_agent
  from langchain.agents import create_agent
  from langchain_core.tools import Tool
  from langchain_openai import ChatOpenAI

  llm = ChatOpenAI(model=os.environ["LLM_MODEL"])

  # 关键：LlamaIndex 的 QueryEngineTool 不能直接传给 LangChain Agent（实测 ValueError），
  # 必须先用 langchain 的 Tool 包装 query_engine
  rag_tool_lc = Tool.from_function(
      func=lambda q: str(query_engine.query(q)),  # 调用上面 LlamaIndex 的 query_engine
      name="knowledge_base_search",
      description="查询公司知识库，回答关于产品、技术、流程的问题",
  )

  # Agent 调用包装后的 RAG 工具（可再混入其他 LangChain 工具）
  agent = create_agent(model=llm, tools=[rag_tool_lc])

  # 运行 Agent
  result = agent.invoke({"messages": [{"role": "user", "content": "查一下知识库中关于 RAG 的内容，然后写一个总结"}]})
  # Agent 会自主决定：先调用 rag_tool_lc 查知识库，再基于结果写总结
  ```

- **各自的边界**：

  **LlamaIndex 负责的部分**：
  - 数据加载（Data Connectors）
  - 文档分块（Node Parsers）
  - 索引构建（Indexes、Vector Stores）
  - 检索策略（Retrievers、混合检索、重排序）
  - 响应合成（Response Synthesizer）
  - RAG 评估（Retriever Evaluator、Faithfulness Evaluator）
  - 简单的查询/聊天接口（Query Engine、Chat Engine）

  **LangGraph 负责的部分**：
  - Agent 循环控制（ReAct、Plan-and-Execute）
  - 状态管理（State、Reducer）
  - 持久化（Checkpoint、故障恢复）
  - 人机交互（Interrupt、审批）
  - 多 Agent 协作（Supervisor、Pipeline）
  - 复杂控制流（条件分支、循环、并行）
  - 流式输出（细粒度事件流）

  **重叠的部分（需要选择）**：
  - **简单的 RAG 问答**：用 LlamaIndex 的 Query Engine 就够了，不需要 LangGraph
  - **简单的工具调用 Agent**：用 LlamaIndex 的 Agent 或 LangChain 的 create_agent 就够了
  - **复杂的 Agent（需要持久化、人机交互、多步骤）**：用 LangGraph
  - **复杂的 RAG（需要多轮检索、检索策略动态调整）**：可以用 LlamaIndex Workflows 或 LangGraph

- **LlamaIndex Workflows vs LangGraph 的选择**：

  **LlamaIndex Workflows 的特点**：
  - 事件驱动的编排框架，集成在 LlamaIndex 生态中
  - 适合“以 RAG 为核心”的工作流（如多轮检索、检索策略调整、RAG 管道编排）
  - 与 LlamaIndex 的组件（Index、Retriever、Query Engine）深度集成
  - 学习曲线低（如果已经熟悉 LlamaIndex）
  - 持久化、人机交互能力不如 LangGraph 强大

  **LangGraph 的特点**：
  - 状态图编排运行时，独立于 LlamaIndex
  - 适合“以 Agent 为核心”的复杂编排（多 Agent、人机交互、持久化、长时间运行）
  - 与 LangChain 生态深度集成，但也可以配合 LlamaIndex
  - 持久化（Checkpoint）、人机交互（Interrupt）、时间旅行是杀手级特性
  - 学习曲线中高（需要理解状态图模型）

  **选择决策**：
  ```
  用 Workflows 还是 LangGraph？
  ├── 工作流的核心是 RAG 吗？（检索、索引、文档处理）
  │   ├── 是 → 倾向于 Workflows（与 LlamaIndex 深度集成）
  │   └── 否 → 继续判断
  ├── 需要持久化执行吗？（长时间运行、故障恢复）
  │   ├── 是 → LangGraph（Checkpoint 更成熟）
  │   └── 否 → 继续判断
  ├── 需要人机交互吗？（人工审批、人类输入）
  │   ├── 是 → LangGraph（Interrupt 更成熟）
  │   └── 否 → 继续判断
  ├── 需要多 Agent 协作吗？
  │   ├── 是 → LangGraph（多 Agent 编排更强大）
  │   └── 否 → 两者都可以，选熟悉的
  └── 团队更熟悉哪个生态？
      ├── LlamaIndex → Workflows
      └── LangChain → LangGraph
  ```

- **常见的配合模式**：

  **模式 1：LlamaIndex RAG 作为 LangGraph Agent 的工具**（最常见）
  - LlamaIndex 负责构建高质量的 RAG 管道，封装成 Tool
  - LangGraph 负责 Agent 编排，自主决定何时调用 RAG 工具
  - 适合：需要查知识库 + 其他工具（搜索、代码、邮件）的复杂 Agent

  **模式 2：LangGraph 编排 LlamaIndex 的多轮检索**
  - LangGraph 负责控制多轮检索的流程（先检索→判断是否足够→不够则改写查询再检索→足够则生成）
  - LlamaIndex 负责每一轮的具体检索（Index、Retriever）
  - 适合：需要迭代检索、自适应检索策略的高级 RAG

  **模式 3：LlamaIndex 做简单 RAG，LangGraph 做复杂 Agent**
  - 简单的知识库问答直接用 LlamaIndex Query Engine（不需要 Agent）
  - 复杂的任务（需要多工具、多步骤、人机交互）用 LangGraph Agent
  - 两者在同一个应用中并存，根据任务类型选择
  - 适合：既有简单问答又有复杂任务的综合应用

  **模式 4：LlamaIndex Workflows 做 RAG 管道编排，LangGraph 做 Agent 编排**
  - LlamaIndex Workflows 负责 RAG 管道内部的编排（加载→分块→索引→检索→合成）
  - LangGraph 负责 Agent 层面的编排（任务分解→工具选择→循环控制）
  - 两者分层，各司其职
  - 适合：复杂的生产级系统，RAG 管道和 Agent 都需要灵活编排

- **不要做的事情**：
  - **不要用 LlamaIndex 做复杂的 Agent 编排**——LlamaIndex 的 Agent 能力不如 LangGraph 强大，持久化、人机交互、多 Agent 都不够成熟
  - **不要用 LangGraph 做 RAG 管道的底层实现**——LangGraph 没有 LlamaIndex 的数据连接器、分块器、多种索引类型、RAG 评估，从零实现 RAG 管道是重复造轮子
  - **不要混用两个框架的概念**——LlamaIndex 的 Node/Index/Retriever 和 LangChain 的 Document/Retriever/Tool 概念相似但不完全相同，混用会导致混乱
  - **不要在两个框架之间频繁切换**——选定一个配合模式，保持一致性，降低维护成本

- **类比**：就像“餐厅的厨房和前厅”——
  - LlamaIndex = 后厨（RAG 管道）——负责食材采购（数据加载）、切菜（分块）、烹饪（索引）、装盘（检索合成）
  - LangGraph = 前厅（Agent 编排）——负责接待顾客（用户输入）、点菜（任务分解）、通知后厨做菜（调用工具）、上菜（返回结果）、处理特殊要求（人机交互）
  - 前厅和后厨配合：前厅接到订单，通知后厨做对应的菜，后厨做好后传给前厅，前厅端给顾客
  - 后厨不需要关心顾客怎么点菜（Agent 编排），前厅不需要关心菜怎么做（RAG 管道）
  - 两者各司其职，配合默契——这就是 LlamaIndex 和 LangGraph 的理想配合模式
  - 小餐馆（简单应用）= 一个人既当厨师又当服务员（用一个框架就够了）
  - 大餐厅（复杂应用）= 后厨和前厅分工明确（LlamaIndex + LangGraph 配合）

- 延伸：后续知识点（生产级 Agent 架构设计）会深入讲解如何根据场景选择和组合不同的 Agent 框架和架构模式

---

## 八、四关自测

### 复述关（3句话讲清）
1. LlamaIndex 是“RAG-First”数据框架，核心定位是把私有数据接入 LLM，五阶段流水线 Load→Chunk→Index→Retrieve→Synthesize，官方口径数百个数据连接器和 20+ 种向量存储集成是生态优势。
2. 它和 LangChain 的分工：LlamaIndex 管“数据摄入和索引”（RAG 管道），LangChain/LangGraph 管“Agent 编排”（循环/状态/工具），复杂系统里通常是 LangGraph 把 LlamaIndex 的 Query Engine 封装成一个 Tool 来调用。
3. 独特优势是可组合索引（Composable Indexes）——异构语料库（财务报告+工单+聊天记录）按文档类型建独立索引，顶层 SummaryIndex 智能路由；生产架构拆成摄入/索引/查询三个独立服务，加混合检索+重排序+RAG 评估闭环。

### 举例关（真实场景）
你要做一个“公司知识库问答”系统，语料有 PDF 财报、Markdown 工程规范、JSON 客服工单。如果全塞一个向量库用统一 chunk size，财报被切得稀碎、工单又太浪费上下文。用 LlamaIndex：每种文档建独立 VectorStoreIndex，顶层用 SummaryIndex 做路由——用户问“Q3 收入”路由到财报索引，问“客户投诉怎么处理”路由到工单索引。再配 BM25+向量的混合检索和重排序，最后用 LlamaIndex 内置的 Faithfulness Evaluator 自动检查回答有没有基于检索内容瞎编。这个 RAG 管道封装成 `QueryEngineTool`，LangGraph Agent 要查资料时就调它。

### 反例关（边界条件）
你的知识库只有 50 篇格式统一的 Markdown 文档，却上来就搞可组合索引+Router+多索引并行——运维复杂度翻几倍，检索质量却没提升，小数据集单向量索引就够了。另一个坑是拿 LlamaIndex 去做复杂多 Agent 编排、要持久化和人机审批——它这方面不如 LangGraph 成熟，正确做法是 RAG 用 LlamaIndex、Agent 编排交给 LangGraph。最常见的坑是只做向量检索不做重排序和评估——检索到的内容不相关、回答有幻觉都发现不了，RAG 没有评估闭环等于盲人开车。

### 教学关（给小白讲）
你开了个餐厅，客人问“我们家合同里关于退款的条款是什么”——你（大模型）自己脑子里没存公司所有合同，得去资料室翻。LlamaIndex 就是那个资料室管理员：他负责把你所有的 PDF、工单、聊天记录搬进来（加载）、剪成一小片一小片好检索（分块）、编好目录（索引）、客人一问就快速翻出相关那几页（检索）、然后把内容整理成回答（合成）。它最擅长的就是“管资料”这件事。而 LangGraph 是前厅经理，负责决定“先点菜还是先问厨房有没有货”。两者配合：前厅经理（LangGraph）需要查资料时，喊资料室管理员（LlamaIndex）把相关合同页拿过来。小餐馆一个人兼了就行，大餐厅才需要分工。

---

## 资料来源

- 官方文档: [LlamaIndex - Introduction to RAG](https://developers.llamaindex.ai/python/framework/understanding/rag/)
- 官方文档: [LlamaIndex - Welcome to LlamaIndex](https://developers.llamaindex.ai/python/framework/)
- 官方文档: [LlamaIndex - Vector Stores（官方功能表，20+ 种）](https://developers.llamaindex.ai/python/framework/module_guides/storing/vector_stores/)
- 框架文档: [LlamaIndex 中文文档 - 框架概述](https://docs.llamaindex.ai/en/stable/)
- 技术博客: [ChatForest - LlamaIndex RAG-First Framework Review](https://chatforest.com/reviews/llamaindex-rag-agent-framework/)
- 技术博客: [AI/TLDR - What Is LlamaIndex](https://ai-tldr.dev/learn/agent-frameworks/orchestration-frameworks/what-is-llamaindex/)
- 技术博客: [Precision AI Academy - LlamaIndex 2026 Production RAG Guide](https://precisionaiacademy.com/blog/llamaindex-guide-2026)
- 技术博客: [Yobitel - LlamaIndex Knowledge Base](https://yobitel.com/knowledge-base/llamaindex)
- 教程: [Agents Lib - Building RAG with LlamaIndex](https://agents-lib.com/tutorials/building-rag-with-llamaindex)
- 教程: [Made By Agents - LlamaIndex Framework](https://www.madebyagents.com/frameworks/llamaindex)

> 来源核验 2026-11-25：全部外链逐一联网核验可访问，论文标题按 arXiv 原文校准；存疑数字保留原文标注。技术结论与官方文档不一致时以官方为准。
