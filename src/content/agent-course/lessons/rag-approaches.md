## 一、结论前置

1. **RAG 本质是“开卷考试”**：普通 LLM 是“闭卷考试”（只靠训练时记住的知识），RAG 是“开卷考试”（答题前先查参考资料，把相关内容塞进上下文，再基于资料回答）。核心解决**幻觉**和**知识过时**两大问题。
2. **基础 RAG 只有两步：检索→生成**。但生产级 RAG 是一个“漏斗”：分块→索引→广召回（混合检索）→精排序（Rerank）→上下文压缩→生成。每一步都有对应的优化技术。
3. **Graph RAG 解决多跳推理**：普通向量检索找不到“分散在多个文档中的关联信息”（如“A 收购了 B”分别在两个文档里），Graph RAG 构建实体关系图，通过图遍历找到多跳关联。**Hybrid RAG = 稀疏检索 + 稠密检索 + 图检索的融合**，是 2025-2026 年的生产级标准架构。

---

## 二、通俗类比 + 专业定义

### 通俗类比

**普通 LLM = 闭卷考试的学生**
- 考试时只能靠脑子里记住的知识
- 遇到没学过的（知识截止后发生的事）就瞎编（幻觉）
- 学过但记不清的也可能答错

**RAG = 开卷考试的学生**
- 考试前先把相关教材翻到对应页码（检索）
- 把重点内容抄到草稿纸上（塞进上下文）
- 看着草稿纸组织答案（生成）
- 答案有依据，不容易瞎编

**基础 RAG = 只翻一本书的目录找相关页**
**高级 RAG = 用关键词搜索+语义搜索+目录索引多管齐下，找到后还请老师帮忙划重点（重排序）**
**Graph RAG = 画了一张知识图谱，能顺着“人物关系”找到分散在不同书里的关联信息**
**Hybrid RAG = 以上所有方法一起用，最后投票选出最相关的内容**

### 专业定义

| 概念 | 定义 |
|------|------|
| **RAG（Retrieval-Augmented Generation）** | 检索增强生成：在 LLM 生成回答前，先从外部知识库检索相关文档，将检索结果作为上下文注入 prompt，使模型基于检索到的事实生成回答的技术范式。由 Meta（Lewis et al., 2020）首次提出。 |
| **基础 RAG** | 两阶段流程：①索引阶段（文档分块→向量化→存入向量库）②查询阶段（查询向量化→相似度检索→拼接 prompt→LLM 生成）。 |
| **高级 RAG** | 在基础 RAG 上增加优化环节：优化分块策略、混合检索（稀疏+稠密）、查询改写/扩展、重排序（Reranking）、上下文压缩、HyDE 假设文档嵌入等。 |
| **Graph RAG** | 基于知识图谱的 RAG：从文档中抽取实体和关系构建知识图谱，检索时通过图遍历（实体→关系→实体）找到多跳关联信息，解决普通向量检索无法处理的跨文档推理问题。代表：微软 GraphRAG（2024）、LightRAG（2024）。 |
| **Hybrid RAG** | 混合检索 RAG：同时使用多种检索方式（关键词稀疏检索 BM25 + 向量稠密检索 + 知识图谱检索），通过融合算法（如 RRF 倒数排名融合）合并结果，兼顾精确匹配和语义匹配。 |

---

## 三、底层机制

### 一、基础 RAG 流程

```
【索引阶段（离线）】
文档 → 分块（Chunking）→ 向量化（Embedding）→ 存入向量数据库

【查询阶段（在线）】
用户问题 → 向量化 → 相似度检索（Top-K）→ 拼接 Prompt → LLM 生成回答
```

**详细步骤**：

1. **文档分块（Chunking）**：将长文档切成小块（通常 256-1024 token），因为 embedding 模型有长度限制，且小块检索更精准
2. **向量化（Embedding）**：用 embedding 模型（如 text-embedding-3-small、bge-large）将每个文本块转为向量（如 1536 维）
3. **存储**：向量存入向量数据库（Chroma、Pinecone、Weaviate、Milvus、Qdrant）
4. **查询向量化**：用户问题也转为向量
5. **相似度检索**：计算查询向量与所有文档块向量的余弦相似度，返回最相似的 Top-K 个（通常 K=3-10）
6. **拼接 Prompt**：将检索到的文档块作为上下文，与用户问题一起拼成 prompt
7. **LLM 生成**：模型基于上下文生成回答

