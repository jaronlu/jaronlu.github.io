## 一、结论前置

1. **普通 LLM 调用是“一问一答”**：你发一个 prompt，模型回一段文本，完事。无状态、无工具、无循环。
2. **Agent 是“给目标，自己干”**：模型在一个 while 循环里反复推理→调工具→看结果→再推理，直到自己觉得任务完成。核心区别就是一个 **Agent Loop**。
3. **选型原则**：能提前写死步骤的用 Workflow，步骤依赖中间发现的才用 Agent；Agent 更灵活但更贵、更不可控。

---

## 二、通俗类比 + 专业定义

### 通俗类比

**普通 LLM 调用 = 自动售货机**
- 你投币（发 prompt），选按钮（指定格式），机器掉出一罐饮料（返回文本）
- 一次交易，货银两清，机器不记得你
- 你想换个口味？再投一次币

**Agent = 雇了一个实习生**
- 你说“帮我订一张下周去北京的机票，选最便宜的”
- 实习生自己查航班（调工具）、对比价格（推理）、可能发现时间不合适再查一遍（循环）
- 最后给你结果：“订好了，这是确认号”
- 整个过程你不用一步步指挥，他自己决定下一步做什么

### 专业定义

| 概念 | 定义 |
|------|------|
| **普通 LLM 调用** | 单次请求-响应模式：客户端构造 prompt（含 system/user message），调用 LLM API，获取生成文本，结束。无状态、无工具执行、无循环控制。 |
| **AI Agent** | 以 LLM 为推理引擎，在 **Agent Loop**（感知→推理→行动→观察）中自主决定下一步动作，可调用外部工具、维护跨步骤状态，直至达成目标或触发停止条件的软件系统。 |
| **Agent Loop** | 一个由 LLM 控制的 while 循环：模型返回 tool_call 则执行工具并回填结果继续循环；模型返回纯文本则结束循环。**运行时不决定何时完成，模型自己决定**。 |

> 一句话：**LLM 产生回答，Agent 采取行动。** LLM 是 Agent 内部的一个组件，不是 Agent 本身。

---

## 三、底层机制

### 普通 LLM 调用的执行流程

```
用户 → 构造 prompt → LLM API → 返回文本 → 用户
（单轮，无状态，结束）
```

### Agent Loop 的执行流程

```
用户给目标
    ↓
┌─────────────────────────────────┐
│  1. 把全部消息历史发给 LLM       │
│  2. LLM 返回：纯文本 或 tool_call │
│  3a. 纯文本 → 作为最终答案，结束   │
│  3b. tool_call → 执行工具         │
│      ↓                           │
│  4. 工具结果作为 tool message 追加 │
│  5. 回到步骤 1（循环）            │
└─────────────────────────────────┘
```

### 关键差异拆解

| 维度 | 普通 LLM 调用 | Agent |
|------|---------------|-------|
| **控制流** | 无，单轮 | 模型驱动的循环 |
| **谁决定下一步** | 程序员/用户 | LLM 自己 |
| **工具使用** | 可选，单次调用 | 核心机制，多步动态调用 |
| **状态** | 无状态（仅 prompt 窗口） | 跨步骤持久状态（消息历史+变量） |
| **停止条件** | 一次回复结束 | 目标达成 / 步数预算耗尽 / 模型不再调工具 |
| **延迟** | 可预测（1-3s） | 不可预测（5s 到数分钟） |
| **成本** | 一次 API 调用 | 多次 API 调用 + 工具执行 |
| **可测试性** | 高，输入输出固定 | 低，路径动态变化 |

### Agent 的三大新增能力

1. **工具调用（Tool Use）**：模型不只是说话，还能“动手”——查数据库、调 API、执行代码、读写文件。
2. **循环执行（Agent Loop）**：模型可以根据工具返回的结果，决定下一步做什么，而不是一次性给出答案。
3. **状态管理（State）**：循环中的每一步都能看到之前的对话历史和工具结果，形成“工作记忆”。

---

## 四、最小可运行代码

### 普通 LLM 调用（单轮）

