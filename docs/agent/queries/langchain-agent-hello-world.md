# LangChain Agent 入门实战

> confidence: high

## 最小 Agent 示例

从零创建一个能调用工具的 Agent：

### 1. 安装依赖

```bash
uv add langchain
uv add langchain-deepseek  # 或 langchain-openai / langchain-anthropic
```

### 2. 定义工具

```python
from langchain.tools import tool

@tool
def get_weather(location: str) -> str:
    """获取指定位置天气"""
    return f"{location}天气晴朗"
```

### 3. 创建 Agent

```python
from langchain.agents import create_agent
from dotenv import load_dotenv

load_dotenv()

agent = create_agent(
    model="deepseek-chat",
    tools=[get_weather]
)
```

### 4. 调用 Agent

```python
response = agent.invoke({
    "messages": [
        {"role": "user", "content": "杭州天气如何?"}
    ]
})

print(response)
```

## 执行流程

```
用户: "杭州天气如何?"
    ↓
Agent 分析意图 → 决定调用 get_weather 工具
    ↓
执行工具 → 返回 "杭州天气晴朗"
    ↓
Agent 综合结果 → 生成回答
    ↓
返回: "杭州今天天气晴朗"
```

## 关键概念

### Tools（工具）

用 `@tool` 装饰器定义，需要：
- 函数名：描述功能
- 参数类型：明确输入
- docstring：描述工具用途（Agent 靠这个决定何时调用）

```python
@tool
def search_web(query: str, max_results: int = 3) -> str:
    """搜索网页获取最新信息"""
    # 实现搜索逻辑
    return results
```

### Models（模型）

支持多种提供商：

```python
# DeepSeek
agent = create_agent("deepseek-chat", tools=[...])

# OpenAI
agent = create_agent("gpt-4", tools=[...])

# Anthropic
agent = create_agent("claude-3-sonnet", tools=[...])
```

### Messages（消息）

标准消息格式：

```python
# 用户消息
{"role": "user", "content": "查询内容"}

# 系统提示
{"role": "system", "content": "你是一个天气助手"}
```

## 进阶：流式输出

```python
for chunk in agent.stream(
    {"messages": [{"role": "user", "content": "北京天气如何?"}]},
    stream_mode="updates"
):
    for step, data in chunk.items():
        print(f"Step: {step}")
        print(f"Content: {data['messages'][-1].content}")
```

## 常见问题

### Q: Agent 不调用工具怎么办？

检查：
1. docstring 是否清晰描述工具用途
2. 用户问题是否需要工具才能回答
3. 模型是否支持 tool calling

### Q: 如何添加多个工具？

```python
agent = create_agent(
    model="deepseek-chat",
    tools=[get_weather, search_web, calculate]
)
```

### Q: 如何自定义系统提示？

```python
agent = create_agent(
    model="deepseek-chat",
    tools=[...],
    system_prompt="你是一个旅游助手，使用工具帮助用户规划行程。"
)
```

## 下一步

- 添加更多工具
- 自定义 State 记录更多信息
- 使用 LangGraph 构建复杂工作流
- 接入 MCP 使用外部服务

## 相关笔记

- [Agent 原理](../concepts/agent-principles.md)
- [LangGraph 工作流模式](langgraph-workflow-patterns.md)