### 二、高级 RAG 优化技术

#### 1. 分块策略优化

| 策略 | 方法 | 适用场景 |
|------|------|---------|
| 固定大小分块 | 按固定 token 数切，加 overlap | 通用文档 |
| 语义分块 | 按语义边界（段落、标题）切 | 结构化文档 |
| 父子分块（Parent-Child） | 小块检索，返回大块上下文 | 需要完整上下文时 |
| 文档结构感知 | 按 Markdown 标题层级切 | Markdown/HTML 文档 |

#### 2. 混合检索（Hybrid Retrieval）

```
用户问题 ──┬──> 稀疏检索（BM25）──> 候选集 A
            ├──> 稠密检索（向量）──> 候选集 B
            └──> 图检索（Graph）───> 候选集 C
                    ↓
            融合（RRF / 加权）
                    ↓
              合并候选集
```

- **稀疏检索（BM25）**：基于关键词词频匹配，擅长精确匹配（专有名词、代码、数字）
- **稠密检索（向量）**：基于语义相似度，擅长同义表达、模糊匹配
- **RRF 融合（Reciprocal Rank Fusion）**：`score = Σ 1/(k + rank)`，将多个检索结果的排名合并，简单有效
- **为什么需要混合**：纯向量检索会漏掉“用词不同但语义相关”的，纯关键词检索会漏掉“同义表达”，两者互补

#### 3. 重排序（Reranking）

```
广召回（Top-50）→ 精排序（Cross-Encoder）→ 精选（Top-5）→ 送入 LLM
```

- **为什么需要**：向量检索用的是 Bi-Encoder（查询和文档分别编码，速度快但精度低），重排序用 Cross-Encoder（查询和文档一起编码，精度高但速度慢）
- **两阶段策略**：先用 Bi-Encoder 快速召回 Top-50（广撒网），再用 Cross-Encoder 精细排序选 Top-5（精准）
- **常见 Rerank 模型**：Cohere Rerank、bge-reranker、Jina Reranker、LLM-based Rerank（用 LLM 判断相关性）
- **效果**：通常能提升 10-30% 的检索准确率

#### 4. 查询优化

| 技术 | 方法 | 解决的问题 |
|------|------|-----------|
| 查询改写（Query Rewriting） | 用 LLM 将口语化问题改写为更适合检索的关键词 | 用户提问太模糊/太口语 |
| 查询扩展（Query Expansion） | 用 LLM 生成多个子问题，分别检索后合并 | 问题包含多个方面 |
| HyDE（Hypothetical Document Embeddings） | 先用 LLM 生成一个假设的答案文档，用这个文档的向量去检索 | 查询和答案表述差异大时 |
| 多跳查询分解 | 将复杂问题拆成多个子问题，逐步检索 | 需要多步推理的问题 |

#### 5. 上下文压缩

- **问题**：检索到的文档块可能包含大量无关内容，浪费 token、干扰模型
- **方法**：
  - **提取式压缩**：用 LLM 从每个文档块中只提取与问题相关的句子
  - **摘要式压缩**：用 LLM 对每个文档块生成摘要
  - **LLMLingua**：用小模型预测 token 重要性，删除不重要的 token（可压缩 2-10 倍）

### 三、Graph RAG 机制

#### 为什么需要 Graph RAG

普通向量检索的局限：
- 问题：“A 公司和 B 公司是什么关系？”
- 事实：文档 1 提到“A 收购了 C”，文档 2 提到“C 持有 B 的股份”
- 向量检索：分别检索到文档 1 和文档 2，但模型可能无法将两者关联起来
- Graph RAG：构建实体关系图 A→收购→C→持有→B，图遍历直接找到 A 和 B 的关系

#### Graph RAG 流程

```
【索引阶段】
文档 → LLM 抽取实体和关系 → 构建知识图谱 → 图存储 + 向量索引

【查询阶段】
用户问题 → 识别查询中的实体 → 图遍历（实体→关系→实体，多跳）
→ 收集子图上下文 → 拼接 Prompt → LLM 生成
```

