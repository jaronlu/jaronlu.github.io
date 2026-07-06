# MCP 协议

> confidence: high

Model Context Protocol — AI 世界的 USB 接口协议。

---

## 解决的问题

MCP（Model Context Protocol）是 Anthropic 推出的开放标准，用于便捷地将 AI 应用连接外部系统。

没有 MCP 时：
- 不同 Agent 可能有同样的 tool 需求，每次都重复定义，复用性差
- 全世界有各种不同的服务，接口不同，定义 Tool 非常麻烦

MCP 就像 AI 世界的 USB 接口协议：
- 外部服务提供者遵循 MCP 协议提供 Tool
- AI 应用基于 MCP 协议对接任意遵循 MCP 的外部服务

## 核心概念

| 概念 | 说明 |
|------|------|
| MCP Server | 提供 MCP 服务的应用（远程或本地） |
| MCP Client | 连接 MCP 服务器，读取 Tool 信息供 Host 使用 |
| MCP Host | 协调和管理多个 MCP Client 的 AI 应用 |

## 架构示例

一个 AI 应用（MCP Host）需要三个功能：
- 文件操作
- 数据库操作
- Sentry 远程服务

可以定义 3 个 MCP Client，分别对接 3 个 MCP Server。

## 通信方式

MCP Client 与 MCP Server 有两种通信方式：

| 方式 | 说明 | 特点 |
|------|------|------|
| stdio | 标准输入输出 | 进程通信，无网络延迟 |
| SSE | Server Event Stream | 基于 HTTP，有网络延迟 |

### stdio 模式

- 外部服务：Client 下载脚本到本地，作为子进程运行
- 本地服务：Client 直接加载本地脚本，作为子进程运行

### SSE 模式

基于 HTTP 协议的持续数据交互模式，MCP Client 通过发送 HTTP 请求与 MCP Server 交互。

## MCP 服务示例

- **Amap Maps**：高德地图 MCP
- **Filesystem**：文件系统操作 MCP
- **Time**：查询当前时间 MCP
- **Kiwi**：查询/预定航班 MCP

## 与 Tool Calling 的区别

| 特性 | Tool Calling | MCP |
|------|--------------|-----|
| 定义方式 | 代码中手动定义 | 遵循标准协议 |
| 复用性 | 差，每个 Agent 重复定义 | 好，一次定义多处使用 |
| 生态 | 封闭 | 开放，可共享 |
| 对接成本 | 高 | 低 |

## 在 LangChain 中使用

LangChain 原生支持 MCP，可以：
1. 连接外部 MCP 服务
2. 将本地工具发布为 MCP 服务
3. 动态发现和加载 MCP 工具

## 相关笔记

- [Agent 原理](agent-principles.md)
- [多 Agent 协作模式](multi-agent-patterns.md)
- [Loop Engineering](loop-engineering.md)
