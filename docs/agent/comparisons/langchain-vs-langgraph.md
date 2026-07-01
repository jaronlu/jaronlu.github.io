# LangChain vs LangGraph 对比

高层框架 vs 底层编排，快速原型 vs 复杂工作流。

---

## 一句话区分

- **LangChain** = 高层 Agent 应用框架，快速搭建
- **LangGraph** = 低层有状态编排 runtime，精确控制

## 核心区别

| 维度 | LangChain | LangGraph |
|------|-----------|-----------|
| 抽象层级 | 高层 API | 底层控制 |
| 设计目标 | 快速原型 | 复杂工作流 |
| 状态管理 | 内置（AgentState） | 显式定义（TypedDict） |
| 流程控制 | 线性为主 | 图结构（循环/分支/并行） |
| 人机协同 | 有限 | 原生支持（interrupt） |
| 检查点 | 基础 | 完整（checkpoint/restore） |

## 适用场景

### LangChain 适合

- 快速搭建通用 Agent
- 简单工具调用
- 标准 RAG 应用
- 原型验证
- 学习入门

### LangGraph 适合

- 复杂多步骤流程
- 需要循环迭代
- 需要并行执行
- 需要人机协同审核
- 长任务中断恢复
- 生产级 Agent 系统

## 代码对比

### LangChain 创建 Agent

```python
from langchain.agents import create_agent

agent = create_agent(
    model="deepseek-chat",
    tools=[get_weather]
)

response = agent.invoke({
    "messages": [{"role": "user", "content": "天气如何?"}]
})
```

### LangGraph 创建 Agent

```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict

class State(TypedDict):
    messages: list

def call_model(state):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

graph = StateGraph(State)
graph.add_node("agent", call_model)
graph.add_edge(START, "agent")
graph.add_edge("agent", END)

app = graph.compile()
```

## 功能对比

| 功能 | LangChain | LangGraph |
|------|-----------|-----------|
| 工具调用 | ✅ 内置 | ✅ 手动编排 |
| 流式输出 | ✅ 支持 | ✅ 支持 |
| 多 Agent | ✅ Subagents | ✅ 更灵活 |
| 条件路由 | ⚠️ 有限 | ✅ 原生支持 |
| 循环迭代 | ❌ 不支持 | ✅ 原生支持 |
| 并行执行 | ⚠️ 有限 | ✅ 原生支持 |
| 人机协同 | ⚠️ 基础 | ✅ interrupt |
| 检查点恢复 | ⚠️ 基础 | ✅ 完整 |
| 状态持久化 | ⚠️ 有限 | ✅ 完整 |

## 性能对比

| 维度 | LangChain | LangGraph |
|------|-----------|-----------|
| 启动速度 | 快 | 稍慢 |
| 内存占用 | 低 | 稍高 |
| 调试难度 | 低 | 中 |
| 扩展性 | 中 | 高 |

## 学习路径建议

1. **先学 LangChain**：理解 Agent 基本概念、工具调用、消息处理
2. **再学 LangGraph**：理解状态机、图编排、复杂工作流
3. **实际项目**：简单任务用 LangChain，复杂流程用 LangGraph

## 混合使用

两者常搭配使用：

```
LangChain（高层抽象）
├── 模型调用
├── 工具定义
└── 消息处理

LangGraph（底层控制）
├── 流程编排
├── 状态管理
└── 错误处理
```

## 选型决策树

```
需要 Agent 吗？
├── 否 → 不需要
└── 是 → 任务复杂吗？
    ├── 否 → LangChain
    └── 是 → 需要循环/并行/人机协同吗？
        ├── 否 → LangChain
        └── 是 → LangGraph
```

## 参考

- [Agent 框架对比](agent-frameworks.md) — 六款主流 Agent 框架选型
- [多 Agent 协作模式](../concepts/multi-agent-patterns.md) — Subagents、Handoffs、Skills、Router
