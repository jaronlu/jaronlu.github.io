# Agent Runtime

<span class="note-confidence" title="内容置信度：来源已核对的程度">CONFIDENCE — HIGH</span>

State（短期记忆）、Store（长期记忆）、Context（运行时上下文）三者的职责边界与关系。

---

## 核心概念

LangChain 的 Runtime 机制是理解 Agent 内部运行状态的关键。

| 概念 | 说明 | 生命周期 |
|------|------|----------|
| State | 短期记忆，存储当前对话信息、任务状态 | 单次请求 |
| Store | 长期记忆，包含用户偏好、失败经验等 | 跨会话 |
| Context | 运行时上下文，传递配置参数 | 单次请求 |

## State（短期记忆）

State 是 Agent 的短期记忆，存储当前会话的历史消息、任务状态等信息。

### 自定义 State

继承 AgentState，添加自定义属性：

```python
from langchain.agents import AgentState
from typing import NotRequired

class CustomState(AgentState):
    """Agent 的任务状态"""
    model_call_count: NotRequired[int]  # 模型调用次数
    session_start: NotRequired[str]     # 会话开始时间
```

AgentState 已有 messages 属性（历史消息列表），自定义后可记录更多信息。

### 操作 State

在 Tool 或 Middleware 中操作 State：

```python
@tool
def my_tool(runtime: ToolRuntime):
    # 读取 state
    count = runtime.state.get("model_call_count", 0)

    # 修改 state（返回 Command 指令）
    return Command(update={
        "model_call_count": count + 1,
        "messages": [ToolMessage("Success!", tool_call_id=runtime.tool_call_id)]
    })
```

注意：runtime 是 LangChain 中 tool 的限定参数，自定义参数不能叫这个名字。

## Store（长期记忆）

Store 是 Agent 的长期记忆，跨会话持久化存储。

用途：
- 用户偏好
- 失败经验
- 学习到的知识
- 历史交互记录

## Context（运行时上下文）

Context 传递配置参数，单次请求生命周期。

用途：
- 模型配置
- 工具配置
- 环境参数
- 调试标志

## 三者关系

```
用户请求
    ↓
┌─────────────────────────────────┐
│ Context（配置参数）              │
│    ↓                            │
│ State（当前会话状态）            │
│    ↓                            │
│ Store（长期记忆）                │
└─────────────────────────────────┘
    ↓
Agent 处理
    ↓
返回结果 + 更新 State/Store
```

## 适用场景

| 概念 | 适用场景 |
|------|----------|
| State | 当前对话上下文、任务进度、临时数据 |
| Store | 用户画像、历史偏好、学习记录 |
| Context | 模型选择、工具配置、环境变量 |

## 实战案例

[SecRAG](../../projects/secrag.md) 的 `state.py` 定义了贯穿六节点的 `AssistantState`：用户上下文、查询理解、检索计划/结果、推理过程、验证结果、合规信息、最终答案、审计轨迹全部作为 State 字段在节点间传递，是 State 机制在真实业务场景下的落地。

## 相关笔记

- [Agent 原理](agent-principles.md)
- [Loop Engineering](loop-engineering.md)
