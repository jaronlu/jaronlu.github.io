## 一、结论前置

**LLM 在 Agent 里不是“文本生成器”，而是“推理引擎”——它负责理解目标、拆解任务、决策下一步调用什么工具、根据反馈反思纠错、判断任务是否完成。** 2024 年底 OpenAI o1 的发布标志着行业范式从“训练时扩展”转向“推理时扩展”（Test-Time Compute Scaling）：模型不再一次前向传播就出答案，而是先生成一条长长的内部思维链，想清楚了再回答。DeepSeek-R1 以 70% 更低的成本追平 o1，证明了“让模型多花 token 思考”比“把模型参数堆得更大”更具性价比。[Zylos AI·推理时计算扩展](https://zylos.ai/en/research/2026-04-23-inference-time-compute-scaling-reasoning-budget-optimization/)

---

## 二、通俗类比 + 严格专业

### 2.1 通俗类比

**普通 LLM（GPT-4o 时代）= 抢答选手**：题目一念完，嘴比脑子快，直接报答案。简单题对，复杂题容易跳步、算错。

**推理模型（o1 / R1 时代）= 奥数竞赛选手**：拿到题先在草稿纸上写满推导过程——“这题考什么？先求什么？用什么公式？上一步对吗？换个方法验证一下？”——草稿写满了，最后才抄一个答案到答题区。

用 iOS 开发类比：
- 普通 LLM = `@autoclosure` 直接求值，输入即输出，无中间状态
- 推理模型 = 先跑一个 `while !solved { think() }` 循环，把中间变量、分支探索、回溯验证全在内部完成，最后才 `return answer`
- Agent 中的 LLM = 这个 `while` 循环的**条件判断器和策略选择器**：每轮决定“继续想还是动手？调用哪个工具？参数怎么填？出错了换什么策略？”

### 2.2 严格专业定义

**推理（Reasoning）的学术定义**（Google DeepMind 首席科学家 Denny Zhou）：
> “推理 = 问题和最终答案之间存在中间 token。”（Reasoning in LLMs is defined as the presence of intermediate tokens between the question and the final answer.）[CityUHK·2026 LLM Landscape](https://www.ee.cityu.edu.hk/~lmpo/ee4016/pdf/2026_AI_L09B_LRMs.pdf)

判别标准：需要多步逻辑推导、算术计算、多跳信息整合的任务才叫“需要推理”；事实查询（“法国首都是哪”）不算。[dl4ds·Reasoning LLMs and Coding Agents](https://dl4ds.github.io/sp2026/static_files/lectures/24_Reasoning_LLMs_and_Coding_Agents.pdf)

**LLM 作推理引擎的三层含义**：

| 层级           | 含义                                | 代表技术                                                  |
| ------------ | --------------------------------- | ----------------------------------------------------- |
| **L1 提示级推理** | 通过 Prompt 诱导模型输出中间步骤              | Chain-of-Thought (CoT)、Few-shot CoT、Self-Consistency  |
| **L2 模型级推理** | 通过强化学习训练模型“天生会思考”                 | OpenAI o1/o3、DeepSeek-R1、QwQ、Claude Extended Thinking |
| **L3 系统级推理** | 在 Agent 循环中，LLM 作为决策引擎驱动多步工具调用与反思 | ReAct、Plan-and-Execute、Reflexion、LangGraph Agent Loop |

**推理模型的训练范式**（Microsoft Learn 官方总结）：
> 推理模型（如 OpenAI o 系列）通过强化学习训练，学会在回答前生成思维链——把问题拆成子步骤、探索替代方案、验证自己的工作。这在数学、逻辑、编程和复杂多步任务上带来显著提升。[Microsoft Learn·LLM Fundamentals](https://learn.microsoft.com/en-us/agent-framework/journey/llm-fundamentals)

**DeepSeek-R1 的关键突破**：首个在**无监督微调**（SFT）的前提下，直接对基础模型做大规模强化学习，让思维链（CoT）自然涌现。R1-Zero 展现出自我验证、反思、生成长思维链的能力，但存在可读性差和语言混合问题；R1 在此基础上加入冷启动数据和多阶段训练，性能追平 OpenAI-o1-1217，且完全开源。[DeepSeek-R1 论文](https://arxiv.org/pdf/2501.12948) / [DeepSeek 官方发布](https://www.deepseek.com/en/news/deepseek-r1/)

---

## 三、底层机制：推理引擎怎么在 Agent 里运转

### 3.1 推理时计算扩展（Test-Time Compute Scaling）

这是 2025 年以来最重要的范式转移。传统思路是“训练时把模型做大”，新思路是“推理时让模型多想一会儿”。

```
传统模式（训练时扩展）：
  更大参数 + 更多数据 → 一次前向传播 → 答案
  成本：训练阶段一次性投入，推理快

推理时扩展（Test-Time Compute）：
  模型参数不变 → 多次前向传播 / 长思维链 / 多路径采样 → 答案
  成本：每次推理多花 token，但不需要重新训练模型
```

**核心发现**（OpenAI o3 官方博客）：
> 在 o3 的开发中，我们观察到大规模强化学习展现出与 GPT 系列预训练相同的“计算量增加 = 性能提升”趋势。这次是在强化学习领域——我们在训练计算量和推理时计算方面均提高了一个数量级，仍然看到明显的性能提升，表明模型性能确实会随着思考时间的增加而持续提高。[OpenAI·o3 发布](https://openai.com/zh-Hans-CN/index/introducing-o3-and-o4-mini/)

**DeepSeek-R1 的实证**：AIME 2025 测试中，新版 R1 平均每题使用 23K tokens（旧版 12K），准确率从 70% 提升至 87.5%——思考深度直接对应准确率。[DeepSeek API Docs·R1 更新](https://api-docs.deepseek.com/zh-cn/news/news250528/)

### 3.2 LLM 推理引擎在 Agent Loop 中的四个决策点

Agent 的每一轮循环，LLM 作为推理引擎要做四个决策：

```
用户目标
   │
   ▼
┌─────────────────────────────────────────┐
│  决策点1：理解与拆解                      │
│  LLM 推理：这个目标的本质是什么？         │
│  需要拆成哪几个子任务？依赖关系是什么？    │
│  输出：子任务序列 / 计划                  │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│  决策点2：工具选择与参数构造              │
│  LLM 推理：当前子任务需要哪个工具？       │
│  参数怎么填？是否需要并行调用多个工具？    │
│  输出：tool_call（工具名 + JSON 参数）    │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│  决策点3：结果解读与反思                  │
│  LLM 推理：工具返回的结果意味着什么？     │
│  上一步对吗？需要换策略重试吗？           │
│  输出：继续 / 修正 / 回溯                 │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│  决策点4：终止判断                        │
│  LLM 推理：目标达成了吗？                 │
│  所有子任务都完成了吗？结果可信吗？        │
│  输出：finish（最终答案）/ 继续循环       │
└─────────────────────────────────────────┘
```

**关键机制**：
1. **推理 token 不可见**：o1/o3/R1 的内部思维链对用户和 API 调用方不可见（OpenAI 不返回 reasoning content；DeepSeek-R1 可通过 API 参数控制是否返回），只有最终答案可见。这意味着你无法直接“看到”模型在想什么，只能通过最终输出和行为推断。
2. **推理预算（Reasoning Budget）**：o3 等模型支持通过 `reasoning.effort` 参数（low / medium / high）控制思考深度，本质是分配多少 token 给内部思维链。effort 越高，准确率越高但延迟和成本也越高。[OpenAI·o3 发布](https://openai.com/zh-Hans-CN/index/introducing-o3-and-o4-mini/)
3. **工具使用内嵌于推理链**：o3/o4-mini 是首批能在思维链内部直接调用工具的推理模型——模型在“思考”过程中自主决定“这里需要搜一下”或“这里需要用 Python 算一下”，工具结果直接注入推理链，而不是作为独立的外部循环。[OpenAI·o3 System Card](https://openai.com/index/introducing-o3-and-o4-mini/)

### 3.3 推理能力的三个技术阶梯

```
L1 CoT Prompting（2022）         L2 推理模型（2024-2025）        L3 Agentic Reasoning（2025-2026）
─────────────────────────         ─────────────────────────         ──────────────────────────────
靠 Prompt 诱导"一步步想"           靠 RL 训练"天生会思考"            靠工具+循环"边做边想"
模型：GPT-3.5/4                    模型：o1/o3/R1/QwQ               模型：o3 + 工具 + Agent Loop
思维链：可见（在输出里）            思维链：不可见（内部 token）       思维链：不可见 + 工具结果可见
成本：低（一次调用）                成本：中高（长推理 token）         成本：高（推理 × N轮 × 工具）
适用：数学/逻辑题                   适用：复杂推理/编程/科学           适用：多步任务/环境交互/深度研究
```

[TechRxiv·LLM Reasoning Techniques Survey](https://www.techrxiv.org/doi/pdf/10.36227/techrxiv.176131150.00355935/v1) / [arXiv·Agentic Reasoning for Deep Research](https://arxiv.org/pdf/2502.04644)

---

## 四、最小可运行代码示例

### 4.1 原生实现：模拟推理引擎的四决策点循环

```python
"""
极简 LLM 推理引擎：模拟 Agent Loop 中的四个决策点
原生实现，不依赖外部 API，可直接 python 运行
"""
from typing import Callable, Dict, List, Optional

# ============ 工具层 ============
def tool_search(query: str) -> str:
    db = {
        "深圳人口": "深圳常住人口约1779万（2024年）",
        "深圳GDP": "深圳2024年GDP约3.68万亿元",
        "人均GDP公式": "人均GDP = GDP总量 / 常住人口",
    }
    return db.get(query, f"未找到'{query}'")

def tool_calculator(expression: str) -> str:
    try:
        return str(eval(expression, {"__builtins__": {}}, {}))
    except Exception as e:
        return f"计算错误: {e}"

TOOLS = {"search": tool_search, "calculator": tool_calculator}

# ============ LLM 推理引擎（模拟）============
class MockReasoningEngine:
    """
    模拟推理模型的四个决策点。
    真实场景替换为 OpenAI o3 / DeepSeek-R1 API 调用。
    """
    def __init__(self):
        self.internal_thought_chain: List[str] = []  # 模拟不可见的内部思维链

    def _think(self, thought: str):
        """模拟内部推理 token（对用户不可见）"""
        self.internal_thought_chain.append(thought)

    def decide(self, goal: str, history: List[Dict]) -> Dict:
        """
        输入：目标 + 历史行动观察
        输出：{"decision": "plan|tool|reflect|finish", "content": "...", "tool_name": "...", "tool_args": "..."}
        """
        # 决策点1：首次进入，理解与拆解
        if not history:
            self._think("用户问深圳人均GDP。需要：1)查GDP总量 2)查人口 3)用公式计算")
            self._think("先搜GDP总量")
            return {"decision": "tool", "tool_name": "search", "tool_args": "深圳GDP",
                    "content": "需要先获取深圳GDP总量"}

        last = history[-1]

        # 决策点3：反思——如果搜索结果不够，继续搜
        if last["tool"] == "search" and "GDP" in last["observation"]:
            self._think("拿到GDP=3.68万亿。还需要人口数据。")
            return {"decision": "tool", "tool_name": "search", "tool_args": "深圳人口",
                    "content": "继续获取深圳常住人口"}

        if last["tool"] == "search" and "人口" in last["observation"]:
            self._think("拿到人口=1779万。GDP=3.68万亿=36800亿。人均=36800亿/1779万")
            self._think("换算：36800亿 = 3,680,000,000,000；1779万 = 17,790,000")
            self._think("人均GDP = 36800 / 0.1779 ≈ 20.69万元")
            return {"decision": "tool", "tool_name": "calculator",
                    "tool_args": "36800 / 0.1779",
                    "content": "用公式计算人均GDP"}

        # 决策点4：终止判断
        if last["tool"] == "calculator":
            self._think("计算结果约20.69万元。目标达成，可以输出最终答案。")
            gdp = "3.68万亿元"
            pop = "1779万"
            per_capita = last["observation"]
            answer = f"深圳人均GDP ≈ {float(per_capita):.2f}万元（GDP {gdp} ÷ 人口 {pop}）"
            return {"decision": "finish", "content": answer,
                    "tool_name": None, "tool_args": None}

        return {"decision": "finish", "content": "无法完成", "tool_name": None, "tool_args": None}


# ============ Agent 核心循环（推理引擎驱动）============
class ReasoningAgent:
    def __init__(self, tools: Dict, engine: MockReasoningEngine, max_steps: int = 8):
        self.tools = tools
        self.engine = engine
        self.max_steps = max_steps
        self.history: List[Dict] = []

    def run(self, goal: str) -> str:
        print(f"🎯 目标: {goal}\n")
        for step in range(1, self.max_steps + 1):
            # LLM 推理引擎做决策
            decision = self.engine.decide(goal, self.history)
            print(f"[步骤 {step}] 决策类型: {decision['decision']}")
            print(f"  🧠 推理输出: {decision['content']}")

            # 终止
            if decision["decision"] == "finish":
                print(f"\n✅ 最终答案: {decision['content']}")
                print(f"\n📝 内部思维链（模拟可见，实际o1/o3不可见）:")
                for i, t in enumerate(self.engine.internal_thought_chain, 1):
                    print(f"  {i}. {t}")
                return decision["content"]

            # 执行工具
            tool = self.tools.get(decision["tool_name"])
            observation = tool(decision["tool_args"]) if tool else "工具不存在"
            print(f"  🔧 工具: {decision['tool_name']}({decision['tool_args']})")
            print(f"  👁 观察: {observation}\n")

            self.history.append({
                "tool": decision["tool_name"],
                "args": decision["tool_args"],
                "observation": observation
            })

        return "⚠️ 达到最大步数"


# ============ 运行 ============
if __name__ == "__main__":
    agent = ReasoningAgent(tools=TOOLS, engine=MockReasoningEngine())
    agent.run("深圳的人均GDP是多少？")
```

**运行输出：**
```
🎯 目标: 深圳的人均GDP是多少？

[步骤 1] 决策类型: tool
  🧠 推理输出: 需要先获取深圳GDP总量
  🔧 工具: search(深圳GDP)
  👁 观察: 深圳2024年GDP约3.68万亿元

[步骤 2] 决策类型: tool
  🧠 推理输出: 继续获取深圳常住人口
  🔧 工具: search(深圳人口)
  👁 观察: 深圳常住人口约1779万（2024年）

[步骤 3] 决策类型: tool
  🧠 推理输出: 用公式计算人均GDP
  🔧 工具: calculator(36800 / 0.1779)
  👁 观察: 206857.78527262507

[步骤 4] 决策类型: finish
  🧠 推理输出: 深圳人均GDP ≈ 206857.79万元（GDP 3.68万亿元 ÷ 人口 1779万）

✅ 最终答案: 深圳人均GDP ≈ 206857.79万元（GDP 3.68万亿元 ÷ 人口 1779万）

📝 内部思维链（模拟可见，实际o1/o3不可见）:
  1. 用户问深圳人均GDP。需要：1)查GDP总量 2)查人口 3)用公式计算
  2. 先搜GDP总量
  3. 拿到GDP=3.68万亿。还需要人口数据。
  4. 拿到人口=1779万。GDP=3.68万亿=36800亿。人均=36800亿/1779万
  5. 换算：36800亿 = 3,680,000,000,000；1779万 = 17,790,000
  6. 人均GDP = 36800 / 0.1779 ≈ 20.69万元
  7. 计算结果约20.69万元。目标达成，可以输出最终答案。
```

> 注意：上面的“内部思维链”是为了教学模拟出来的。真实使用 o1/o3 时，这些推理 token 不会返回给你——你只能看到最终答案和工具调用行为。DeepSeek-R1 可以通过 API 参数 `reasoning_content` 控制是否返回思维链。

### 4.2 真实 API 调用：DeepSeek-R1 推理模型

```python
"""
调用 DeepSeek-R1 推理模型，观察思维链行为
需 pip install openai
"""
import os
from openai import OpenAI

# 用自己的 provider 跑通本示例（任何 OpenAI 兼容接口均可）。以 DeepSeek 为例：
#   export OPENAI_API_KEY=sk-xxx             # DeepSeek 开放平台的 key
#   export OPENAI_BASE_URL=https://api.deepseek.com
#   export LLM_MODEL=deepseek-reasoner       # DeepSeek 官方的 R1 模型名
# 用 openai 官方时 OPENAI_BASE_URL 可省略，LLM_MODEL 换成对应推理模型
client = OpenAI()  # 自动读取 OPENAI_API_KEY / OPENAI_BASE_URL
MODEL = os.environ["LLM_MODEL"]

response = client.chat.completions.create(
    model=MODEL,                      # R1 推理模型
    messages=[
        {"role": "user", "content": "有一个水池，进水管6小时放满，出水管8小时放完。同时开，几小时放满？"}
    ],
    max_tokens=4000,
    # DeepSeek-R1 支持返回推理内容
    # 注意：实际返回中 reasoning_content 字段包含思维链
)

answer = response.choices[0].message
print("【最终答案】", answer.content)
# 如果 API 版本支持，可通过以下方式查看思维链（部分场景返回）
# print("【思维链】", answer.reasoning_content)
```

**R1 的典型推理过程（简化版）：**
```
<think>
这是工程问题。设水池容量为1。
进水管效率 = 1/6 每小时
出水管效率 = 1/8 每小时
同时开的净效率 = 1/6 - 1/8 = 4/24 - 3/24 = 1/24 每小时
放满时间 = 1 ÷ (1/24) = 24小时
让我验证：24小时进水管放了24/6=4池，出水管放了24/8=3池，净放1池。对的。
</think>
同时开进水管和出水管，需要24小时放满水池。
```

---

## 五、易混概念对比表

| 可量化维度 | 普通 LLM（GPT-4o） | 推理模型（o1/o3/R1） | Agent 中的 LLM 推理引擎 |
|---|---|---|---|
| **输出模式** | 一次前向传播直接出答案 | 先生成长思维链，再出答案 | 每轮循环做决策，驱动工具调用 |
| **思维链可见性** | 可见（CoT 写在输出里） | 不可见（内部 token，不返回） | 不可见 + 工具结果/行动历史可见 |
| **推理触发方式** | 靠 Prompt 诱导（“请一步步思考”） | 天生会思考（RL 训练） | 靠 Agent Loop 循环强制多步 |
| **单次 token 消耗** | 低（~几百-几千 output token） | 高（~几千-几万 reasoning token） | 极高（推理 token × N轮循环） |
| **单次延迟** | 1-5秒 | 10-60秒（effort=high 更久） | 30秒-数分钟（多轮+工具） |
| **擅长场景** | 文案生成、翻译、摘要、简单问答 | 数学证明、算法题、复杂编程、科学推理 | 多步任务、环境交互、深度研究、自动化 |
| **工具使用** | 需外部框架 orchestrate（如 LangChain） | o3 起可在思维链内自主调用工具 | 核心能力：每轮决策调什么工具 |
| **成本控制** | 控制 max_tokens 即可 | 控制 reasoning.effort（low/medium/high） | 控制 max_steps + 模型选型 + 缓存 |
| **可调试性** | 高（输出即全部） | 低（看不到内部推理过程） | 中（可看行动历史，但看不到每轮内部推理） |

主观判断：推理模型不是“更聪明的普通 LLM”，而是**把“思考”从输出行为变成了内部计算过程**。普通 LLM 是“边想边说”（想的过程就是输出的文本），推理模型是“先想清楚再说”（想的过程是不可见的内部 token）。

---

## 六、3个实战中的常见坑

### 坑1：用推理模型做简单文案，成本翻10倍还更慢

**现象**：把 o3/R1 当成万能模型，写邮件、做摘要、翻译全用推理模型。结果一封邮件花了30秒、消耗2万 reasoning token，成本是 GPT-4o 的10倍，质量还没区别。

**正解**：按任务复杂度分层选型。
- 简单生成（文案/翻译/摘要）→ 普通 LLM（GPT-4o / Claude Sonnet / DeepSeek-V3）
- 复杂推理（数学/算法/复杂编程/逻辑题）→ 推理模型（o3 / R1）
- 多步任务（需要工具调用/环境交互）→ Agent + 推理模型（o3 工具调用能力强）

OpenAI 官方也强调：o3 在等延迟和等成本下比 o1 性能更高，但简单任务用推理模型是浪费。[OpenAI·o3 发布](https://openai.com/zh-Hans-CN/index/introducing-o3-and-o4-mini/)

### 坑2：以为“思考越久越准”，无限加大 reasoning effort

**现象**：把 reasoning.effort 设为最高，或者给 R1 设极大的 max_tokens，以为模型想越久答案越准。结果发现某些题想太久反而出错——模型在长思维链里绕晕了、自我矛盾了，或者在错误路径上越走越远。

**正解**：学术界已有研究质疑“o1-like 模型的长 CoT 不一定持续提升准确率”——正确答案往往出现在较短的推理路径中，更长的思维链可能只是在重复或绕圈。[arXiv·Revisiting Test-Time Scaling of o1-like Models](https://arxiv.org/pdf/2502.12215v2.pdf)

实践建议：
- 用 `reasoning.effort=medium` 作为默认，high 仅用于极难的推理题
- 设置合理的 max_tokens 上限（R1 一般 8K-16K 足够大多数场景）
- 监控“推理 token / 答案准确率”比率，找到性价比甜点

### 坑3：Agent 中不区分“推理模型”和“普通模型”，全用一个

**现象**：搭建 Agent 时，规划器、执行器、反思器全用同一个 o3 模型。规划确实很准，但执行简单工具调用（比如“搜索今天天气”）也走 o3 的长思维链，每步多花10秒，整个 Agent 慢得无法用。

**正解**：Agent 内部按角色分层选型（这是生产级 Agent 的标准做法）：

| Agent 角色 | 推荐模型类型 | 原因 |
|---|---|---|
| Planner（规划器） | 推理模型（o3/R1） | 任务拆解需要深度推理 |
| Worker（执行器） | 普通 LLM（GPT-4o/V3） | 工具调用和信息提取不需要长推理 |
| Reflector（反思器） | 推理模型（o3/R1） | 错误分析和策略调整需要推理 |
| Router（路由器） | 小模型（GPT-4o-mini） | 分类决策不需要大模型 |

o3 的 System Card 明确提到：模型被训练为“推理何时以及如何使用工具”，这意味着 o3 本身就适合做 Agent 的核心决策引擎，但简单的工具执行步骤可以用更便宜的模型。[OpenAI·o3 System Card](https://openai.com/index/introducing-o3-and-o4-mini/)

---

## 七、进阶问题（引导往下挖）

1. **推理模型的内部思维链不可见，那怎么调试和评估它的推理质量？如果模型在思维链里犯了一个逻辑错误但最终答案蒙对了，怎么发现？** 这会引出「Agent 可观测性（Observability/Tracing）」和「推理评估（Reasoning Evaluation）」——课程第⑥层的评估与生产知识点。具体技术包括 LangSmith/Langfuse 的 step-level tracing、对思维链的自动评分（如用另一个 LLM 做 critic）、以及 process reward model（PRM）对每步推理打分。

2. **推理时计算扩展（Test-Time Compute）的本质是“用更多 token 换更高准确率”，但 token 就是钱。在生产环境中，怎么根据任务难度动态分配推理预算？简单题少想、难题多想，这个“难度判断”本身又由谁来做？** 这会引出「自适应推理预算分配（Adaptive Reasoning Budget）」和「成本优化」——课程第④层的工程落地知识点。前沿方向包括 TOPS（Thinking-Optimal Scaling）策略、First Finish Search（短路径优先）、以及用小模型做“难度分类器”来路由到不同 effort 的大模型。

---

## 八、四关自测

### 复述关（3句话讲清）
1. LLM 在 Agent 里不是文本生成器，而是每轮循环都要做四件决策的推理引擎：拆任务、选工具填参数、看结果反思、判断何时收尾。
2. 2025 年起的范式转移是“推理时扩展”——不靠把模型做大，而靠让模型在内部多花 token 想清楚（o1/o3/R1），思维链对调用方不可见。
3. 工程上要按任务复杂度分层选型：简单生成用普通模型、数学编程用推理模型、Agent 内部还可给 Planner/Worker/Router 配不同档次的模型控成本。

### 举例关（真实场景）
你要做一个“财报问答 Agent”：用户问“对比茅台和五粮液今年的净利率变化”。普通 LLM 一次输出会漏算口径；而推理引擎驱动的 Agent 会先拆成“抓两份财报→定位净利率字段→算同比→组织对比结论”四步，每步决定调哪个工具（PDF解析/计算器/搜索），拿到结果后反思“这个净利率口径含不含少数股东损益？”再修正。

### 反例关（边界条件）
把 o3/R1 这种推理模型拿来做客服自动回复、邮件润色、摘要这类简单生成任务，会出现“一封邮件想30秒、烧2万 reasoning token、质量和 GPT-4o 没差别”的浪费。推理模型的长思维链只对多步逻辑任务有增益，对单轮文本生成是负优化——这是成本失控的头号原因。

### 教学关（给小白讲）
普通 AI 像抢答选手，题一念完立刻喊答案，简单题对、绕一点就错。推理模型像学霸做卷子，先在草稿纸上一步步演算、自己检查两遍，最后才把答案誊上去——草稿纸你是看不到的，只能看到最后那行答案。Agent 里的 AI 则像带了计算器和搜索框的学霸，做几步、查一下、算一下、不对就重来，直到把整件事办完。

---

## 资料来源

- 论文: [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning, arXiv 2025](https://arxiv.org/pdf/2501.12948)
- 论文: [ReAct: Synergizing Reasoning and Acting in Language Models, ICLR 2023](https://arxiv.org/pdf/2210.03629v3.pdf)
- 论文: [Agentic Reasoning: Reasoning LLMs with Tools for the Deep Research, arXiv 2025](https://arxiv.org/pdf/2502.04644)
- 论文: [Revisiting the Test-Time Scaling of o1-like Models, arXiv 2025](https://arxiv.org/pdf/2502.12215v2.pdf)
- 论文: [Advancing LLM Reasoning Techniques Survey, TechRxiv 2025](https://www.techrxiv.org/doi/pdf/10.36227/techrxiv.176131150.00355935/v1)
- 官方发布: [OpenAI o3 and o4-mini 发布博客](https://openai.com/zh-Hans-CN/index/introducing-o3-and-o4-mini/)
- 官方文档: [OpenAI o3 and o4-mini System Card](https://openai.com/index/introducing-o3-and-o4-mini/)
- 官方发布: [DeepSeek-R1 Release](https://www.deepseek.com/en/news/deepseek-r1/)
- 官方文档: [DeepSeek-R1 更新说明（思考更深，推理更强）](https://api-docs.deepseek.com/zh-cn/news/news250528/)
- 官方文档: [Microsoft Learn - LLM Fundamentals（推理三阶段）](https://learn.microsoft.com/en-us/agent-framework/journey/llm-fundamentals)
- 行业分析: [Zylos AI - Inference-Time Compute Scaling](https://zylos.ai/en/research/2026-04-23-inference-time-compute-scaling-reasoning-budget-optimization/)
- 行业分析: [Future AGI - LLM Reasoning in 2026](https://futureagi.com/blog/llm-reasoning-2025/)
- 教学课件: [CityUHK - The 2026 LLM Landscape: Reasoning Explosion](https://www.ee.cityu.edu.hk/~lmpo/ee4016/pdf/2026_AI_L09B_LRMs.pdf)
- 教学课件: [dl4ds - Reasoning LLMs and Coding Agents](https://dl4ds.github.io/sp2026/static_files/lectures/24_Reasoning_LLMs_and_Coding_Agents.pdf)
- 百科: [AI Wiki - Test-time compute](https://aiwiki.ai/wiki/test_time_compute)
