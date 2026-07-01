# Agent 框架对比

LangChain、LangGraph、AutoGen、CrewAI、MetaGPT、OpenAI Agents SDK 选型建议。

---

## 主流 Agent 框架

| 框架 | 定位 | 适合场景 |
|------|------|---------|
| LangChain | 高层 Agent 应用框架 | 快速搭建通用 Agent |
| LangGraph | 低层有状态编排 | 复杂工作流、人机协同 |
| AutoGen | 对话式多 Agent 框架 | 多角色协作、代码执行 |
| CrewAI | roles/crews/flows 协作 | 团队分工、任务链 |
| MetaGPT | 模拟软件公司 SOP | 角色化协作、软件工程 |
| OpenAI Agents SDK | 轻量生产级 Agent SDK | OpenAI 生态、工具调用 |

## 多 Agent 协作模式对比

| 模式 | 分布式开发 | 并行执行 | 多跳执行 | 用户交互 |
|------|-----------|---------|---------|---------|
| Subagents | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| Handoffs | - | - | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Skills | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Router | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | - | ⭐⭐⭐ |

## 详细对比

### LangChain

**优势**：

- 生态完整，集成广泛
- 学习曲线平缓
- 社区活跃，文档丰富
- 快速原型验证

**劣势**：

- 复杂流程控制有限
- 状态管理基础
- 生产级特性需配合 LangGraph

**适合**：快速搭建通用 Agent、简单工具调用、标准 RAG 应用、学习入门

### LangGraph

**优势**：

- 图结构灵活编排
- 原生支持循环/并行/分支
- 完整的检查点/恢复机制
- 原生支持人机协同

**劣势**：

- 学习曲线较陡
- 代码量较多
- 需要理解状态机概念

**适合**：复杂多步骤流程、循环迭代场景、人机协同审核、生产级 Agent 系统

### AutoGen

**优势**：

- 多角色对话成熟
- 支持代码执行
- 消息驱动协同
- 微软生态支持

**劣势**：

- 更偏研究性质
- 生产部署复杂
- 文档不够完善

**适合**：多角色协作、代码生成与调试、研究探索

### CrewAI

**优势**：

- 角色分工清晰
- 任务链表达强
- 工程落地感强
- 学习曲线适中

**劣势**：

- 灵活性不如 LangGraph
- 生态较小
- 高级特性有限

**适合**：团队分工明确、任务链清楚、需要较强流程表达

### MetaGPT

**优势**：

- 模拟软件公司 SOP
- 角色化协作
- 软件工程流程

**劣势**：

- 更偏软件工程叙事
- 通用业务不首选
- 生态较小

**适合**：理解角色化协作、软件工程流程、研究探索

### OpenAI Agents SDK

**优势**：

- 轻量生产级
- 内置 handoff/guardrails
- OpenAI 生态支持
- 生产可用

**劣势**：

- 依赖 OpenAI 生态
- 灵活性有限
- 高级特性需付费

**适合**：OpenAI 生态为主、快速做工具调用、多 Agent 交接

## 选型建议

| 需求 | 推荐框架 |
|------|----------|
| 最快写出 Python Agent | LangChain |
| 可恢复、可中断的长流程 | LangGraph |
| 多角色协作、代码执行 | AutoGen |
| 团队分工、任务链 | CrewAI |
| 角色化协作、软件工程 | MetaGPT |
| OpenAI 生态、生产级 | OpenAI Agents SDK |

## 学习路径

1. **入门**：LangChain（理解 Agent 基本概念）
2. **进阶**：LangGraph（理解状态机和复杂工作流）
3. **扩展**：AutoGen / CrewAI（理解多 Agent 协作）
4. **实践**：根据项目需求选择合适框架

## 混合使用

实际项目中可以混合使用：

```
LangChain（高层抽象）
├── 工具定义
├── 消息处理
└── 模型调用

LangGraph（底层控制）
├── 流程编排
├── 状态管理
└── 错误处理

AutoGen / CrewAI（多 Agent）
├── 角色定义
├── 任务分配
└── 协同执行
```

## 参考

- [LangChain vs LangGraph](langchain-vs-langgraph.md) — 高层框架 vs 底层编排
- [多 Agent 协作模式](../concepts/multi-agent-patterns.md) — Subagents、Handoffs、Skills、Router
- [Google agents-cli 调研](google-agents-cli.md) — Google Cloud 上的 Agent DevOps 工具