```python
import os
from openai import OpenAI

# 用自己的 provider 跑通本示例（任何 OpenAI 兼容接口均可）：
#   export OPENAI_API_KEY=sk-xxx        # 你的 key
#   export OPENAI_BASE_URL=https://...  # 接口地址（用 openai 官方可省略）
#   export LLM_MODEL=doubao-pro-32k     # 模型名，按你的 provider 填
client = OpenAI()  # 自动读取 OPENAI_API_KEY / OPENAI_BASE_URL
MODEL = os.environ["LLM_MODEL"]

response = client.chat.completions.create(
    model=MODEL,
    messages=[
        {"role": "system", "content": "你是一个 helpful assistant"},
        {"role": "user", "content": "北京今天天气怎么样？"}
    ]
)

print(response.choices[0].message.content)
# 输出：模型不知道实时天气，只能回答"我无法获取实时天气信息"
# （单轮结束，无法调工具查天气）
```

### 最小 Agent Loop（手写 while 循环）

```python
# client/MODEL 沿用上节（env 三件套见上节说明）
from openai import OpenAI
import json

client = OpenAI()

# 定义一个工具：查天气（模拟）
def get_weather(city: str) -> str:
    return f"{city}今天晴，25°C，微风"

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "查询指定城市的实时天气",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名称"}
                },
                "required": ["city"]
            }
        }
    }
]

messages = [
    {"role": "user", "content": "北京今天天气怎么样？适合出门吗？"}
]

# Agent Loop：模型决定何时停止
while True:
    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        tools=tools
    )

    message = response.choices[0].message

    # 模型选择调工具 → 执行并回填，继续循环
    if message.tool_calls:
        messages.append(message)  # 保存 assistant 的 tool_call 声明
        for tool_call in message.tool_calls:
            func_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)
            result = get_weather(**args)  # 执行工具
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result
            })
        # 回到循环顶部，把工具结果发给模型继续推理

    # 模型返回纯文本 → 任务完成，结束循环
    else:
        print(message.content)
        break

# 输出：北京今天晴，25°C，微风，天气不错，适合出门。
# （模型自己调了天气工具，然后基于结果给出了最终回答）
```

### 用 LangGraph 实现（生产级）

```python
# 沿用上节 env 三件套：ChatOpenAI 自动读取 OPENAI_API_KEY / OPENAI_BASE_URL
# 需 pip install langgraph langchain-openai
import os
from typing import Annotated, TypedDict, List
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage
from langchain_core.tools import tool

class AgentState(TypedDict):
    # add_messages 是 reducer：节点返回的 messages 追加进状态，而不是整体覆盖
    messages: Annotated[List[BaseMessage], add_messages]

@tool
def get_weather(city: str) -> str:
    """查询指定城市的实时天气"""
    return f"{city}今天晴，25°C，微风"

llm = ChatOpenAI(model=os.environ["LLM_MODEL"]).bind_tools([get_weather])

def agent_node(state):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state):
    last_message = state["messages"][-1]
    return "tools" if last_message.tool_calls else END

def tool_node(state):
    # 执行所有 tool_calls 并回填。
    # 注意：LangGraph 的 tool_calls 是 dict，不是 OpenAI SDK 的对象（没有 .function / .id 属性）
    outputs = []
    for tool_call in state["messages"][-1].tool_calls:
        result = get_weather.invoke(tool_call["args"])
        outputs.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))
    return {"messages": outputs}

graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)
graph.add_node("tools", tool_node)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue)
graph.add_edge("tools", "agent")
app = graph.compile()

result = app.invoke({"messages": [HumanMessage(content="北京天气怎么样？")]})
print(result["messages"][-1].content)
```

---

## 五、易混对比表

