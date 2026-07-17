# AI Agent 工程笔记

围绕 Agent Runtime、RAG、MCP 和 Loop Engineering，记录直接支撑项目设计的约束、取舍与验证方法。

每篇笔记标注 CONFIDENCE 等级：**HIGH** 表示结论已对照官方文档或项目代码核对；**MEDIUM** 表示基于实践经验、尚未完整验证。

## Agent 系统

- [Agent 原理](concepts/agent-principles.md) — 执行循环、适用边界与失败风险
- [Agent Runtime](concepts/agent-runtime.md) — State、Store、Context 的职责边界

## 知识与工具

- [RAG 原理](concepts/rag-principles.md) — 检索、生成、引用与评估链路
- [MCP 协议](concepts/mcp-protocol.md) — Host、Client、Server 与工具边界

## 工程方法

- [Loop Engineering](concepts/loop-engineering.md) — 从提示词到反馈循环系统
