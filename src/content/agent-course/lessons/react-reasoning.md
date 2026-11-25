## 一、结论前置

1. **ReAct = Reasoning + Acting，即“想一步，做一步，看结果，再想下一步”**。模型在循环中交替输出“思考（Thought）”和“行动（Action）”，行动后获得“观察（Observation）”，再基于观察继续思考，直到任务完成。这是现代 Agent 最基础、最广泛使用的循环范式。
2. **ReAct 解决了 CoT（思维链）的致命缺陷——幻觉**。CoT 只在脑子里推理，不接触外部世界，容易“一本正经地胡说八道”。ReAct 在推理过程中插入行动（查资料、调工具），用真实观察结果“锚定”推理，大幅减少幻觉。论文实验：ALFWorld 任务成功率从 CoT 的 58% 提升到 ReAct 的 71%。
3. **ReAct 是几乎所有现代 Agent 框架的底层循环**。LangGraph、AutoGen、CrewAI、OpenAI Agents SDK 的核心循环都是 ReAct 的变体——只是在“思考”和“行动”之间加了更多机制（规划、反思、记忆、多 Agent 协作）。理解 ReAct 就理解了 Agent 的“发动机”。

---

## 二、通俗类比 + 专业定义

### 通俗类比

**CoT（思维链）= 闭卷考试，只在脑子里推导**
- 题目：“苹果公司当前的市盈率是多少？高于消费电子行业中位数吗？”
- CoT 学生：“苹果是科技公司，市盈率大概 25 倍吧……行业中位数大概 20 倍……所以应该是高于的。”
- 问题：全靠记忆和猜测，数字可能是错的（幻觉）

**ReAct = 开卷考试，想一步查一步**
- ReAct 学生：
  - **Thought**：“我需要先查苹果的市盈率，再查行业中位数，最后比较。”
  - **Action**：调用搜索工具“苹果公司 当前市盈率”
  - **Observation**：“苹果市盈率 28.5 倍（2026年10月）”
  - **Thought**：“有了苹果的数据，现在需要查消费电子行业市盈率中位数。”
  - **Action**：调用搜索工具“消费电子行业 市盈率中位数 2026”
  - **Observation**：“消费电子行业市盈率中位数 18.2 倍”
  - **Thought**：“28.5 > 18.2，苹果市盈率高于行业中位数。可以给出答案了。”
  - **Final Answer**：“苹果当前市盈率 28.5 倍，高于消费电子行业中位数 18.2 倍。”

关键点：每一步推理都有真实数据支撑，不会瞎编。

### 专业定义

| 概念 | 定义 |
|------|------|
| **ReAct（Reasoning + Acting）** | 一种 LLM 推理范式，让模型交替生成**推理轨迹（Thought）**和**任务特定行动（Action）**，行动后获得**环境观察（Observation）**，形成 Thought→Action→Observation 的循环，直到任务完成。由 Yao et al. 于 2022 年 10 月提出（arXiv:2210.03629），ICLR 2023 发表。 |
| **Thought（思考）** | 模型输出的自然语言推理轨迹，不影响外部环境。作用：分解任务、制定计划、跟踪进度、处理异常、更新上下文。是模型的“工作记忆”。 |
| **Action（行动）** | 模型输出的工具调用请求，会影响外部环境。如搜索、查询数据库、执行代码、发送邮件等。由外部代码执行。 |
| **Observation（观察）** | 行动执行后从环境返回的结果。作为新的上下文注入，供模型继续推理。 |
| **ReAct Loop（ReAct 循环）** | Thought→Action→Observation→Thought→… 的迭代循环，直到模型输出最终答案（Finish）。 |

---

## 三、底层机制

### 一、ReAct 循环的完整流程

```
用户输入任务
    ↓
┌──────────────────────────────────────────┐
│  1. Thought（思考）                        │
│     模型推理：当前状态是什么？下一步做什么？  │
│     （分解任务、制定计划、跟踪进度）          │
│         ↓                                  │
│  2. Action（行动）                         │
│     模型输出工具调用：search("关键词")       │
│         ↓                                  │
│  3. 环境执行工具                           │
│     外部代码执行搜索，返回结果               │
│         ↓                                  │
│  4. Observation（观察）                    │
│     工具结果作为新上下文注入                 │
│         ↓                                  │
│  5. 回到步骤 1（继续思考）                  │
│     模型基于新观察决定：继续行动 或 给出答案  │
└──────────────────────────────────────────┘
    ↓
模型输出 Final Answer（任务完成）
```