| 对比项        | 普通 LLM 调用 | Chatbot（带对话历史） | Workflow（固定流程） | Agent（自主循环） |
| ---------- | --------- | -------------- | -------------- | ----------- |
| **轮次**     | 单轮        | 多轮，但每轮用户驱动     | 多轮，代码驱动        | 多轮，模型驱动     |
| **谁决定下一步** | 无下一步      | 用户发下一条消息       | 程序员写死的路径       | LLM 自己决定    |
| **工具使用**   | 无         | 通常无            | 固定节点调用         | 动态、多步       |
| **记忆**     | 无         | 短期对话历史         | 节点间传递          | 工作记忆+持久记忆   |
| **停止条件**   | 一次回复      | 用户离开           | 所有节点跑完         | 目标达成/预算耗尽   |
| **例子**     | 翻译、摘要     | ChatGPT 对话     | 摘要→翻译→发邮件      | “帮我订机票”     |
| **可预测性**   | 高         | 中              | 高              | 低           |
| **成本**     | 低         | 低              | 中              | 高           |

> **关键区分**：Chatbot 虽然有多轮对话，但每一步都是用户驱动的——用户不发消息，它就不动。Agent 是目标驱动的——给了目标后，它自己循环执行，不需要用户一步步指挥。

---

## 六、3 个实战坑

### 坑 1：把所有任务都做成 Agent，导致成本爆炸和不可控

**现象**：不管什么任务都套 Agent Loop，结果一个简单的翻译任务也跑了 3 轮工具调用，成本是普通调用的 5 倍，结果还不稳定。

**避坑**：
- 能用普通 LLM 调用的（翻译、摘要、分类），不要用 Agent
- 能提前写死步骤的（先检索再生成再格式化），用 Workflow，不要用 Agent
- **只有当步骤依赖中间发现的结果时**（如“先查数据，根据数据决定下一步查什么”），才用 Agent
- 实用判断：如果你能在纸上把执行步骤写下来，就用 Workflow；如果写不下来（因为步骤取决于中间结果），才用 Agent

### 坑 2：Agent Loop 没有步数上限，模型陷入死循环

**现象**：模型反复调用同一个工具（如反复查天气），或者在两个工具之间来回切换，永远不结束，token 消耗直线上升。

**原因**：Agent Loop 的停止条件是“模型不再调工具”，但模型可能因为工具返回结果不满足预期、或者 prompt 设计不当，导致一直认为还需要继续调工具。

**避坑**：
- **必须设置最大步数**（如 `max_iterations=10`），超过后强制结束并返回当前结果
- 设置 token 预算上限（如 `max_tokens=10000`）
- 监控循环模式，检测到重复调用同一工具+同一参数时提前终止
- 在 system prompt 中明确告诉模型“如果工具返回的信息已经足够回答，就直接给出最终答案，不要继续调工具”

### 坑 3：工具描述写得模糊，模型不知道什么时候该调、怎么调

**现象**：模型该调工具的时候不调（直接瞎编答案），不该调的时候乱调（问“你好”也调工具），或者调工具时参数填错。

**原因**：工具的 name、description、parameters 描述不够清晰，模型无法准确判断何时使用、如何传参。

**避坑**：
- 工具 name 要语义明确（`get_current_weather` 比 `weather` 好）
- description 要写清“什么时候用、什么时候不用”（如“当用户询问实时天气时使用，不要用于一般性的气候问题”）
- parameters 的每个字段都要有 description，枚举值要列全
- 给 few-shot 示例：在 system prompt 里展示“什么情况下该调这个工具、参数怎么填”
- 工具数量控制在 5-10 个，太多会导致模型选择困难（可用 Router 模式先分类再选工具）

---

## 七、进阶问题（引导往下挖）

### 问题 1：Agent 的“自主性”到底到什么程度？模型真的在“思考”吗？

**引导思考**：
- Agent 的“自主”本质上是模型在每一步选择“调哪个工具”或“直接回答”，这是基于概率的下一个 token 预测，不是真正的意识或思考
- 但从外部行为看，它确实能根据中间结果动态调整策略，这在效果上等同于“自主决策”
- 关键边界：模型不会“想要”完成任务，它只是在预测“完成这个任务的合理下一步是什么”。如果 system prompt 没给明确目标，它就不知道该做什么
- 延伸：这引出了 Agent 的“对齐”问题——如何确保模型的“自主决策”符合人类意图，而不是走偏或做有害的事

