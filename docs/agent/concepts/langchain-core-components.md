# LangChain 核心组件

LangChain 是智能体开发平台，核心目标是构建 Agent。

## 平台组成

LangChain 不只是框架，而是完整平台：

- **LangChain**：快速构建智能体，兼容任何模型提供商
- **LangGraph**：底层控制智能体构建，包括记忆、人机协同
- **Deep Agents**：处理多步骤复杂任务的智能体
- **LangSmith**：测试、观察、评估、部署智能体

## Agent 定义

LangChain 创始人 Harrison Chase 的定义：

> Agent 是一种使用大语言模型（LLM）来决定应用程序控制流的系统。

核心区别：

| 特性 | 传统 LLM | AI Agent |
|------|----------|----------|
| 交互模式 | 被动响应 | 主动规划 |
| 执行力 | 文本生成 | 操作工具 |
| 自主性 | 需详细步骤 | 只需目标 |

类比：LLM = 大脑，Agent = 大脑 + 手脚

## Agent 演进阶段

1. **ReAct + Tool Calling**：基础工具调用
2. **Reflection + Long Memory**：反思与长期记忆
3. **Multi Agent System (MAS)**：多智能体协作

## 核心组件

LangChain Agent 开发的核心组件：

### 1. Models（模型）

支持多种 LLM 提供商：

```python
# 安装依赖
uv add langchain-deepseek  # DeepSeek
uv add langchain-openai    # OpenAI
uv add langchain-anthropic  # Anthropic
```

### 2. Tools（工具）

用 `@tool` 装饰器定义：

```python
@tool
def get_weather(location: str) -> str:
    """获取指定位置天气"""
    return f"{location}天气晴朗"
```

### 3. Agent（智能体）

用 `create_agent` 快速创建：

```python
agent = create_agent(
    model="deepseek-chat",
    tools=[get_weather]
)
```

### 4. Messages（消息）

标准消息格式：

```python
response = agent.invoke({
    "messages": [
        {"role": "user", "content": "杭州天气如何?"}
    ]
})
```

## Agent 工作流程

1. 用户发送消息
2. Agent 分析需求，决定调用工具
3. 执行工具，获取结果
4. 综合信息，生成回答

## 与传统 LLM 的区别

**传统 LLM 应用**：
```
用户需求 → LLM → 生成回答（基于训练数据）
```

**Agent 应用**：
```
用户需求 → Agent 规划 → 调用工具 → 获取实时信息 → 动态调整 → 生成回答
```

## Tool 定义的多种写法

`@tool` 装饰器只是最基础的写法，实际项目中常见写法如下：

| 写法 | 何时用 |
|---|---|
| `@tool`，参数用普通类型注解 | 最简单场景，参数无需额外说明 |
| `@tool(args_schema=MyModel)` | 需要复杂校验规则，独立复用一个 Pydantic Schema |
| `@tool`，参数用 `Annotated[type, "描述"]` | 给单个参数加说明，不必单独定义 Schema 类 |
| `@tool(parse_docstring=True)` | 从 Google 风格 docstring 的 `Args:` 段自动生成参数描述 |
| `StructuredTool.from_function(func, ...)` | 把已有普通函数包装成 Tool，无需装饰器改造原函数 |
| `Runnable.as_tool()` | 把一条 LCEL Chain 直接包装成 Tool 提供给 Agent 调用 |
| 继承 `BaseTool` | 需要自定义 `_run`/`_arun` 底层执行逻辑（如重试、埋点） |

```python
from typing import Annotated
from langchain_core.tools import tool, StructuredTool

@tool
def get_weather(city: Annotated[str, "城市名，如'杭州'"]) -> str:
    """查询指定城市天气"""
    return f"{city}今天晴，25度"

def _search(query: str) -> str:
    return f"搜索结果: {query}"

search_tool = StructuredTool.from_function(
    func=_search,
    name="search",
    description="联网搜索",
)
```

**LangGraph 专属的三种参数类型**（`langgraph.prebuilt.InjectedState`、`InjectedToolCallId`、`langgraph.types.Command`）：这三者在工具函数签名里声明后，LLM 的 tool-calling schema 里**看不到**它们（不会被当成模型要填的参数），而是由 LangGraph 运行时自动注入当前 graph state 或当前 tool_call_id。只能在 LangGraph 图里生效，纯 LangChain Agent（`create_agent`）不支持。详见 langgraph advanced runtime。

## LCEL 进阶原语

除了最基础的 `|` 管道组合，LCEL（LangChain Expression Language）还提供以下常见组合原语：

| 原语 | 作用 |
|---|---|
| `RunnableLambda` | 把普通函数包装成 Runnable，可参与 `\|` 链式组合 |
| `RunnableParallel` | 多个 Runnable 并行执行，结果合并成一个 dict |
| `RunnablePassthrough.assign(**kwargs)` | 在传递原始输入的同时，追加新计算出的字段 |
| `Runnable.with_fallbacks(fallbacks)` | 主 Runnable 抛异常时依次尝试备用 Runnable |
| `Runnable.with_retry(stop_after_attempt=3)` | 对该 Runnable 的调用做指数退避重试 |
| `Runnable.with_listeners(on_start, on_end, on_error)` | 挂生命周期回调，用于日志/监控 |
| `RouterRunnable(runnables: dict)` | 按 key 动态路由到不同 Runnable，等价于运行时可变的分支 |

```python
from langchain_core.runnables import RunnableParallel, RunnablePassthrough

chain = RunnablePassthrough.assign(
    context=lambda x: retriever.invoke(x["question"]),
).assign(
    answer=lambda x: model.invoke(f"上下文:{x['context']}\n问题:{x['question']}").content,
)

parallel = RunnableParallel(summary=summarize_chain, sentiment=sentiment_chain)
```

`with_fallbacks`/`with_retry` 常用于给模型调用加稳定性，不必手写 `try/except` 重试循环：

```python
robust_model = model.with_retry(stop_after_attempt=3).with_fallbacks([backup_model])
```

## 相关页面

- [Agent 原理](agent-principles.md) — Agent 原理
- [LangGraph 基础](langgraph-basics.md) — LangGraph 基础
- langgraph advanced runtime — LangGraph 专属的 `InjectedState`/`Command` 等注入类型
- [LangChain Agent 入门实战](../queries/langchain-agent-hello-world.md) — LangChain Agent 入门实战