#### 微软 GraphRAG（2024）

- **核心思想**：不仅构建实体关系图，还对图中的社区（Community）生成摘要
- **两种检索模式**：
  - **Local Search**：围绕查询实体的局部子图，适合具体问题
  - **Global Search**：基于社区摘要的全局检索，适合“整个数据集讲了什么”这类总结性问题
- **优势**：多跳推理能力强，适合复杂关联查询
- **劣势**：索引构建成本高（需要 LLM 抽取实体关系），更新困难

#### LightRAG（2024）

- **核心改进**：比 GraphRAG 更轻量，索引构建更快，查询延迟更低
- **混合检索**：同时使用图检索和向量检索
- **增量更新**：支持文档增量更新，不需要全量重建
- **2026 年趋势**：GraphRAG 和 LightRAG 走向统一（如 AWS 推出统一栈，支持两种模式切换）

### 四、Hybrid RAG 生产级架构

```
用户问题
    ↓
查询优化（改写/扩展/HyDE）
    ↓
┌─────────────────────────────────┐
│  三路并行检索                      │
│  ├─ BM25 稀疏检索（关键词精确匹配） │
│  ├─ 向量稠密检索（语义匹配）       │
│  └─ 知识图谱检索（多跳关联）       │
└─────────────────────────────────┘
    ↓
RRF 融合（合并三路结果）
    ↓
Rerank 重排序（Cross-Encoder / LLM）
    ↓
上下文压缩（提取相关句子/摘要）
    ↓
拼接 Prompt → LLM 生成 → 引用溯源
```

**2025-2026 年生产级 RAG 的标准配置**：
- 分块：父子分块 + 语义分块
- 检索：BM25 + 向量 + 图（三路混合）
- 排序：RRF 融合 + Cross-Encoder Rerank
- 压缩：LLM 提取式压缩
- 生成：带引用溯源（回答中标注信息来自哪个文档）

---

## 四、最小可运行代码

### 基础 RAG（LangChain）

```python
import os

# 用自己的 provider 跑通本示例（任何 OpenAI 兼容接口均可）：
#   export OPENAI_API_KEY=sk-xxx        # 你的 key
#   export OPENAI_BASE_URL=https://...  # 接口地址（用 openai 官方可省略）
#   export LLM_MODEL=doubao-pro-32k     # 对话模型名，按你的 provider 填
#   export EMBEDDING_MODEL=text-embedding-3-small  # 嵌入模型名（可选，官方默认不用设）
# ChatOpenAI / OpenAIEmbeddings 会自动读取 OPENAI_API_KEY / OPENAI_BASE_URL
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA

MODEL = os.environ["LLM_MODEL"]
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "text-embedding-3-small")

# 1. 文档分块
with open("document.txt") as f:
    text = f.read()
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
chunks = splitter.create_documents([text])

# 2. 向量化并存入 Chroma
embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)
vectorstore = Chroma.from_documents(chunks, embeddings)

# 3. 构建 RAG 链
llm = ChatOpenAI(model=MODEL, temperature=0)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5})
)

# 4. 查询
answer = qa_chain.invoke("这篇文档的核心观点是什么？")
print(answer["result"])
```

### 高级 RAG：混合检索 + 重排序

```python
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from langchain.retrievers.document_compressors import CrossEncoderReranker

# 1. 双检索器：BM25 + 向量
bm25_retriever = BM25Retriever.from_documents(chunks, k=20)
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 20})

# 2. RRF 融合
ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.5, 0.5]  # RRF 融合
)

# 3. 重排序：用 Cross-Encoder 精排
encoder = HuggingFaceCrossEncoder(model_name="BAAI/bge-reranker-large")
compressor = CrossEncoderReranker(model=encoder, top_n=5)
compressed_retriever = compressor | ensemble_retriever

# 4. 查询（自动走 混合检索→融合→重排序→压缩）
docs = compressed_retriever.invoke("用户问题")
```

### Graph RAG（LightRAG 最简示例）

