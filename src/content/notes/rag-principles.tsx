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

      <h2>实战案例</h2>
      <p>
        <Link to="/projects/secrag">SecRAG</Link> 是把这些原理落地到证券行业投研场景的实践：混合检索（ChromaDB 向量 + BGE Reranker 语义重排）解决召回质量问题，角色权限过滤解决“同一问题不同角色看到不同结果”的问题，验证节点解决数字/引用准确性问题。
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
