# SecRAG — 券商投研知识问答 Agent

<div class="project-meta">
  <span><b>角色</b>个人独立项目</span>
  <span><b>状态</b>架构验证完成</span>
  <span><b>技术栈</b>LangGraph · ChromaDB · FastAPI</span>
  <a href="https://github.com/jaronlu/SecRAG"><b>源码</b>GitHub ↗</a>
</div>

> 非任何客户定制开发，不涉及任何客户保密信息。

## 项目一句话

SecRAG 是一个面向券商投研场景的 Agentic RAG 个人项目。它不是只做“文档问答”，而是把角色权限、混合检索、工具推理、引用验证和审计日志串成一条可复盘的问答工作流。

## 为什么做这个项目

证券行业的知识问答场景，检索本身不是最大的难点，真正棘手的是：

- 信息分散在研报、公告、法规、财报、内部制度里
- 同一问题，投顾 / 机构销售 / 合规看到的材料权限不同
- 数字错了会触发合规风险，引用错了会引发客户投诉
- 普通 RAG 系统无法区分“检索到的内容”和“模型脑补的内容”

这个项目想验证的是：能不能把知识库从“文档检索器”升级成结构上可信任的投研助手。答案不靠模型自觉，靠工作流设计把权限、验证、审计变成硬约束。

## 系统架构

整个流程拆成六个可审计的节点，用 LangGraph StateGraph 编排，不是“提问 → 检索 → 生成答案”一步到位：

<figure class="arch-figure">
<svg viewBox="0 0 820 268" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SecRAG 六节点工作流：Query 经 Planner、Retriever、Reasoner、Verifier、Composer、Auditor 到 Answer，检索不足时回退 Planner">
  <defs>
    <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L8,4 L0,8" fill="none" stroke="var(--ink)" stroke-width="1.2"/>
    </marker>
    <marker id="arr-a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L8,4 L0,8" fill="none" stroke="var(--accent)" stroke-width="1.2"/>
    </marker>
  </defs>
  <style>
    .n { fill: none; stroke: var(--line-strong); stroke-width: 1; }
    .n-a { fill: none; stroke: var(--accent); stroke-width: 1.2; }
    .t { font-family: var(--mono); font-size: 12px; fill: var(--ink); }
    .s { font-family: var(--sans); font-size: 10px; fill: var(--muted); }
    .a { font-family: var(--mono); font-size: 10px; fill: var(--accent); font-weight: 600; }
    .l { stroke: var(--ink); stroke-width: 1; fill: none; }
    .la { stroke: var(--accent); stroke-width: 1; fill: none; }
  </style>
  <text class="t" x="8" y="128">Query</text>
  <line class="l" x1="52" y1="124" x2="66" y2="124" marker-end="url(#arr)"/>
  <rect class="n" x="70" y="100" width="104" height="48"/>
  <text class="t" x="122" y="121" text-anchor="middle">Planner</text>
  <text class="s" x="122" y="138" text-anchor="middle">生成检索计划</text>
  <line class="l" x1="174" y1="124" x2="186" y2="124" marker-end="url(#arr)"/>
  <rect class="n-a" x="190" y="100" width="104" height="48"/>
  <text class="t" x="242" y="121" text-anchor="middle">Retriever</text>
  <text class="s" x="242" y="138" text-anchor="middle">按角色权限检索</text>
  <line class="la" x1="242" y1="96" x2="242" y2="76"/>
  <text class="a" x="242" y="66" text-anchor="middle">RBAC 权限前置生效</text>
  <line class="l" x1="294" y1="124" x2="306" y2="124" marker-end="url(#arr)"/>
  <rect class="n" x="310" y="100" width="104" height="48"/>
  <text class="t" x="362" y="121" text-anchor="middle">Reasoner</text>
  <text class="s" x="362" y="138" text-anchor="middle">推理 + 工具调用</text>
  <line class="l" x1="414" y1="124" x2="426" y2="124" marker-end="url(#arr)"/>
  <rect class="n-a" x="430" y="100" width="104" height="48"/>
  <text class="t" x="482" y="121" text-anchor="middle">Verifier</text>
  <text class="s" x="482" y="138" text-anchor="middle">来源 / 数字校验</text>
  <line class="la" x1="482" y1="96" x2="482" y2="76"/>
  <text class="a" x="482" y="66" text-anchor="middle">两类校验独立检查</text>
  <line class="l" x1="534" y1="124" x2="546" y2="124" marker-end="url(#arr)"/>
  <rect class="n" x="550" y="100" width="104" height="48"/>
  <text class="t" x="602" y="121" text-anchor="middle">Composer</text>
  <text class="s" x="602" y="138" text-anchor="middle">带引用的回答</text>
  <line class="l" x1="654" y1="124" x2="666" y2="124" marker-end="url(#arr)"/>
  <rect class="n" x="670" y="100" width="96" height="48"/>
  <text class="t" x="718" y="121" text-anchor="middle">Auditor</text>
  <text class="s" x="718" y="138" text-anchor="middle">审计日志</text>
  <line class="l" x1="718" y1="148" x2="718" y2="176" marker-end="url(#arr)"/>
  <text class="t" x="718" y="196" text-anchor="middle">Answer</text>
  <path class="la" d="M 242 148 L 242 224 L 122 224 L 122 152" marker-end="url(#arr-a)"/>
  <text class="a" x="182" y="216" text-anchor="middle">检索不足 → 回退重新规划</text>
