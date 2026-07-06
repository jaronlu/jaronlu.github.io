# 多 Agent 协作模式

> confidence: high

Subagents、Handoffs、Skills、Router 四种常见协作模式，及其适用场景对比。

---

## 为什么需要多 Agent

Multi Agent（多智能体协作系统）专门处理复杂的任务流程。单 Agent 在以下场景会遇到瓶颈：

| 场景 | 说明 |
|------|------|
| 上下文管理 | 工具或上下文太多，拆分给不同 Agent 处理 |
| 分布式开发 | 不同团队独立开发维护各自的 Agent |
| 并行执行 | 子任务无依赖，可同时执行加快速度 |

## 常见模式

### 1. Subagents（子代理模式）

主 Agent 将多个子 Agent 作为 Tool 协调使用。

特点：
- 所有请求由主 Agent 处理
- 主 Agent 决定何时调用每个子 Agent
- 子 Agent 不直接与用户交互

### 2. Handoffs（传递模式）

随着任务执行改变 state 中的任务状态，触发路由或 Agent 配置变更。

特点：
- 每个 Agent 都可与用户交互
- 处理用户请求并返回响应
- 支持多跳执行

### 3. Skills（技能模式）

只有 1 个 Agent，根据任务按需加载 Skill 或知识。

特点：
- 单 Agent 架构
- 动态加载能力
- 支持直接用户交互

### 4. Router（路由模式）

1 个负责路由的 Agent 对用户请求分类，导向专门的 Agent。

特点：
- 请求分类后导向专门 Agent
- 最后由一个 Agent 总结结果
- 支持并行执行

## 模式对比

| 模式 | 分布式开发 | 并行执行 | 多跳执行 | 直接用户交互 |
|------|-----------|---------|---------|-------------|
| Subagents | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| Handoffs | - | - | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Skills | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Router | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | - | ⭐⭐⭐ |

## 实际应用案例

**婚礼策划智能体**（Subagents 模式）：

```
主 Agent（协调者）
├── travel agent：查找往返机票
├── venue agent：搜索婚礼场地
└── playlist agent：筛选歌单并计算预算
```

选择 Subagents 的原因：
- 工具太多，单 Agent 上下文会超限
- 三个任务无关联，可并行执行

## 设计原则

1. **优先单 Agent**：大多数情况单 Agent + 合适工具就够了
2. **按需拆分**：上下文过大、需要并行、需要分布式开发时才用多 Agent
3. **模式可混合**：实际开发中可以混合使用多种模式

## 实战案例

[SecRAG](../../projects/secrag.md) 的六节点工作流（Planner→Retriever→Reasoner→Verifier→Composer→Auditor）接近 Handoffs 模式：每个节点处理任务后把状态交给下一个节点，条件路由决定流转方向（如检索结果不足时回退到 Planner），而非固定线性链路。

## 相关笔记

- [Agent 原理](agent-principles.md)
- [MCP 协议](mcp-protocol.md)
- [Loop Engineering](loop-engineering.md)