### 二、ReAct 的 Prompt 格式

ReAct 通过 few-shot 示例引导模型按固定格式输出：

```
Question: 苹果公司当前市盈率高于消费电子行业中位数吗？

Thought: 我需要先查苹果的市盈率，再查行业中位数，最后比较。
Action: search["苹果公司 当前市盈率 2026"]
Observation: 苹果公司市盈率为 28.5 倍（2026年10月）

Thought: 有了苹果的数据，现在需要查消费电子行业市盈率中位数。
Action: search["消费电子行业 市盈率中位数 2026"]
Observation: 消费电子行业市盈率中位数为 18.2 倍

Thought: 28.5 > 18.2，苹果市盈率高于行业中位数。可以给出答案了。
Action: finish["苹果当前市盈率 28.5 倍，高于消费电子行业中位数 18.2 倍"]
```

**格式要点**：
- `Thought:` 开头是思考，不执行
- `Action:` 开头是行动，需要执行工具
- `Observation:` 是工具返回的结果（由系统注入，不是模型生成）
- `Action: finish[...]` 表示任务完成，输出最终答案

### 三、ReAct 论文的核心实验结果

| 任务 | CoT（只推理） | Act-only（只行动） | ReAct（推理+行动） |
|------|-------------|------------------|-------------------|
| **HotpotQA（多跳问答）** | 29.4% | 25.9% | **35.1%** |
| **FEVER（事实验证）** | 55.7% | 52.4% | **58.3%** |
| **ALFWorld（交互决策）** | 58.1% | 68.0% | **71.0%** |
| **WebShop（网购决策）** | 29.7% | 53.0% | **57.3%** |

**关键发现**：
- 在需要外部信息的任务（HotpotQA、FEVER）上，ReAct 显著优于 CoT（因为 CoT 只能靠记忆，容易幻觉）
- 在交互决策任务（ALFWorld、WebShop）上，ReAct 优于 Act-only（因为 Act-only 不会规划，容易盲目行动）
- **推理和行动的协同效应**：1+1 > 2，推理指导行动，行动锚定推理

### 四、Thought 的四种类型

ReAct 论文指出，Thought（思考）不只是“自言自语”，它有明确的功能：

| Thought 类型 | 作用 | 示例 |
|-------------|------|------|
| **任务分解** | 把大任务拆成小步骤 | “我需要先查 A，再查 B，最后比较” |
| **计划制定** | 制定行动计划 | “先搜索苹果市盈率，再搜索行业中位数” |
| **进度跟踪** | 记录已完成什么、还剩什么 | “已经查到苹果的数据，还需要行业数据” |
| **异常处理** | 处理意外情况，调整计划 | “搜索没有返回结果，换个关键词试试” |

**关键洞察**：Thought 是模型的“工作记忆”——它把推理过程显式写出来，跨步骤保持上下文，避免“忘了之前在做什么”。

### 五、ReAct 与其他推理范式的关系

```
CoT（Chain-of-Thought）：只推理，不行动
  ↓ 加行动
ReAct：推理 + 行动 + 观察（循环）
  ↓ 加先规划
Plan-and-Execute：先整体规划，再逐步执行
  ↓ 加反思
Reflexion：ReAct + 失败后复盘重试
  ↓ 加多 Agent
Multi-Agent ReAct：多个 Agent 各自 ReAct 循环，互相协作
```

ReAct 是基础，其他范式都是在 ReAct 循环上加机制：
- **Plan-and-Execute**：在 ReAct 前加一个“规划阶段”，先制定完整计划再执行
- **Reflexion**：在 ReAct 失败后加一个“反思阶段”，复盘错误再重试
- **LangGraph**：把 ReAct 循环建模为有向图，支持更复杂的控制流

---

## 四、最小可运行代码

### 手写 ReAct 循环（最基础实现）

