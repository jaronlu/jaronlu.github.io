# LangGraph 基础

LangGraph 是 LangChain 的底层框架，用于从零构建可控的 Agent 工作流。

## 核心组件

LangGraph 有 3 个核心概念：

### 1. 节点（Node）

节点是图的执行单元，每个 Node 是一个 Python 函数：

```python
def my_node(state: State) -> dict:
    # 从 state 读取数据
    # 执行计算逻辑（调用 LLM、工具、数据库等）
    # 返回 state 的更新部分
    return {"some_key": new_value}
```

- **输入**：完整的 State 对象
- **输出**：字典，只包含要更新的字段
- **可以做什么**：调用 LLM、执行工具、读数据库、文件操作

默认节点：
- **START**：开始节点，入口
- **END**：结束节点，出口

### 2. 边（Edge）

边连接各个节点，控制工作流走向：

| 连接方式 | 说明 |
|----------|------|
| 串行 | A → B → C |
| 并行 | A → [B, C] → D |
| 条件 | A → (条件判断) → B 或 C |

### 3. 状态（State）

整个工作流中流转的数据：

```python
class SimpleState(TypedDict):
    name: str        # 用户输入
    greeting: str    # 生成的问候语
```

## 图的构建

由 Node 和 Edge 组成的工作流称为**图（Graph）**。

基本结构：

```
START → Node1 → Node2 → END
```

条件分支：

```
START → Node1 → (条件判断) → Node2 或 Node3 → END
```

## 与 LangChain 的区别

| 特性 | LangChain | LangGraph |
|------|-----------|-----------|
| 抽象层级 | 高层 API | 底层控制 |
| 适用场景 | 快速原型 | 复杂工作流 |
| 状态管理 | 内置 | 显式定义 |
| 人机协同 | 有限 | 原生支持 |

## 适用场景

- 需要精确控制执行流程
- 多步骤复杂任务
- 需要人机协同（HITL）
- 需要记忆和状态管理
- 需要错误处理和重试

## 核心优势

1. **可控性**：显式定义每个步骤
2. **可观测性**：每步状态可检查
3. **可恢复性**：支持 checkpoint
4. **可扩展性**：易于添加新节点

## 相关页面

- langgraph advanced runtime — 进阶运行时：ToolNode/tools_condition、跨轮记忆、人机协同（HITL）
- [LangChain 核心组件](langchain-core-components.md) — LangChain 核心组件
- [Agent 原理](agent-principles.md) — Agent 原理
- [LangGraph 工作流模式](../queries/langgraph-workflow-patterns.md) — LangGraph 工作流模式
