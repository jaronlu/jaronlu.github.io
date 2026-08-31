import { Link } from "react-router-dom";

export function LlmWikiMcpContent() {
  return (
    <>
      <h2>项目一句话</h2>
      <p>
        <code>llm-wiki-mcp</code> 不是一个普通文件系统 MCP，也不是把{" "}
        <code>read_file(path)</code> 包一层协议。它的目标是给个人 Markdown 知识库提供一层面向 Agent 的知识操作接口，让不同 Agent 能用同一套工具完成搜索、读取、raw source 收集、候选页生成、lint 和健康检查。
      </p>

      <h2>为什么做这个项目</h2>
      <p>
        只把 <code>~/llm-wiki/</code> 路径交给 Agent，能解决“能不能读文件”，但解决不了“能不能按知识库规则稳定维护”的问题：
      </p>
      <ul>
        <li>每个 Agent 都要重新理解 <code>raw/</code>、正式页、草稿、索引和日志的边界。</li>
        <li>普通文件工具缺少 frontmatter、sources、confidence、wikilinks 等知识库语义。</li>
        <li>直接写文件容易绕过 candidate-first、raw create-only、路径越界和公开发布安全检查。</li>
        <li>Hermes、Claude Code、Cursor 或自研 Agent 之间难以复用同一套知识维护契约。</li>
      </ul>
      <p>这个项目的核心判断是：</p>
      <blockquote>
        路径解决“能不能读”；MCP 解决“能不能稳定、安全、按规则地读写和维护”。
      </blockquote>

      <h2>系统定位</h2>
      <p>
        <code>llm-wiki-mcp</code> 的定位是 <strong>Knowledge Operation Layer</strong>，不是 FileSystem Layer。
      </p>
      <figure className="arch-figure">
        <svg
          viewBox="0 0 820 320"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="llm-wiki-mcp 五层架构：Agent 层经 MCP 到 Tool、Workflow、Service、Storage 层"
        >
          <defs>
            <marker id="warr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            </marker>
          </defs>
          <style>{`
            .wn { fill: none; stroke: var(--line-strong); stroke-width: 1; }
            .wt { font-family: var(--mono); font-size: 11px; fill: var(--ink); font-weight: 600; letter-spacing: 0.08em; }
            .ws { font-family: var(--sans); font-size: 11px; fill: var(--muted); }
            .wa { font-family: var(--mono); font-size: 10px; fill: var(--accent); font-weight: 600; }
            .wl { stroke: var(--ink); stroke-width: 1; fill: none; }
          `}</style>
          <rect className="wn" x="60" y="12" width="700" height="42" />
          <text className="wt" x="76" y="38">AGENT</text>
          <text className="ws" x="180" y="38">Claude Code · Hermes · Cursor · LangGraph · 自研 Agent</text>
          <line className="wl" x1="410" y1="54" x2="410" y2="72" markerEnd="url(#warr)" />
          <text className="wa" x="424" y="68">MCP — 同一套工具契约</text>
          <rect className="wn" x="60" y="76" width="700" height="42" />
          <text className="wt" x="76" y="102">TOOL</text>
          <text className="ws" x="180" y="102">search_wiki · read_page · read_raw_source · run_lint · knowledge_health_review</text>
          <line className="wl" x1="410" y1="118" x2="410" y2="136" markerEnd="url(#warr)" />
          <rect className="wn" x="60" y="140" width="700" height="42" />
          <text className="wt" x="76" y="166">WORKFLOW</text>
          <text className="ws" x="180" y="166">Capture → Search → Compile → Review → Apply → Publish → Health Review</text>
          <line className="wl" x1="410" y1="182" x2="410" y2="200" markerEnd="url(#warr)" />
          <rect className="wn" x="60" y="204" width="700" height="42" />
          <text className="wt" x="76" y="230">SERVICE</text>
          <text className="ws" x="180" y="230">Search Engine · Candidate Builder · Frontmatter Validator · Log Manager</text>
          <line className="wl" x1="410" y1="246" x2="410" y2="264" markerEnd="url(#warr)" />
          <rect className="wn" x="60" y="268" width="700" height="42" />
          <text className="wt" x="76" y="294">STORAGE</text>
          <text className="ws" x="180" y="294">正式页（candidate-first）· Raw Sources（create-only）· Index · Log · Config</text>
        </svg>
        <figcaption>Agent 不直接接触文件系统：所有读写经过工具契约和 workflow 层，安全边界（candidate-first、create-only、路径限制）落在结构上。</figcaption>
      </figure>

      <h2>能力证据矩阵</h2>
      <table>
        <thead>
          <tr>
            <th>能力</th>
            <th>项目中的落点</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>MCP 工具设计</td>
            <td><code>init_wiki</code>、<code>inspect_wiki</code>、<code>search_wiki</code>、<code>read_page</code>、<code>read_raw_source</code>、<code>run_lint</code> 等工具契约</td>
          </tr>
          <tr>
            <td>知识生命周期建模</td>
            <td>Capture → Triage → Distill → Merge → Link → Validate → Retrieve → Review</td>
          </tr>
          <tr>
            <td>安全边界</td>
            <td>路径必须限制在 <code>wiki_root</code> 内，raw source 默认 create-only，正式页 candidate-first</td>
          </tr>
          <tr>
            <td>候选评审机制</td>
            <td>正式页、index、log、source manifest 通过 Candidate / Review Bundle 统一评审</td>
          </tr>
          <tr>
            <td>多 Agent 复用</td>
            <td>Hermes、Claude Code、Cursor、LangGraph、自研 Agent 通过同一 MCP server 操作 Wiki</td>
          </tr>
          <tr>
            <td>质量治理</td>
            <td><code>run_lint</code> 和 <code>knowledge_health_review</code> 返回结构化检查结果</td>
          </tr>
        </tbody>
      </table>

      <h2>工具能力模型</h2>
      <p>第一阶段重点不是做“大而全”的文件管理器，而是把知识库维护中高频、边界清晰的能力固化为工具。</p>
      <table>
        <thead>
          <tr>
            <th>类别</th>
            <th>工具</th>
            <th>作用</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bootstrap</td>
            <td><code>init_wiki</code> / <code>inspect_wiki</code></td>
            <td>初始化或识别最小 LLM Wiki 结构</td>
          </tr>
          <tr>
            <td>Search</td>
            <td><code>search_wiki</code></td>
            <td>搜索正式页或 raw source，并返回 metadata</td>
          </tr>
          <tr>
            <td>Read</td>
            <td><code>read_page</code> / <code>read_raw_source</code></td>
            <td>区分正式知识页和原始证据层</td>
          </tr>
          <tr>
            <td>Capture</td>
            <td><code>create_raw_source</code> / <code>append_log</code></td>
            <td>收集原始资料和结构化记录</td>
          </tr>
          <tr>
            <td>Compile</td>
            <td><code>compile_page</code> / <code>create_update_candidate</code></td>
            <td>生成正式页或更新候选，不直接写正式区</td>
          </tr>
          <tr>
            <td>Governance</td>
            <td><code>run_lint</code> / <code>knowledge_health_review</code></td>
            <td>检查链接、来源、重复主题和低置信页面</td>
          </tr>
          <tr>
            <td>Publish</td>
            <td><code>write_public_draft</code> / <code>validate_public_safety</code></td>
            <td>生成公开站点草稿并做安全检查</td>
          </tr>
        </tbody>
      </table>

      <h2>设计取舍</h2>
      <table>
        <thead>
          <tr>
            <th>方案</th>
            <th>取舍</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>直接给 Agent 文件系统权限</td>
            <td>简单，但每个 Agent 都要重新理解 Wiki 规则，误写风险高</td>
          </tr>
          <tr>
            <td>只做 <code>read_file</code> / <code>write_file</code> 包装</td>
            <td>实现轻，但没有 frontmatter、sources、candidate 和 lint 语义</td>
          </tr>
          <tr>
            <td>做完整文件管理器</td>
            <td>能力多，但会扩大权限边界，偏离知识库维护目标</td>
          </tr>
          <tr>
            <td>做知识操作层 MCP</td>
            <td>工具数量更克制，但能把 Wiki 生命周期、安全边界和跨 Agent 复用固化下来</td>
          </tr>
        </tbody>
      </table>

      <h2>项目边界说明</h2>
      <p>当前公开表达按设计与实战验证材料处理，不夸大为完整产品化系统：</p>
      <ul>
        <li>项目重点是 MCP 工具契约、知识生命周期、安全边界和 workflow 编排设计。</li>
        <li>不把 MCP 设计成 Git 管理器、网页发布器、Prompt 管理器或完整文件管理器。</li>
        <li>Semantic Search 可以作为内部检索模式演进，但不要求默认依赖向量数据库。</li>
        <li>正式页、index、schema 和已有 raw 的修改应保持 candidate-first，不让 MCP 自动越权写入。</li>
      </ul>

      <h2>与这个站点的关系</h2>
      <p>
        这个站点的内容来自个人 <code>llm-wiki</code> 的筛选、脱敏和公开改写。
        <code>llm-wiki-mcp</code> 正好服务于这个流程：它把“从知识库中找资料、读正式页、核对 raw source、生成公开草稿、检查敏感信息”变成可复用的工具链，而不是每次靠临时提示词和文件路径手工操作。
      </p>

      <h2>相关页面</h2>
      <ul>
        <li>
          <Link to="/notes/mcp-protocol">MCP 协议</Link>
        </li>
        <li>
          <Link to="/notes/loop-engineering">Loop Engineering</Link>
        </li>
      </ul>
    </>
  );
}