```python
# LightRAG 的 openai_complete_if_cache / openai_embedding 同样自动读取
# OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_EMBEDDING_* 等 env（沿用上节，无需改代码）
from lightrag import LightRAG, QueryParam
from lightrag.llm import openai_complete_if_cache, openai_embedding

# 初始化 LightRAG（自动构建实体关系图 + 向量索引）
rag = LightRAG(
    working_dir="./lightrag_storage",
    llm_model_func=openai_complete_if_cache,
    embedding_func=openai_embedding
)

# 插入文档（自动抽取实体和关系，构建知识图谱）
with open("document.txt") as f:
    rag.insert(f.read())

# 查询（支持多种模式：naive/local/global/hybrid/mix）
# - naive: 纯向量检索
# - local: 局部图检索（围绕查询实体）
# - global: 全局图检索（社区摘要）
# - hybrid: 图+向量混合（推荐）
answer = rag.query(
    "A 公司和 B 公司是什么关系？",
    param=QueryParam(mode="hybrid")
)
print(answer)
```

---

## 五、易混对比表

| 维度 | 基础 RAG | 高级 RAG | Graph RAG | Hybrid RAG |
|------|---------|---------|-----------|-----------|
| **检索方式** | 纯向量 | 向量+优化 | 图遍历 | 稀疏+稠密+图 |
| **重排序** | 无 | 有（Cross-Encoder） | 可选 | 有（标配） |
| **多跳推理** | 弱 | 中 | 强 | 强 |
| **精确匹配** | 弱 | 中 | 中 | 强（BM25） |
| **语义匹配** | 强 | 强 | 中 | 强 |
| **索引成本** | 低 | 中 | 高（LLM 抽实体） | 高 |
| **查询延迟** | 低 | 中 | 中高 | 中高 |
| **适用场景** | 简单问答 | 生产级问答 | 多跳关联/总结 | 通用生产级 |
| **代表框架** | LangChain 基础 | LlamaIndex | 微软 GraphRAG/LightRAG | AWS 统一栈 |

| 技术 | 解决的问题 | 原理 | 成本 |
|------|-----------|------|------|
| 混合检索 | 单一检索方式的盲区 | BM25+向量+图，RRF 融合 | 低 |
| 重排序 | 检索结果排序不准 | Cross-Encoder 精细打分 | 中 |
| 查询改写 | 用户提问不适合检索 | LLM 改写为关键词 | 低 |
| HyDE | 查询和答案表述差异大 | 生成假设答案文档做检索 | 中 |
| 父子分块 | 小块缺上下文 | 小块检索，返回大块 | 低 |
| 上下文压缩 | 上下文太长/有噪音 | LLM 提取相关句子 | 中 |
| Graph RAG | 多跳关联推理 | 实体关系图遍历 | 高 |

---

## 六、3 个实战坑

### 坑 1：以为 RAG 能解决一切，结果还是幻觉

**现象**：搭了 RAG 系统后，发现模型还是会编造检索结果中没有的信息，或者基于检索到的错误信息给出错误答案。

**原因**：
- RAG 只能减少幻觉，不能消除幻觉——模型可能忽略上下文、或者基于部分信息过度推断
- 检索到的文档本身可能有错误或过时
- 检索到的文档可能不完整，模型“脑补”了缺失的部分

**避坑**：
- **加引用溯源**：要求模型回答时标注信息来自哪个文档（“根据文档 X...”），方便人工核验
- **加置信度判断**：让模型先判断“检索结果是否足够回答这个问题”，不够就说“我不知道”，不要硬答
- **检索质量优先**：优化检索（混合检索+重排序）比优化生成更重要——检索到了正确信息，模型大概率能答对；检索不到，再强的模型也会瞎编
- **关键场景加人工审核**：医疗、法律、金融等高风险场景，RAG 结果必须有人工审核

### 坑 2：分块大小随便设，导致检索不准

**现象**：分块设成 1000 token，结果一个块里包含多个不相关主题，检索时匹配到了块但相关信息只占一小块；或者分块设成 100 token，结果一个完整的观点被拆成两块，检索到一块但缺上下文。

