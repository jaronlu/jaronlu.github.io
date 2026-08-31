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