### 问题 2：Workflow 和 Agent 的边界越来越模糊，未来会怎样？

**引导思考**：
- 当前趋势：**Agentic Workflow**——在固定流程的某些节点上，让模型自主决定子步骤（如“检索节点”由模型决定查哪些关键词、查几次）
- 另一个趋势：**Constrained Agents**——给 Agent 加上严格的约束（只能调指定工具、最多 N 步、必须按特定顺序），使其更像 Workflow
- 本质：这是一个“可控性 vs 灵活性”的光谱。纯 Workflow 在一端（完全可控，零灵活），纯 Agent 在另一端（完全灵活，不可控）。实际应用大多在中间
- 延伸：LangGraph 这样的框架之所以流行，就是因为它允许你在这个光谱上自由移动——你可以画一个固定的图（Workflow），也可以在某个节点里放一个循环（Agent），还可以用条件边动态选择路径

---

## 八、四关自测

### 复述关（3句话讲清）
1. 普通 LLM 调用是单次请求-响应：发 prompt、收文本、结束，无状态无工具；Agent 是给一个目标后，模型自己在 while 循环里“推理→调工具→看结果→再推理”直到收尾。
2. 核心分水岭是“谁决定下一步”：普通调用由用户/程序员决定，Agent 由 LLM 自己根据中间观察决定，停止条件是模型不再输出 tool_call。
3. 选型原则是能写死步骤就用 Workflow、只有步骤依赖中间发现才上 Agent——Agent 更灵活但更贵、延迟不可控、更难测试。

### 举例关（真实场景）
做客服系统：用户说“查一下我上周的订单到哪了”。普通 LLM 只能回“我无法访问你的订单系统”；带工具的 Agent 会自己决定“先调登录态接口确认身份→再调订单查询接口→拿到物流单号→再调物流接口→组织成自然语言回复”，全程你只发了一句话，它自己循环了4步。

### 反例关（边界条件）
用户只是让系统把一段中文翻译成英文、或把3000字文章摘要成300字，这种步骤能在纸上一次写死的任务，硬套 Agent Loop 会让模型凭空多调几轮工具、延迟从2秒变15秒、成本翻5倍，结果还不如一次普通调用稳定。判断口诀：能在纸上把步骤写下来就用 Workflow/普通调用，写不下来才用 Agent。

### 教学关（给小白讲）
普通 AI 像自动售货机：你投币按按钮，它掉一罐饮料，一次交易两清，它不记得你。Agent 像你雇的实习生：你交代一句“帮我订张下周去北京最便宜的机票”，他自己查航班、比价、不合适再查、最后把确认号给你，中间不用你一步步指挥。区别就是——一个只出嘴回答，一个真动手把事办完。

---

## 资料来源

- 技术博客: [Nitin Singh - What Is an AI Agent? And When Should You Build One](https://nitinksingh.com/posts/what-is-an-ai-agent-and-when-should-you-build-one/)
- 官方文档: [Microsoft Learn - From LLMs to Agents](https://learn.microsoft.com/en-us/agent-framework/journey/from-llms-to-agents)
- 技术博客: [Oracle Blogs - What Is the AI Agent Loop?](https://blogs.oracle.com/developers/what-is-the-ai-agent-loop-the-core-architecture-behind-autonomous-ai-systems)
- 技术博客: [AI/TLDR - How Does the Agent Loop Work?](https://ai-tldr.dev/learn/ai-agents/agent-fundamentals/agent-loop-explained/)
- 技术博客: [掘金 - Agent Loop: AI Agent 的最小实现结构深入解析](https://juejin.cn/post/7623370979330752563)
- 教学课件: [清华大学计算机实验教学中心 - Agent 架构](https://lab.cs.tsinghua.edu.cn/rust/projects/agent/agent-architecture/)
- 技术博客: [腾讯云 - 大模型与智能体(Agent)的核心差异](https://cloud.tencent.com/developer/article/2633184)

> 来源核验 2026-11-25：全部外链逐一联网核验可访问，论文标题按 arXiv 原文校准；存疑数字保留原文标注。技术结论与官方文档不一致时以官方为准。