```python
import os
from openai import OpenAI
import json

# 用自己的 provider 跑通本示例（任何 OpenAI 兼容接口均可）：
#   export OPENAI_API_KEY=sk-xxx        # 你的 key
#   export OPENAI_BASE_URL=https://...  # 接口地址（用 openai 官方可省略）
#   export LLM_MODEL=doubao-pro-32k     # 模型名，按你的 provider 填
client = OpenAI()  # 自动读取 OPENAI_API_KEY / OPENAI_BASE_URL
MODEL = os.environ["LLM_MODEL"]

# 工具定义
def search(query: str) -> str:
    """搜索网络信息"""
    return f"搜索结果：{query} 的相关信息..."

TOOLS = {"search": search}

# ReAct Prompt（含 few-shot 示例）
REACT_PROMPT = """你是一个 ReAct Agent。按以下格式思考和行动：

Thought: 你的思考
Action: 工具名["参数"]
Observation: 工具返回的结果
...（重复 Thought/Action/Observation）
Thought: 我已经有足够信息回答了
Action: finish["最终答案"]

可用工具：search(query) - 搜索网络信息

现在开始：
Question: {question}
"""

def react_agent(question: str, max_steps: int = 10):
    messages = [{"role": "user", "content": REACT_PROMPT.format(question=question)}]

    for step in range(max_steps):
        resp = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0
        )
        thought_action = resp.choices[0].message.content
        messages.append({"role": "assistant", "content": thought_action})

        # 解析 Action
        if "Action: finish[" in thought_action:
            # 任务完成
            answer = thought_action.split('Action: finish["')[1].split('"]')[0]
            return answer

        if "Action:" in thought_action:
            # 提取工具名和参数
            action_str = thought_action.split("Action:")[1].strip()
            tool_name = action_str.split("[")[0].strip()
            tool_args = action_str.split("[")[1].rstrip("]").strip('"')

            # 执行工具
            if tool_name in TOOLS:
                observation = TOOLS[tool_name](tool_args)
            else:
                observation = f"错误：未知工具 {tool_name}"

            messages.append({"role": "user", "content": f"Observation: {observation}"})
        else:
            # 没有 Action，模型可能在继续思考，追加提示
            messages.append({"role": "user", "content": "请输出 Action 或 finish。"})

    return "错误：超过最大步数"

# 使用
answer = react_agent("苹果公司当前市盈率高于消费电子行业中位数吗？")
print(answer)
```

### 用 LangGraph 实现 ReAct（生产级）

```python
# ChatOpenAI 自动读取 OPENAI_API_KEY / OPENAI_BASE_URL（沿用上节 env 三件套）
import os
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langchain_openai import ChatOpenAI
from typing import TypedDict, List
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    messages: List[BaseMessage]

llm = ChatOpenAI(model=os.environ["LLM_MODEL"]).bind_tools([search_tool])

def agent_node(state):
    """ReAct 的 Thought + Action 步骤"""
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state):
    """判断是否继续循环（ReAct 的循环控制）"""
    last_message = state["messages"][-1]
    # 有 tool_calls 就继续（Action），没有就结束（Finish）
    return "tools" if last_message.tool_calls else END

def tool_node(state):
    """ReAct 的 Observation 步骤：执行工具，返回结果"""
    outputs = []
    for tool_call in state["messages"][-1].tool_calls:
        result = search_tool.invoke(tool_call)
        outputs.append(ToolMessage(content=str(result), tool_call_id=tool_call.id))
    return {"messages": outputs}

# 构建 ReAct 图
graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)   # Thought + Action
graph.add_node("tools", tool_node)     # Observation
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue)  # 循环控制
graph.add_edge("tools", "agent")        # Observation 后回到 Thought
app = graph.compile()

# 运行 ReAct Agent
result = app.invoke({"messages": [HumanMessage(content="苹果市盈率高于行业中位数吗？")]})
print(result["messages"][-1].content)
```

### ReAct 的可视化循环（LangGraph）

```
     ┌─────────┐
     │  agent  │ ← Thought + Action（模型推理+声明工具调用）
     └────┬────┘
          │
    ┌─────┴──────┐
    │ 有 tool_calls? │
    └─────┬──────┘
     是   │   否
     ↓    │    ↓
┌─────────┐  END（Finish，输出最终答案）
│  tools  │ ← Observation（执行工具+返回结果）
└────┬────┘
     │
     └────→ 回到 agent（继续 ReAct 循环）
```