</svg>
<figcaption>六个节点由 LangGraph StateGraph 编排，条件路由控制流转；红色标注的是两个结构性约束点。</figcaption>
</figure>

节点间用条件路由控制流转，而非固定线性链路。比如检索结果不足时，会回退到 Planner 重新规划检索路径。

## 能力证据矩阵

| 能力 | 项目中的落点 |
|------|--------------|
| RAG 数据管道 | 文档加载、Chunk 切分、Embedding、ChromaDB 入库 |
| Agent 编排 | LangGraph 状态图、六节点拆分、条件路由、失败分支 |
| 权限治理 | 角色权限在 Retriever 节点前置生效，影响可检索材料范围 |
| 可信输出 | 引用标注、来源校验、数字校验、审计日志 |
| 服务化封装 | FastAPI 问答接口，便于把 Agent 工作流对外暴露为服务 |

## 技术亮点

- **基于角色的检索权限过滤（RBAC）**：投顾、机构销售、合规、运营、技术 5 种角色，权限直接决定检索路径和可见结果，不是事后过滤
- **混合检索 + 语义重排**：ChromaDB 向量检索为主，BGE Reranker 对召回结果做语义重排
- **LangGraph StateGraph 编排**：节点间条件路由，而非固定 Chain
- **FastAPI 问答接口**：面向内部使用场景的服务化封装

## 可验证的代码事实

这个项目的可信度建立在代码本身，不是设计文档：

- 33 次独立 commit，功能按模块逐步落地（数据管道 → 基础RAG → Agent编排 → 检索优化 → 金融工具）
- `src/agents/` 共 816 行：`graph.py`（图构建，143行）、`nodes.py`（六节点实现，510行）、`state.py`（状态定义，52行）、`tools.py`（工具定义，101行）
- `tests/` 共 1524 行，36+ 单元测试覆盖节点逻辑、条件路由与图构建

## 技术栈

已在代码中落地：

- **Agent 编排**：LangGraph
- **LLM 接口**：LangChain
- **向量检索**：ChromaDB
- **语义重排**：BGE Reranker
- **服务接口**：FastAPI

## 设计取舍

| 方案 | 取舍 |
|------|------|
| 朴素 RAG | 实现简单，但无法表达角色权限、验证分支和审计轨迹 |
| 固定 Chain | 流程清晰，但检索不足或验证失败时缺少自然回退路径 |
| LangGraph StateGraph | 显式表达节点、状态和条件路由，更适合需要可审计分支的金融问答 |
| 生成后过滤权限 | 改动轻，但模型已经看过越权材料，不适合权限敏感场景 |
| 检索前置权限过滤 | 实现成本更高，但能从源头限制可见材料范围 |

## 项目边界说明

这是一个验证架构可行性的个人项目，不是生产系统。需要明确的是：

- 引用准确率、幻觉率、响应延迟等指标，在项目设计阶段的 PRD 里作为目标值提出，**未经生产环境实测验证**，这里不引用这些数字作为已达成的成果
- 内部知识库的数据源（研报、公告、法规）目前使用的是模拟/公开数据，未接入任何机构的真实内部数据
- 项目重点展示 Agentic RAG 架构、权限建模和验证链路，不声称已经覆盖生产级权限审计、灰度发布、在线评测和全量监控体系

## 与客户端背景的关联

10 年证券客户端工程经验没有被当成履历装饰，而是直接映射到两个系统决策：

| 业务经验 | SecRAG 中的设计 |
|---|---|
| 不同角色从一开始就拥有不同的信息边界 | RBAC 在 Retriever 前生效，模型不会先看到越权材料 |
| 数字错误与引用错误的风险性质不同 | Verifier 将数字校验与来源校验拆成独立检查逻辑 |


---

**联系**：对这个项目的设计取舍有想法，或在招相关方向 → [jr.lu.jobs@gmail.com](mailto:jr.lu.jobs@gmail.com) · [GitHub](https://github.com/jaronlu)
