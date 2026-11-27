## 一、结论前置

**Agent 解决的核心问题是：让 LLM 从“一问一答的文本生成器”变成“能围绕目标自主执行多步任务、调用工具、根据反馈调整策略的闭环系统”。** 它存在的原因是——真实世界的任务几乎都不是单轮问答能搞定的，需要感知环境、做决策、动手执行、出错了再改。压成一个公式就是 **Agent = LLM + Harness**：LLM 决定下一步做什么，模型之外的一切——循环、工具、上下文、记忆、权限和停止条件——都属于 Harness（运行框架）。

---

## 二、通俗类比 + 严格专业

### 2.1 通俗类比

**普通 LLM = 顾问**：你问一句，他答一句。答完就忘，不会自己动手。

**Agent = 实习生**：你给一个目标（“帮我订明天去北京的机票”），他自己拆解任务→查航班→比价格→调用订票接口→遇到问题自己调整→直到完成。中间不需要你每一步都下指令。

用 iOS 开发类比（如果你写过客户端会更有感觉）：
- 普通 LLM 调用 = 纯函数 `func answer(query: String) -> String`，输入输出，无状态无副作用
- Agent = 有 `RunLoop` 的 `UIApplication`，能接收事件、维护状态、调用子系统、在循环里持续推进直到任务结束

### 2.2 严格专业定义