**避坑**：
- **分块大小要匹配 embedding 模型和文档类型**：通用文档 500-1000 token，代码 200-500 token，问答对 100-300 token
- **加 overlap**：相邻块之间重叠 10-20%，避免边界信息被截断
- **用语义分块**：按段落、标题等语义边界切，不要硬切
- **用父子分块**：小块（200 token）用于检索精准匹配，返回时返回对应的父块（1000 token）提供完整上下文
- **实验验证**：用测试集评估不同分块大小的检索准确率，不要凭感觉设

### 坑 3：Graph RAG 盲目上，结果成本高收益低

**现象**：看到 Graph RAG 很火就盲目上，结果索引构建花了大量 LLM token（每个文档都要调 LLM 抽实体关系），查询速度慢，效果提升却不明显。

**避坑**：
- **先判断是否真的需要 Graph RAG**：
  - 需要多跳推理（“A 和 B 是什么关系”）→ 需要
  - 需要全局总结（“整个文档集讲了什么”）→ 需要
  - 只是简单问答（“这个产品的价格是多少”）→ 不需要，基础 RAG 就够
- **从 Hybrid RAG 开始**：先上混合检索（BM25+向量）+ 重排序，这能解决 80% 的问题。如果还有多跳推理的需求，再加 Graph RAG
- **用 LightRAG 不用 GraphRAG**：LightRAG 更轻量、更快、支持增量更新，适合大多数场景。微软 GraphRAG 适合需要全局社区摘要的特定场景
- **控制索引成本**：只对核心文档构建图谱，不要对所有文档都建；用便宜的模型（如 GPT-4o-mini）做实体抽取
- **2026 年趋势**：GraphRAG 和向量检索走向融合（如 AWS 统一栈），不需要二选一，可以在同一个系统里按查询自动切换模式

---

## 七、进阶问题（引导往下挖）

### 问题 1：RAG 和 Agent 是什么关系？Agentic RAG 又是什么？

**引导思考**：
- **RAG 是 Agent 的一个工具**：Agent 可以选择“调用 RAG 工具”来获取外部知识，就像调用其他工具一样
- **基础 RAG 是被动的**：用户问什么就检索什么，检索一次就生成答案，不会根据结果决定是否再检索
- **Agentic RAG 是主动的**：Agent 控制检索循环——先检索，看结果够不够，不够就换个关键词再检索，或者调用其他工具补充信息，直到信息足够才生成答案
- **类比**：基础 RAG 是“查一次百科就写答案”，Agentic RAG 是“研究员做文献综述”——先查一批，发现缺什么再查一批，交叉验证，最后才写综述
- **2025-2026 趋势**：RAG 正在从“固定管道”（检索→排序→生成）走向“自主循环”（Agent 决定检索什么、检索几次、什么时候停），这就是 Agentic RAG
- 延伸：后续知识点（Function Calling、ReAct、Planning）会深入讲解 Agent 如何控制工具调用循环

### 问题 2：向量数据库会被知识图谱取代吗？RAG 的未来架构是什么？

**引导思考**：
- **不会取代，而是融合**：向量检索擅长语义匹配（“意思相近”），图检索擅长关联推理（“A 和 B 有关系”），两者解决不同问题，互补而非替代
- **2026 年的趋势是“多模态索引融合”**：
  - 向量索引（语义匹配）
  - 倒排索引（BM25 关键词匹配）
  - 知识图谱（实体关系推理）
  - 全文索引（精确短语匹配）
  - 甚至时序索引（时间敏感信息）
- **查询路由（Query Routing）**：不是所有查询都走所有索引，而是用模型判断这个查询需要哪种检索（如“价格是多少”走精确匹配，“两者关系”走图检索），降低延迟
- **动态索引**：文档更新时增量更新索引，不需要全量重建（LightRAG 已支持）
- **个人化检索**：根据用户画像和历史行为，个性化排序检索结果（如 HippoRAG2 的个性化 PageRank）
- **终极形态**：RAG 不再是一个“检索管道”，而是 Agent 的“外部记忆系统”——Agent 可以自主决定记什么、怎么索引、什么时候检索、检索后怎么用，就像人类的长期记忆一样
- 延伸：后续知识点（Memory）会深入讲解 Agent 的记忆系统如何与 RAG 结合

---

## 八、四关自测