---

## 五、易混对比表

| 维度 | CoT（思维链） | Act-only（只行动） | ReAct（推理+行动） |
|------|--------------|------------------|-------------------|
| **核心** | 只推理，不行动 | 只行动，不推理 | 推理+行动交替 |
| **外部工具** | 无 | 有 | 有 |
| **推理过程** | 显式（写出来） | 无（盲目行动） | 显式（Thought） |
| **幻觉率** | 高（无外部验证） | 中（行动但不规划） | 低（行动锚定推理） |
| **规划能力** | 有（但不执行） | 无 | 有（Thought 指导 Action） |
| **适用场景** | 纯逻辑推理、数学题 | 简单工具调用 | 复杂任务、需要外部信息 |
| **ALFWorld 成功率** | 58.1% | 68.0% | **71.0%** |
| **类比** | 闭卷考试 | 只会翻书不会想 | 开卷考试，想一步查一步 |

| 维度 | ReAct | Plan-and-Execute | Reflexion |
|------|-------|-----------------|-----------|
| **规划方式** | 边做边想（动态规划） | 先整体规划再执行 | ReAct + 失败后反思 |
| **循环结构** | Thought→Action→Observation | Plan→Execute→Replan | ReAct→Reflect→Retry |
| **灵活性** | 高（随时调整计划） | 中（计划可能过时） | 高（从错误中学习） |
| **计算开销** | 低 | 中（多一次规划调用） | 高（多一次反思调用） |
| **适用场景** | 通用任务 | 步骤明确的复杂任务 | 容易失败的困难任务 |
| **代表框架** | LangGraph 基础循环 | LangChain Plan-and-Execute | Reflexion 论文实现 |

| ReAct 组件 | 作用 | 不做会怎样 |
|-----------|------|-----------|
| Thought（思考） | 工作记忆、规划、跟踪进度 | 模型“健忘”，忘了之前在做什么，盲目调用工具 |
| Action（行动） | 与外部环境交互，获取真实信息 | 模型只能靠记忆，容易幻觉 |
| Observation（观察） | 用真实结果锚定推理 | 模型在错误假设上继续推理，越走越偏 |
| 循环控制 | 决定何时停止 | 死循环或过早停止 |

---

## 六、3 个实战坑

### 坑 1：Thought 写得太长太啰嗦，浪费 token 且降低速度

**现象**：ReAct Agent 每一步的 Thought 都写一大段（“首先我需要分析这个问题的各个方面，然后考虑可能的解决方案……”），结果一次任务跑了 10 步，每步 Thought 就有 200 token，总共浪费了 2000+ token，速度还慢。

**避坑**：
- **Thought 要简洁，只写关键信息**：“需要查苹果市盈率” 比 “我需要仔细分析这个问题，首先应该查询苹果公司的当前市盈率数据” 好
- **在 system prompt 中约束 Thought 长度**：“Thought 请保持在 1-2 句话，只写关键推理和下一步计划，不要重复问题或写废话。”
- **用更结构化的 Thought**：如“计划：1.查苹果PE 2.查行业中位数 3.比较；当前：第1步”
- **考虑是否真的需要 Thought**：对于简单工具调用（如“现在几点”），可以直接 Action 不需要 Thought，用 `tool_choice` 强制模型直接调工具
- **监控 Thought 长度**：统计每步 Thought 的 token 数，超过阈值就优化 prompt

### 坑 2：ReAct 循环陷入死循环，模型反复调用同一个工具

**现象**：模型反复调用搜索工具，每次换个关键词但都得不到想要的结果，循环了 15 次还没停止，token 消耗巨大。

**原因**：
- 工具返回的结果不包含模型需要的信息，但模型不知道“该换个方法”或“该放弃”
- 没有设置最大步数限制
- Thought 没有记录“已经试过什么方法”，导致重复尝试

