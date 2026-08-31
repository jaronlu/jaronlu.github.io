import { Link } from "react-router-dom";
import { CodeBlock } from "../../components/CodeBlock";

export function RagPrinciplesContent() {
  return (
    <>
      <h2>什么是 RAG</h2>
      <p>
        RAG（检索增强生成）解决的核心问题：
        <strong>模型本身不知道你的私有知识、最新知识和长文档细节，但业务又要求它基于这些知识回答。</strong>
      </p>
      <p>解决的问题：</p>
      <ul>
        <li>模型不知道企业内部/个人私有资料</li>
        <li>模型知识可能过时</li>
        <li>长文档无法直接完整塞进上下文</li>
        <li>纯靠模型参数回答，幻觉风险过高</li>
      </ul>

      <h2>核心链路</h2>
      <p>RAG = 先找资料，再组织回答</p>
      <p>
        <strong>离线准备链路</strong>
      </p>
      <CodeBlock
        code={`文档采集 → 文档清洗 → Chunk 切片 → Embedding 向量化 → 建立向量索引`}
      />
      <p>
        <strong>在线问答链路</strong>
      </p>
      <CodeBlock
        code={`用户提问 → Query 向量化 → Retriever 召回 → Rerank 重排 → Context Packing → LLM 生成`}
      />

      <h2>核心组件</h2>
      <table>
        <thead>
          <tr>
            <th>组件</th>
            <th>作用</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Document Source</td>
            <td>知识来源</td>
          </tr>
          <tr>
            <td>Chunk</td>
            <td>文档切片</td>
          </tr>
          <tr>
            <td>Embedding</td>
            <td>向量化表示</td>
          </tr>
          <tr>
            <td>Vector Store</td>
            <td>向量存储</td>
          </tr>
          <tr>
            <td>Retriever</td>
            <td>检索器</td>
          </tr>
          <tr>
            <td>Prompt Augmentation</td>
            <td>上下文拼装</td>
          </tr>
          <tr>
            <td>Generation</td>
            <td>LLM 生成</td>
          </tr>
        </tbody>
      </table>

      <h2>关键优化点</h2>
      <ul>
        <li>文档清洗质量</li>
        <li>Chunk 粒度设计</li>
        <li>检索策略（向量 / BM25 / Hybrid）</li>
        <li>Rerank 重排</li>
        <li>上下文长度控制</li>
        <li>回答护栏</li>
      </ul>

      <h2>常见误区</h2>
      <table>
        <thead>
          <tr>
            <th>误区</th>
            <th>真相</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>接了 RAG 就没有幻觉</td>
            <td>只能降低风险，不能消灭</td>
          </tr>
          <tr>
            <td>模型越强 RAG 越简单</td>
            <td>检索质量同样重要</td>
          </tr>
          <tr>
            <td>RAG = 向量库 + 大模型</td>
            <td>真正难点在整条链路</td>
          </tr>
          <tr>
            <td>召回越多越好</td>
            <td>召回质量比数量重要</td>
          </tr>
        </tbody>
      </table>

      <h2>RAG vs 其他方案</h2>
      <table>
        <thead>
          <tr>
            <th>方案</th>
            <th>适用场景</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>RAG</td>
            <td>私有知识问答，知识更新频繁</td>
          </tr>
          <tr>
            <td>Fine-tuning</td>
            <td>特定领域风格，知识相对稳定</td>
          </tr>
          <tr>
            <td>Search</td>
            <td>传统关键词匹配</td>
          </tr>
          <tr>
            <td>Agent</td>
            <td>需要动态决策和工具调用</td>
          </tr>
        </tbody>
      </table>

      <h2>最小实践路径</h2>
      <ol>
        <li>准备 3~5 篇小文档</li>
        <li>完成切片 + embedding + 检索</li>
        <li>把检索结果拼进 Prompt，让模型基于证据回答</li>
      </ol>
      <p>如果最小闭环没跑通，不要过度讨论高级检索策略、Rerank 或 Graph RAG。</p>

      <h2>工程关注点</h2>
      <ul>
        <li>召回率</li>
        <li>精确率</li>
        <li>延迟</li>
        <li>Token 成本</li>
        <li>文档更新机制</li>
        <li>可评估性</li>
      </ul>

      <h2>我的实践：SecRAG 的工程落地</h2>
      <p>
        <Link to="/projects/secrag">SecRAG</Link> 把 RAG 原理落地到证券投研场景，关键工程决策对应原理中的优化点：
      </p>
      <table>
        <thead>
          <tr>
            <th>原理中的优化点</th>
            <th>SecRAG 的落地</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>检索策略（向量 / BM25 / Hybrid）</td>
            <td>ChromaDB 角色感知多源向量检索；Reranker 作为 Agent 工具按需调用，不是标准检索固定步骤</td>
          </tr>
          <tr>
            <td>权限与可见性</td>
            <td>RBAC 在 Retriever 节点前置生效，5 种角色（投顾 / 机构销售 / 合规 / 运营 / 技术）决定可检索材料范围</td>
          </tr>
          <tr>
            <td>回答护栏</td>
            <td>Verifier 节点独立校验来源和数字，不通过则回退 Reasoner 重新推理</td>
          </tr>
          <tr>
            <td>可审计性</td>
            <td>Auditor 节点记录完整问答轨迹，包括检索结果、推理过程、验证结果、最终答案</td>
          </tr>
          <tr>
            <td>Chunk 粒度设计</td>
            <td>按文档结构切分，保留章节层级和元信息，避免跨章节语义断裂</td>
          </tr>
          <tr>
            <td>上下文长度控制</td>
            <td>Retriever 召回后经过 Rerank 筛选，只把 top-k 相关片段拼进 Prompt，避免上下文膨胀</td>
          </tr>
        </tbody>
      </table>
      <p>
        最大的教训：普通 RAG 的"检索 → 生成"一步到位在金融场景不够用。SecRAG 拆成六节点的核心原因是——每一步都需要可审计、可回退、可验证，而不是把所有逻辑塞给模型。权限过滤必须在检索前做（不能让模型先看到越权材料），验证必须独立于推理（不能让模型自己验证自己），审计必须结构化记录（不能靠解析对话历史）。
      </p>

      <h2>相关笔记</h2>
      <ul>
        <li>
          <Link to="/notes/agent-principles">Agent 原理</Link>
        </li>
      </ul>
    </>
  );
}