### 复述关（3句话讲清）
1. RAG 本质是“开卷考试”：答题前先从外部知识库检索相关资料塞进上下文，让模型基于资料回答，专治幻觉和知识过时。
2. 基础 RAG 只有“分块→向量→检索→生成”两步；生产级是个漏斗——父子分块、BM25+向量混合检索、RRF 融合、Cross-Encoder 重排序、上下文压缩，最后才生成。
3. Graph RAG 补的是“多跳关联”短板（A收购C、C持股B，向量检索拼不起来），Hybrid RAG 把稀疏+稠密+图三路检索融合，是 2025-2026 生产级标准。

### 举例关（真实场景）
做一个企业内部制度问答机器人：员工问“报销差旅住宿，一线城市每晚标准是多少”。纯向量检索可能召回一份“出差申请流程”文档但没写金额；上了混合检索后，BM25 精确命中“住宿标准 500元/晚”这句话，向量检索召回“差旅制度总则”，RRF 融合后 Cross-Encoder 重排，最后模型答“一线城市500元/晚，依据《差旅制度》第3.2条”并附上引用。

### 反例关（边界条件）
看到 Graph RAG 火就全量文档建图，结果每个文档都调 LLM 抽实体关系，索引成本翻几倍、查询延迟慢一倍，而用户问的全是“年假几天”“报销比例”这类单点事实——基础 RAG 就够。Graph RAG 只在多跳关联和全局总结时才值回票价，简单问答盲目上图谱是过度工程。

### 教学关（给小白讲）
普通 AI 像闭卷考试，只靠脑子记的知识，没学过就瞎编。RAG 像开卷考试：答题前先翻参考书，把相关页折个角抄在草稿纸上，再照着草稿写答案。高级 RAG 是既用目录翻、又用关键词搜、还请老师帮着划重点；Graph RAG 是画了张人物关系图，能顺着关系找到散在不同书里的线索。它们一起用，答案又准又有出处。

---

## 资料来源

- 论文: [Lewis et al. (2020) - Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks, arXiv:2005.11401](https://arxiv.org/abs/2005.11401)
- 官方文档: [微软 GraphRAG 官方文档](https://microsoft.github.io/graphrag/)
- 框架文档: [HKUDS·LightRAG](https://github.com/HKUDS/LightRAG)
- 官方博客: [AWS - Unified Knowledge Graph RAG on AWS](https://aws.amazon.com/blogs/opensource/unified-knowledge-graph-rag-on-aws-graphrag-and-lightrag-on-one-stack/)
- 技术博客: [51CTO - Advanced RAG 实战：12 种策略从原理到代码](https://www.51cto.com/article/847486.html)
- 技术博客: [51CTO - 九种高级 RAG 技术及其实现方法](https://www.51cto.com/article/828039.html)
- 技术博客: [CSDN - 2025年如何拯救你的 RAG 系统](https://blog.csdn.net/u013970991/article/details/152727933)
- 官方博客: [AWS - OpenSearch 助力高效 RAG 系统落地](https://aws.amazon.com/cn/blogs/china/opensearch-rag-system-implementation/)
- 技术博客: [Rag About It - 7 Graph RAG Patterns That Fix Multi-hop Failures](https://ragaboutit.com/7-graph-rag-patterns-that-fix-multi-hop-failures-today/)
- 行业报告: [Zylos AI - Agentic RAG for Long-Horizon Tasks](https://zylos.ai/research/2026-05-15-agentic-rag-long-horizon-agent-retrieval/)
- 论文: [RouteRAG (arXiv 2025)](https://arxiv.org/html/2512.09487)
- 教学课件: [同济大学 - Agentic RAG 时代：知识检索增强](https://tongji-kgllm.github.io/assets/talks/%E8%9E%8D%E5%90%88%E6%8E%A8%E7%90%86%E7%9A%84%E7%9F%A5%E8%AF%86%E6%A3%80%E7%B4%A2%E5%A2%9E%E5%BC%BA.pdf)

> 来源核验 2026-11-25：全部外链逐一联网核验可访问，论文标题按 arXiv 原文校准；存疑数字保留原文标注。技术结论与官方文档不一致时以官方为准。