**避坑**：
- **必须设置最大步数**：`max_steps=10`，超过后强制结束并返回当前结果
- **在 Thought 中记录已尝试的方法**：“已经试过搜索'苹果市盈率'和'Apple PE ratio'，都没有返回 2026 年数据。可能需要换用财务数据 API。”
- **检测重复模式**：如果连续 3 次调用同一个工具+相似参数，提前终止并提示“该工具无法解决此问题，请尝试其他方法或直接回答”
- **给模型“放弃”的选项**：在工具列表中加一个 `give_up` 工具，让模型在无法解决时主动放弃并说明原因
- **设置 token 预算上限**：总 token 消耗超过阈值时强制结束

### 坑 3：Observation 内容太长，把上下文窗口撑爆，模型“失忆”

**现象**：工具返回了一大段内容（如搜索结果返回了 10 篇文章，每篇 500 字），3 步之后上下文窗口就满了，模型开始忘记最早的 Thought 和用户问题，回答跑偏。

**避坑**：
- **工具返回结果要截断**：搜索结果只返回前 3 条，每条截断到 200 字
- **用上下文压缩**：在 Observation 注入前，用 LLM 提取与当前问题相关的句子，丢弃无关内容
- **用摘要代替原文**：对长文档工具返回，先生成摘要再注入
- **用滑动窗口**：只保留最近 N 步的完整 Observation，更早的只保留 Thought（压缩历史）
- **用 LangGraph 的 Checkpointer**：持久化状态，上下文满了可以从检查点恢复
- **选择长上下文模型**：如 GPT-4o（128K）、Claude 3.5 Sonnet（200K），给更多缓冲空间
- **关键信息写入 Thought**：把关键数据（如“苹果PE=28.5”）显式写入下一步的 Thought，确保不被窗口截断丢掉

---

## 七、进阶问题（引导往下挖）

### 问题 1：ReAct 的 Thought 是“真的在思考”吗？还是只是“看起来在思考”？

**引导思考**：
- **从机制上看**：Thought 只是模型生成的一段文本，和其他生成内容没有本质区别。模型不会“真的”在脑子里推理，它只是预测“在这个上下文里，下一个合理的 Thought 是什么”
- **但从效果上看**：把推理过程显式写出来（Thought）确实能提升准确率——这就是 CoT（思维链）的核心发现。原因是：①显式推理分解了问题，降低了每步的难度；②Thought 作为“工作记忆”跨步骤保持上下文；③Thought 让模型的推理过程可观测、可干预
- **关键区别**：人类的思考是“内部心理过程”，ReAct 的 Thought 是“外部文本痕迹”。但对于解决问题来说，效果是一样的——就像你做数学题时在草稿纸上写步骤，草稿纸不是“你的大脑”，但写步骤确实能帮你做对
- **哲学问题**：这引出了“LLM 是否真的理解”的大讨论。一派认为“只要行为上像思考就是思考”（功能主义），另一派认为“没有意识就不是真思考”（意识主义）。对于工程师来说，我们不关心哲学，只关心效果——ReAct 确实比 CoT 效果好，这就够了
- 延伸：后续知识点（CoT/ToT/GoT 思维链）会深入讲解各种推理范式的区别和适用场景

### 问题 2：ReAct 是 2022 年提出的，现在（2026 年）还适用吗？有没有被新范式取代？

**引导思考**：
- **ReAct 没有被取代，而是成为了“基础设施”**：就像 HTTP 协议是 1991 年提出的，但现在所有 Web 应用都还在用。ReAct 循环是 Agent 的“HTTP”——几乎所有现代 Agent 框架的底层都是 ReAct 循环
- **2026 年的演进是“在 ReAct 上加机制”，而不是“取代 ReAct”**：
  - **Plan-and-Execute**：在 ReAct 前加规划阶段
  - **Reflexion**：在 ReAct 失败后加反思阶段
  - **Multi-Agent**：多个 Agent 各自跑 ReAct 循环，互相协作
  - **LangGraph**：把 ReAct 循环建模为有向图，支持更复杂的控制流（条件分支、并行、人工审批节点）
  - **Agentic RAG**：在 ReAct 循环中动态决定检索什么、检索几次
- **为什么 ReAct 这么持久**：因为它抓住了 Agent 的本质——“感知→推理→行动→观察”的循环。这个循环是生物智能（人类、动物）解决问题的基本模式，也是人工智能的基本模式。只要 Agent 还需要“与环境交互”，ReAct 循环就不会过时
- **可能的未来演进**：
  - **神经符号 ReAct**：把符号推理（逻辑、规划）和神经网络推理结合
  - **多模态 ReAct**：Thought 不只是文本，还可以是图像、代码、图表
  - **终身学习 ReAct**：Agent 从过去的 ReAct 轨迹中学习，优化未来的推理策略
  - **但核心循环不变**：还是 Thought→Action→Observation
