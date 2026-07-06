# LangGraph 工作流模式

> confidence: high

LangGraph 的核心能力是用图的方式灵活编排任意复杂的工作流。

---

## 七种核心编排模式

### 1. 顺序执行（Prompt Chaining）

前一个 LLM 的输出作为后一个 LLM 的输入，像流水线串联。

**典型场景**：写作流程（大纲→初稿→润色）、翻译+校对、分步推理

**特点**：步骤之间可加入验证门控（Gate），质量不达标可退回重做

```
START → LLM1 → Gate → LLM2 → LLM3 → END
```

### 2. 并行执行（Parallelization）

多个任务同时执行，最后汇总结果。

**典型场景**：多维度分析、并行搜索、批量处理

```
START → [LLM1, LLM2, LLM3] → Aggregator → END
```

### 3. 条件路由（Routing）

根据条件判断走不同分支。

**典型场景**：意图识别、请求分类、A/B 测试

```
START → Classifier → (条件) → RouteA / RouteB → END
```

### 4. 循环迭代（Iteration）

重复执行直到满足条件。

**典型场景**：优化迭代、重试机制、自我反思

```
START → LLM → Checker → (不满足) → LLM
                    ↓ (满足)
                  END
```

### 5. 人机协同（Human-in-the-Loop）

关键节点暂停等待人工审核。

**典型场景**：内容审核、决策确认、高风险操作

```
START → LLM → [暂停] → Human Review → (通过) → END
                              ↓ (拒绝)
                           LLM (重做)
```

### 6. 子图调用（Subgraph）

将复杂逻辑封装为子图，主图调用。

**典型场景**：模块化设计、复用逻辑、分布式开发

```
START → SubgraphA → SubgraphB → END
```

### 7. Map-Reduce

将任务拆分给多个 Agent 并行处理，最后汇总。

**典型场景**：批量处理、分布式计算、多角度分析

```
START → Splitter → [Agent1, Agent2, Agent3] → Reducer → END
```

## 模式选择指南

| 场景 | 推荐模式 |
|------|----------|
| 流程固定、步骤明确 | 顺序执行 |
| 多任务无依赖 | 并行执行 |
| 根据输入类型分流 | 条件路由 |
| 需要迭代优化 | 循环迭代 |
| 关键决策需人工确认 | 人机协同 |
| 逻辑复杂需模块化 | 子图调用 |
| 批量任务需分布式 | Map-Reduce |

## 混合使用

实际开发中，这些模式可以任意混合：

```
START → Classifier → (A) → Parallel[Sub1, Sub2] → Reducer
                    → (B) → Iteration[LLM → Checker]
                    → (C) → Human Review → END
```

## 代码示例：条件路由

```python
from typing import Literal
from langgraph.graph import StateGraph, START, END

def classifier(state) -> Literal["route_a", "route_b"]:
    if "技术" in state["query"]:
        return "route_a"
    return "route_b"

def route_a(state):
    # 技术问题处理
    return {"answer": "技术回答"}

def route_b(state):
    # 其他问题处理
    return {"answer": "通用回答"}

graph = StateGraph(State)
graph.add_node("route_a", route_a)
graph.add_node("route_b", route_b)
graph.add_conditional_edges(START, classifier)
graph.add_edge("route_a", END)
graph.add_edge("route_b", END)
```

## 最佳实践

1. **从简单开始**：先用顺序执行跑通核心流程
2. **按需复杂化**：遇到瓶颈再引入并行、路由等模式
3. **保持可观测**：每步状态可检查，方便调试
4. **错误处理**：每层都要有超时、重试、降级策略

## 实战案例

[SecRAG](../../projects/secrag.md) 的六节点工作流混合了两种模式：Planner→Retriever→Reasoner→Verifier→Composer→Auditor 主体是顺序执行，但 Verifier 判断检索结果不足时会走条件路由回退到 Planner 重新规划——不是纯线性 Chain，而是带反馈的条件分支。

## 相关笔记

- [Agent 原理](../concepts/agent-principles.md)
- [LangChain Agent 入门实战](langchain-agent-hello-world.md)