**最小定义（2026 行业收敛版）**：AI Agent 是以大模型为推理引擎，能围绕给定目标自主执行多步任务、调用外部工具、并根据反馈动态调整策略的软件系统。核心判别词是**多步自主闭环**——一次 prompt→一次 response 的系统不是 Agent。[CSA·Agentic Universe](https://labs.cloudsecurityalliance.org/agentic/agentic-universe-april-2026-v1/)

**拆开看：Agent = LLM + Harness**

LangChain 的 Vivek Trivedy 在 2026 年 3 月的博客里把这个公式说得很直白：**不是模型的部分，就是 Harness**——模型提供智能，Harness 让这些智能变得有用；裸模型不是 Agent，是 Harness 给了它状态、工具执行、反馈回路和可强制执行的约束之后，它才成为 Agent。[LangChain·The Anatomy of an Agent Harness](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)

| 组成 | 负责什么 | 具体包含 |
|---|---|---|
| **LLM** | 每一步的决策 | 读进文本、图片等数据，输出文本。它自己不能保持跨调用的状态、不能执行代码、拿不到实时信息 |
| **Harness（运行框架）** | 模型之外的代码、配置和执行逻辑 | System Prompt；工具、Skills、MCP 及其描述；配套基础设施（文件系统、沙箱、浏览器）；编排逻辑（子 Agent 派生、交接、模型路由）；Hooks / 中间件等确定性逻辑（上下文压缩、续跑、lint 检查） |

阿里云开源白皮书《AI Agent Handbook》的定义更偏工程：Harness 是**模型之外、围绕 Agent Loop 组织上下文、能力、状态、环境与控制机制，并将模型判断转化为可执行、可恢复、可验证任务过程的代码、配置和执行逻辑**。它同时澄清了三个常见误解。[阿里云·AI Agent Handbook](https://github.com/aliyun/ai-agent-handbook)

| Harness 不是 | 区别在哪 |
|---|---|
| 一段更长的 System Prompt | Prompt 只是某一轮推理的输入之一；Harness 还包括任务状态机、工具注册、权限检查、错误恢复、完成验证等确定性逻辑 |
| 某个框架的同义词 | 框架可以帮你实现 Harness，成熟的 Coding Agent CLI / SDK 提供现成的 Harness；Harness 描述的是 Agent 如何工作这一层，不是产品形态 |
| Runtime 或 Sandbox | Harness 决定下一步给模型什么、允许什么行动、怎样推进任务；Runtime 负责持续承载，Sandbox 负责把实际行动限制在可控环境里 |

同一个模型、同一套工具，换一个 Harness，表现可以差很多——比的是「模型 + Harness」的组合，不是裸模型（第 34 课会展开）。Anthropic 也把带工具调用、上下文压缩能力的运行时直接称为 agent harness。[Anthropic·Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

**Lilian Weng 经典公式（2023，至今仍是最常被引用的能力拆解）**：
> Agent = LLM（大脑）+ Planning（规划）+ Memory（记忆）+ Tool Use（工具）

- **LLM**：推理引擎，负责理解、决策、生成
- **Planning**：任务拆解 + 反思纠错
- **Memory**：短期（上下文窗口）+ 长期（向量库/外部存储）
- **Tool Use**：搜索、代码执行、API 调用等“手”[Lilian Weng·Agent博客](https://lilianweng.github.io/tags/agent/)

两个公式说的是同一件事的两面：Weng 的公式回答 Agent 需要**哪些能力**，LLM + Harness 回答这些能力**由谁实现**——Planning、Memory、Tool Use 都是 Harness 提供给模型的能力，模型负责在循环里用它们做决策。

**Andrew Ng 四大 Agentic 模式**：Tool Use（调用工具）、Planning（任务拆解）、Reflection（自我审视迭代）、Multi-Agent（多智能体协作）。这四个模式可组合，生产级 Agent 通常同时具备多个。[DeepLearning.AI·Agentic AI](https://corporate.deeplearning.ai/courses/agentic-ai/information)

---

## 三、底层机制：数据怎么流转

Agent 的本质是一个**循环（Loop）**，不是一次函数调用。最经典的实现是 **ReAct 模式**（Reasoning + Acting），由 Yao et al. 在 ICLR 2023 论文中提出。[arXiv:2210.03629](https://arxiv.org/pdf/2210.03629v3.pdf)

### 3.1 ReAct 循环的数据流转

```
用户目标 (Goal)
    │
    ▼
┌─────────────────────────────────────┐
│  1. Thought（推理）                  │
│     LLM 读取当前状态 + 历史记忆       │
│     生成：我现在该做什么？            │
│     输出：Action（工具名 + 参数）     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Action（执行）                   │
│     调用外部工具（搜索/代码/API）     │
│     工具返回结果                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Observation（观察）              │
│     工具结果回填到记忆/上下文         │
│     LLM 看到结果，判断：              │
│     - 目标达成？→ finish，输出答案    │
│     - 还没？→ 回到 Step 1 继续推理   │
└──────────────┬──────────────────────┘
               │ 未完成
               └───────► 回到 Step 1（循环）
```

**关键机制**：
1. **状态（State）**：循环中所有节点共享的数据结构，包含消息历史、中间结果、当前目标。LangGraph 中将其建模为显式的 State Schema。[LangGraph·Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)
2. **记忆（Memory）**：短期记忆 = 上下文窗口内的消息历史；长期记忆 = 外部存储（向量库/数据库），在每轮循环中检索注入。
3. **终止条件**：LLM 输出 `finish` 动作，或达到最大步数（防死循环）。LangGraph 通过 `recursion_limit` 强制上限。[LangGraph·Use Graph API](https://docs.langchain.com/oss/python/langgraph/use-graph-api) 更严谨的分工是**模型只能提出完成申请，Harness 才能提交完成状态**：由 Harness 按任务风险核对完成证据，而不是模型说自己做完了就算完。[阿里云·AI Agent Handbook](https://github.com/aliyun/ai-agent-handbook)

### 3.2 LangGraph 中的建模方式

LangGraph 就是 Harness 的一种实现：把 Agent Loop 建模为**图（Graph）**，三个核心组件：[LangGraph·Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)

| 组件 | 作用 | 类比 |
|---|---|---|
| **State** | 所有节点共享的数据快照 | 流水线台账 |
| **Node** | 执行单元（调用LLM / 执行工具 / 子图） | 工位 |
| **Edge** | 决定下一个执行哪个节点（固定边 / 条件边） | 传送带 + 分流器 |

最小 Agent 图就是两个节点 + 一个条件边的循环：
```
[agent_node] ──有tool_calls──► [tools_node] ──► [agent_node]（循环）
     │
     └──无tool_calls──► END（终止）
```

---

## 四、最小可运行代码示例

### 4.1 原生实现（不依赖 API key，可直接运行）

用 Python 原生实现 ReAct 循环，`mock_llm` 模拟 LLM 决策，替换为真实 API 即可上线。

```python
"""
极简 Agent 核心循环（ReAct 模式）
原生实现，不依赖外部 API，可直接 python 运行
"""
from typing import Callable, Dict, List

# ============ 工具层（Agent 的"手"）============
def tool_calculator(expression: str) -> str:
    try:
        return str(eval(expression, {"__builtins__": {}}, {}))
    except Exception as e:
        return f"计算错误: {e}"

def tool_search(query: str) -> str:
    db = {
        "深圳天气": "深圳今天晴，26-32度",
        "机票价格": "深圳→北京 最低 680元",
    }
    return db.get(query, f"未找到关于'{query}'的信息")

TOOLS: Dict[str, Callable] = {
    "calculator": tool_calculator,
    "search": tool_search,
}

# ============ LLM 决策层（Agent 的"大脑"）============
# 真实场景替换为 OpenAI / DeepSeek / 火山方舟 API 调用
def mock_llm(goal: str, history: List[Dict]) -> Dict:
    """
    输入：目标 + 历史行动记录
    输出：{"thought": "...", "action": "工具名|finish", "action_input": "..."}
    """
    if not history:
        if "天气" in goal:
            return {"thought": "需要先查天气", "action": "search", "action_input": "深圳天气"}
        if "预算" in goal:
            return {"thought": "需要先搜价格", "action": "search", "action_input": "机票价格"}
    if history and history[-1]["action"] == "search" and "预算" in goal:
        return {"thought": "拿到价格，计算总额", "action": "calculator", "action_input": "680 * 2"}
    last_obs = history[-1]["observation"] if history else ""
    return {"thought": "信息足够，结束", "action": "finish", "action_input": last_obs}

# ============ Agent 核心循环 ============
class ReActAgent:
    def __init__(self, tools: Dict[str, Callable], llm: Callable, max_steps: int = 5):
        self.tools = tools
        self.llm = llm
        self.max_steps = max_steps
        self.memory: List[Dict] = []  # 短期记忆：行动历史

    def run(self, goal: str) -> str:
        print(f"🎯 目标: {goal}\n")
        for step in range(1, self.max_steps + 1):
            # 1. Thought + Action：LLM 推理决策
            decision = self.llm(goal, self.memory)
            print(f"[步骤 {step}]")
            print(f"  💭 Thought: {decision['thought']}")
            print(f"  🔧 Action: {decision['action']}({decision['action_input']})")

            # 2. 终止判断
            if decision["action"] == "finish":
                print(f"\n✅ 最终答案: {decision['action_input']}")
                return decision["action_input"]

            # 3. Action：执行工具
            tool = self.tools.get(decision["action"])
            observation = tool(decision["action_input"]) if tool else f"错误: 工具不存在"
            print(f"  👁 Observation: {observation}\n")

            # 4. Observation：结果写入记忆，进入下一轮
            self.memory.append({**decision, "observation": observation})

        return "⚠️ 达到最大步数，任务未完成"

# ============ 运行 ============
if __name__ == "__main__":
    agent = ReActAgent(tools=TOOLS, llm=mock_llm)
    agent.run("帮我查深圳天气，然后算一下两个人去北京的机票预算")
```

**运行输出：**
```
🎯 目标: 帮我查深圳天气，然后算一下两个人去北京的机票预算

[步骤 1]
  💭 Thought: 需要先查天气
  🔧 Action: search(深圳天气)
  👁 Observation: 深圳今天晴，26-32度

[步骤 2]
  💭 Thought: 拿到价格，计算总额
  🔧 Action: calculator(680 * 2)
  👁 Observation: 1360

[步骤 3]
  💭 Thought: 信息足够，结束
  🔧 Action: finish(1360)

✅ 最终答案: 1360
```

### 4.2 LangGraph 生产级写法（@tool + ToolNode）

```python
"""
LangGraph 版最小 Agent：State + Node + Edge 的图建模
需 pip install langgraph langchain-openai langchain-core
"""
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode          # 内置工具执行节点
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool             # @tool 装饰器
from langchain_core.messages import BaseMessage

# ========== 1. State：所有节点共享的数据 ==========
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

# ========== 2. 工具层（@tool 装饰器自动生成 name/description/args_schema）==========
@tool
def calculator(expression: str) -> str:
    """计算数学表达式，如 2+3*4。仅支持加减乘除，不支持复杂函数。"""
    try:
        return str(eval(expression, {"__builtins__": {}}, {}))
    except Exception as e:
        return f"计算错误: {e}"

@tool
def search(query: str) -> str:
    """搜索信息。当前支持查询：深圳天气、机票价格。"""
    db = {
        "深圳天气": "深圳今天晴，26-32度",
        "机票价格": "深圳→北京 最低 680元",
    }
    return db.get(query, f"未找到关于'{query}'的信息")

tools = [calculator, search]

# ========== 3. LLM 绑定工具（bind_tools 自动把 @tool 元数据转成 function calling JSON）==========
llm = ChatOpenAI(model="gpt-4o-mini").bind_tools(tools)

# ========== 4. agent 节点：调用 LLM 做决策 ==========
def agent_node(state: AgentState) -> AgentState:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

# ========== 5. 条件边：LLM 输出了 tool_calls 就去 tools，否则结束 ==========
def should_continue(state: AgentState) -> str:
    last_msg = state["messages"][-1]
    return "tools" if last_msg.tool_calls else END

# ========== 6. 组装图 ==========
graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)          # "agent" → agent_node 函数
graph.add_node("tools", ToolNode(tools))     # "tools" → 内置 ToolNode 实例（替代手写 tools_node）
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue)
graph.add_edge("tools", "agent")             # tools 执行完回到 agent，形成循环

app = graph.compile()
result = app.invoke({"messages": [("user", "帮我查深圳天气并算两个人去北京的机票预算")]})
print(result["messages"][-1].content)
```

**关键点说明（对照 4.1 的手写循环）：**

| 4.1 的手写做法 | 这里的 @tool + ToolNode |
|---|---|
| 工具用普通函数 + `TOOLS` 字典映射 | `@tool` 装饰器从函数签名和 docstring 自动生成 name / description / 参数 schema |
| 循环里自己判断 LLM 要调哪个工具 | `bind_tools(tools)` 把 schema 交给模型，由 function calling 返回 `tool_calls` |
| 手写执行工具、拼接 Observation | 内置 `ToolNode(tools)` 自动执行 `tool_calls`，并把结果作为 ToolMessage 回填 |

> `graph.add_edge("tools", "agent")` 中的 “tools” 是 `add_node("tools", ToolNode(tools))` 注册的节点 ID，不是字符串字面量。LangGraph 官方文档明确说明：Agent 的核心就是 `call_model → tools → call_model` 的循环，直到 LLM 不再输出 tool_calls。[LangGraph·Workflows vs Agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)

---

## 五、易混概念对比表

| 可量化维度 | 普通 LLM 调用 | 自动化脚本/RPA | AI Agent |
|---|---|---|---|
| **组成** | 只有 LLM | 脚本本身就是全部流程，没有 LLM | LLM + Harness |
| **驱动方式** | 单轮问答，用户每轮输入 | 固定规则/流程，硬编码 | 目标驱动，LLM 自主决策下一步 |
| **任务步数** | 固定 1 步 | 固定 N 步，写死 | 动态 N 步，可临场增减 |
| **工具调用** | 无（纯文本输出） | 硬编码指定哪个工具何时调 | LLM 自主选择工具和参数 |
| **遇错处理** | 直接返回错误文本 | 报错终止，需人改脚本 | 观察错误→反思→换策略重试 |
| **状态维护** | 无状态（每次调用独立） | 有限（脚本内变量） | 短期记忆（上下文）+ 长期记忆（外部存储） |
| **灵活性** | 高（生成任意文本） | 极低（只能做写死的事） | 高（生成+执行+调整） |
| **单次延迟** | ~1-5s | ~ms级 | 每步 1-5s × N步，通常 10s+ |
| **单次成本** | 低（1次API调用） | 极低（无LLM调用） | 高（N次API调用 + 工具调用） |

主观判断：Agent 的本质不是“更聪明的 LLM”，而是**给 LLM 装上了感知器官、手和记忆的闭环执行系统**。LLM 是大脑，Agent 是完整的人。

---

## 六、3个实战中的常见坑

### 坑1：把 Agent 当成万能解法，单轮问答也套 Agent
**现象**：用户问“1+1等于几”，也走 Agent Loop，调工具、循环3步，耗时10秒、成本翻5倍。
**正解**：先判断任务复杂度。单轮事实问答直接用 LLM；只有需要多步推理、工具调用、环境交互时才用 Agent。LangChain 官方文档将此区分为 “Workflows”（固定流程）vs “Agents”（自主循环）。[LangGraph·Workflows vs Agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)

### 坑2：不设最大步数，Agent 死循环烧 token
**现象**：LLM 在两个工具之间反复横跳（搜索→计算→搜索→计算…），永远不输出 finish，token 账单爆炸。
**正解**：必须设置 `max_steps` / `recursion_limit`。LangGraph 默认有 recursion_limit，超出后报错而非无限运行。[LangGraph·Use Graph API](https://docs.langchain.com/oss/python/langgraph/use-graph-api) 同时在 Prompt 中明确“最多尝试N次，失败则报告原因”。

### 坑3：工具描述写得太模糊，LLM 不知道何时调用
**现象**：定义了 `search(query: str)` 工具，但 LLM 该搜的时候不搜、不该搜的时候乱搜。
**正解**：工具的 name + description + 参数 schema 必须精确。描述里写清“什么时候用、什么时候不用、参数格式要求”。这是 Function Calling 可靠性的第一杠杆——OpenAI 官方文档强调 tool description 质量直接影响调用准确率。（注：具体准确率提升比例未找到权威公开数据，不同模型差异大）

> 起步顺序：先做一个目标明确的单任务场景，只接 1 个工具，把「判断 → 调用 → 读取 → 输出」这个最小循环跑稳。最小循环没跑稳之前，不要急着上多工具、长期记忆和更高的自主性。

---

## 七、进阶问题（引导往下挖）

1. **ReAct 循环中，Observation 回填到 LLM 上下文时，如果工具返回结果很长（比如搜索返回10篇文章各5000字），上下文窗口爆了怎么办？** 这会引出「上下文窗口管理」和「Memory 检索」机制——也就是课程第②层的 Memory 知识点。

2. **如果 LLM 自主决策调用工具，但工具执行的是不可逆操作（比如发邮件、转账、删除文件），怎么保证安全？** 这会引出「Human-in-the-Loop」和「Agent 安全与对齐」——课程第④层的工程落地知识点。

---

## 八、四关自测

### 复述关（3句话讲清）
1. Agent 的本质是以 LLM 为大脑、围绕目标自主跑“推理→行动→观察→再推理”闭环的软件系统，判别标准是多步自主闭环，不是单轮问答。
2. 压成一个公式是 Agent = LLM + Harness：模型负责每一步的决策，循环、工具、上下文、记忆和护栏都在 Harness 里；Weng 的 Planning / Memory / Tool Use 是对 Harness 的经典能力拆解。
3. 它解决的真实痛点是：真实任务几乎都需要感知环境、调工具、按反馈调整，纯文本生成器干不了。

### 举例关（真实场景）
你让手机助手“帮我订明天去北京的机票，预算1500以内，上午出发”。普通 LLM 只会告诉你“可以去携程搜”；Agent 则自己调航班查询工具→比价格→发现680元的那班→调用订票接口→支付→把订单号回给你，全程你只下了一次指令。

### 反例关（边界条件）
用户问“1+1等于几”或“帮我把这段话翻译成英文”，这类单轮就能出答案的任务硬套 Agent Loop，会白白多调2-3轮工具、烧5倍 token、延迟从2秒变10秒。Agent 不是万能解法，单轮问答场景直接用 LLM 即可，过度工程化是新手最常踩的坑。

### 教学关（给小白讲）
普通 AI 像个只会动嘴的顾问：你问一句他答一句，答完就完事，手不动、腿不跑。Agent 像个靠谱的实习生：你给他一个目标，他自己拆步骤、打电话查信息、用计算器算账、遇到不对自己换办法，直到把事办完交差。区别就是——一个只出嘴，一个真动手。

---

## 资料来源

- 论文: [Yao et al., *ReAct: Synergizing Reasoning and Acting in Language Models*, ICLR 2023](https://arxiv.org/pdf/2210.03629v3.pdf)
- 技术博客: [Lilian Weng, *LLM Powered Autonomous Agents*, 2023](https://lilianweng.github.io/tags/agent/)
- 官方博客: [Anthropic, *Effective harnesses for long-running agents*, 2025](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- 官方博客: [LangChain, Vivek Trivedy, *The Anatomy of an Agent Harness*, 2026](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)
- 官方文档: [阿里云, *AI Agent Handbook*（构建篇第 03 章 Harness 定义、第 04 章任务循环与完成验证）](https://github.com/aliyun/ai-agent-handbook)
- 官方课程: [Andrew Ng, *Agentic AI* 课程, DeepLearning.AI](https://corporate.deeplearning.ai/courses/agentic-ai/information)
- 行业报告: [Cloud Security Alliance, *Agentic Universe: April 2026*](https://labs.cloudsecurityalliance.org/agentic/agentic-universe-april-2026-v1/)
- 框架文档: [LangGraph 官方文档：Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)
- 框架文档: [LangGraph 官方文档：Workflows and Agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)
- 框架文档: [LangGraph 官方文档：Use Graph API（recursion_limit）](https://docs.langchain.com/oss/python/langgraph/use-graph-api)
- 权威媒体: [新华网，《智能体：把能力转化为生产力》, 2026-04](http://www.xinhuanet.com/globe/20260402/2e094094cb7c4a5ea9267e3ac55dd5ae/c.html)

> 来源核验 2026-11-25：全部外链逐一联网核验可访问，论文标题按 arXiv 原文校准；存疑数字保留原文标注。技术结论与官方文档不一致时以官方为准。
>
> 2026-11-27 复核：补入 Agent = LLM + Harness 的定义与出处（LangChain 博客、阿里云《AI Agent Handbook》，均按原文核对）；删去对文中并不存在的“骨架版”代码的引用。
