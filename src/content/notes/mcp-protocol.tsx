import { Link } from "react-router-dom";

export function McpProtocolContent() {
  return (
    <>
      <h2>解决的问题</h2>
      <p>
        MCP（Model Context Protocol）是 Anthropic 推出的开放标准，用于便捷地将 AI 应用连接外部系统。
      </p>
      <p>没有 MCP 时：</p>
      <ul>
        <li>不同 Agent 可能有同样的 tool 需求，每次都重复定义，复用性差</li>
        <li>全世界有各种不同的服务，接口不同，定义 Tool 非常麻烦</li>
      </ul>
      <p>MCP 就像 AI 世界的 USB 接口协议：</p>
      <ul>
        <li>外部服务提供者遵循 MCP 协议提供 Tool</li>
        <li>AI 应用基于 MCP 协议对接任意遵循 MCP 的外部服务</li>
      </ul>

      <h2>核心概念</h2>
      <table>
        <thead>
          <tr>
            <th>概念</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>MCP Server</td>
            <td>提供 MCP 服务的应用（远程或本地）</td>
          </tr>
          <tr>
            <td>MCP Client</td>
            <td>连接 MCP 服务器，读取 Tool 信息供 Host 使用</td>
          </tr>
          <tr>
            <td>MCP Host</td>
            <td>协调和管理多个 MCP Client 的 AI 应用</td>
          </tr>
        </tbody>
      </table>

      <h2>架构示例</h2>
      <p>
        一个 AI 应用（MCP Host）需要三个功能：文件操作、数据库操作、Sentry 远程服务。
      </p>
      <p>可以定义 3 个 MCP Client，分别对接 3 个 MCP Server。</p>

      <h2>通信方式</h2>
      <p>MCP Client 与 MCP Server 有两种通信方式：</p>
      <table>
        <thead>
          <tr>
            <th>方式</th>
            <th>说明</th>
            <th>特点</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>stdio</td>
            <td>标准输入输出</td>
            <td>进程通信，无网络延迟</td>
          </tr>
          <tr>
            <td>SSE</td>
            <td>Server Event Stream</td>
            <td>基于 HTTP，有网络延迟</td>
          </tr>
        </tbody>
      </table>

      <h3>stdio 模式</h3>
      <ul>
        <li>外部服务：Client 下载脚本到本地，作为子进程运行</li>
        <li>本地服务：Client 直接加载本地脚本，作为子进程运行</li>
      </ul>

      <h3>SSE 模式</h3>
      <p>基于 HTTP 协议的持续数据交互模式，MCP Client 通过发送 HTTP 请求与 MCP Server 交互。</p>

      <h2>MCP 服务示例</h2>
      <ul>
        <li><strong>Amap Maps</strong>：高德地图 MCP</li>
        <li><strong>Filesystem</strong>：文件系统操作 MCP</li>
        <li><strong>Time</strong>：查询当前时间 MCP</li>
        <li><strong>Kiwi</strong>：查询/预定航班 MCP</li>
      </ul>

      <h2>与 Tool Calling 的区别</h2>
      <table>
        <thead>
          <tr>
            <th>特性</th>
            <th>Tool Calling</th>
            <th>MCP</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>定义方式</td>
            <td>代码中手动定义</td>
            <td>遵循标准协议</td>
          </tr>
          <tr>
            <td>复用性</td>
            <td>差，每个 Agent 重复定义</td>
            <td>好，一次定义多处使用</td>
          </tr>
          <tr>
            <td>生态</td>
            <td>封闭</td>
            <td>开放，可共享</td>
          </tr>
          <tr>
            <td>对接成本</td>
            <td>高</td>
            <td>低</td>
          </tr>
        </tbody>
      </table>

      <h2>在 LangChain 中使用</h2>
      <p>LangChain 原生支持 MCP，可以：</p>
      <ol>
        <li>连接外部 MCP 服务</li>
        <li>将本地工具发布为 MCP 服务</li>
        <li>动态发现和加载 MCP 工具</li>
      </ol>

      <h2>我的实践：llm-wiki-mcp 的工具契约设计</h2>
      <p>
        <Link to="/projects/llm-wiki-mcp">llm-wiki-mcp</Link> 不是把 <code>read_file</code> 包一层协议，而是把知识库维护的完整生命周期固化为 MCP 工具契约。核心设计判断：
      </p>
      <ul>
        <li><strong>工具语义优先于文件操作</strong>：<code>search_wiki</code>、<code>read_page</code>、<code>compile_page</code>、<code>run_lint</code>——Agent 调用的是知识库操作，不是文件系统调用。Agent 不需要知道 <code>raw/</code>、正式页、草稿、索引的目录结构</li>
        <li><strong>写操作必须经过候选层</strong>：<code>create_update_candidate</code> 生成候选页，不直接写正式区；<code>write_public_draft</code> 必须经过 <code>validate_public_safety</code> 检查。这对应 candidate-first 原则——Agent 产出先进入评审层，不直接覆盖正式知识</li>
        <li><strong>raw source 是 create-only</strong>：<code>create_raw_source</code> 只能追加，不能修改或删除已有原始证据。原始资料是知识库的证据层，一旦写入不可篡改，正式页可以引用但不能修改 raw</li>
        <li><strong>路径边界在工具层强制</strong>：所有操作限制在 <code>wiki_root</code> 内，Agent 无法通过路径穿越（如 <code>../../etc/passwd</code>）访问外部文件。这比给 Agent 文件系统权限再靠提示词约束安全得多</li>
      </ul>
      <p>
        通信方式选择 stdio：llm-wiki-mcp 作为本地 MCP Server 运行，通过标准输入输出与 Agent 客户端通信，无网络延迟，适合个人知识库场景。工具列表在连接建立时通过 <code>tools/list</code> 暴露给 Agent，Agent 不需要预先知道有哪些工具。
      </p>
      <p>
        最大的教训：MCP 的价值不在"连接外部系统"这个通用能力，而在你定义的工具契约本身。一个好的 MCP Server 应该让 Agent 只能做你允许的操作，并且每个操作都有明确的语义和边界——这和设计 API 是同一个工程 discipline。
      </p>

      <h2>相关笔记</h2>
      <ul>
        <li>
          <Link to="/notes/agent-principles">Agent 原理</Link>
        </li>
        <li>
          <Link to="/notes/loop-engineering">Loop Engineering</Link>
        </li>
      </ul>
    </>
  );
}