- 延伸：后续知识点（Agentic Workflow 编排、生产级 Agent 架构设计）会深入讲解如何在 ReAct 基础上构建更复杂的 Agent 系统

---

## 八、四关自测

### 复述关（3句话讲清）
1. ReAct = Reasoning + Acting，模型在循环里交替输出 Thought（思考）→ Action（调工具）→ Observation（看结果）→ 再 Thought，直到给出答案。
2. 它治的是 CoT 的幻觉病：CoT 只在脑子里推、不接触外部世界容易瞎编；ReAct 每步都用真实工具结果锚定推理，论文里 ALFWorld 成功率从 58% 提到 71%。
3. 它是几乎所有现代 Agent 框架（LangGraph/AutoGen/CrewAI）的底层循环，Plan-and-Execute、Reflexion、Multi-Agent 都是在这个循环上叠加机制。

### 举例关（真实场景）
用户问“苹果当前市盈率高于消费电子行业中位数吗”。CoT 会凭记忆瞎答“大概25倍、行业20倍，高于”；ReAct 会先 Thought 拆成三步→Action 搜苹果PE（Observation=28.5）→再 Thought 缺行业数据→Action 搜行业中位数（Observation=18.2）→最后 Thought 比较 28.5>18.2 给出带真实数字的答案。

### 反例关（边界条件）
ReAct 不等于万能：Thought 写得又臭又长会白白烧 token；不设 max_steps 模型会反复搜同一个关键词死循环；工具一次返回10篇长文会把上下文窗口撑爆、模型忘了最初问题。它解决的是“需要外部信息的多步任务”，纯数学逻辑题用 CoT 更省。

### 教学关（给小白讲）
CoT 像闭卷考试，只在脑子里算，记不清就瞎编。ReAct 像开卷考试的聪明学生：想一步、翻一下书、把看到的抄下来、再想下一步。他不一次把书全翻完，而是“需要什么查什么”，每一步答案都有书里的真实内容撑着，所以不容易胡说。所有现在的 AI 助手，骨子里都是这个“想一步做一步”的循环。

---

## 资料来源

- 论文: [Yao et al., ReAct: Synergizing Reasoning and Acting in Language Models, arXiv:2210.03629](https://arxiv.org/pdf/2210.03629.pdf)
- 官方项目: [ReAct 官方项目页](https://react-lm.github.io/)
- 百科: [AI Wiki - ReAct (prompting)](https://aiwiki.ai/wiki/react_prompting)
- 技术博客: [Future AGI - ReAct Agent Loop: How Reason-and-Act Agents Actually Work](https://futureagi.com/blog/loop-engineering/react-agent-loop/)
- 技术博客: [Prakash Kagitha - The Agentic Loop: ReAct, Plan-Execute & Reflection](https://prakashkagitha.github.io/llm-stack-book/08-agents-harness/02-agentic-loop.html)
- 技术博客: [Agent Brisk - Chain of Thought vs ReAct](https://agentbrisk.com/blog/chain-of-thought-vs-react/)
- 技术博客: [Agent Brisk - The ReAct Pattern Explained](https://agentbrisk.com/blog/react-pattern-explained/)
- 技术博客: [腾讯云 - 智能体决策机制深度剖析：ReAct、Plan-and-Execute与自适应策略](https://cloud.tencent.com/developer/article/2540118)
- 技术博客: [CSDN - 论文学习《ReAct: 在大语言模型中协同推理与行动》](https://blog.csdn.net/Revivedsun/article/details/159356001)
- 教学文档: [Scaler - Reasoning & Planning In Agentic AI](https://www.scaler.com/topics/agentic-ai/reasoning-in-agentic-ai/)
- 技术博客: [Research Rudrite - ReAct Reason + Act](https://research.rudrite.com/react)
- 技术博客: [SegmentFault - 万字长文背诵最新 Agent 常见试题](https://segmentfault.com/a/1190000047756432)
