## 一、结论前置

1. **Planning 是 Agent 的“大脑指挥官”——决定先做什么、后做什么、怎么做**。没有规划的 Agent 是“走一步看一步”（ReAct），容易走弯路、漏步骤、陷入死循环。有规划的 Agent 先制定完整计划，再逐步执行，遇到问题还能反思和调整，效率和准确率都更高。
2. **三种核心规划范式**：①**ReAct（边规划边执行）**——想一步做一步，灵活但可能走弯路；②**Plan-and-Execute（先规划后执行）**——先制定完整步骤列表，再逐步执行，稳定但计划可能过时；③**Reflexion（失败后反思重试）**——执行失败后复盘错误原因，存入记忆，下次尝试时避免同样错误。生产环境通常是三者的组合：先 Plan-and-Execute 制定计划，执行中用 ReAct 动态调整，失败后用 Reflexion 反思重试。
3. **规划的两大核心能力是任务分解和自我纠错**。任务分解把复杂目标拆成可执行的子步骤（分治法）；自我纠错在执行后检查结果，发现错误就修正（闭环反馈）。Reflexion 论文实验表明，加入反思后，Agent 在 AlfWorld 任务上的成功率从 75% 提升到 97%，在 HumanEval 代码生成上从 67% 提升到 88%。

---

## 二、通俗类比 + 专业定义

### 通俗类比

#### 没有规划的 Agent（纯 ReAct）= 没做攻略就去旅游
- 到了目的地，“先去哪？”→ 随便走走，看到什么玩什么
- 走了半天发现：景点关门了、绕路了、漏掉了最想去的地方
- 优点：灵活，随时可以改变计划
- 缺点：效率低，容易遗漏，可能走弯路

#### 有规划的 Agent（Plan-and-Execute）= 提前做好旅游攻略
- 出发前：Day1 上午景点A、下午景点B、晚上美食街；Day2...
- 到了目的地，按攻略一步步走
- 优点：高效，不遗漏，时间安排合理
- 缺点：如果景点A临时关门，攻略就过时了，需要调整

#### 会反思的 Agent（Reflexion）= 旅游回来写复盘
- 第一次旅游：景点A关门了，白跑一趟
- 复盘：“以后出发前要先查景点开放时间”
- 存入记忆，下次旅游时：先查开放时间，再安排行程
- 优点：从错误中学习，越做越好

#### 自我纠错 = 旅游中发现走错路了，立刻看地图修正
- 不需要等回来复盘，当下就发现问题、解决问题
- 是执行过程中的实时反馈闭环

### 专业定义

| 概念 | 定义 |
|------|------|
| **Planning（规划）** | Agent 在执行行动前，根据目标和当前状态，生成一系列有序的行动步骤（计划）的过程。包括任务分解、依赖分析、资源分配、进度跟踪。 |
| **Task Decomposition（任务分解）** | 将复杂的高层目标分解为多个简单的、可执行的子任务的过程。基于分治法，每个子任务可以独立完成，子任务的结果组合起来达成总目标。 |
| **Plan-and-Execute（先规划后执行）** | 一种 Agent 架构范式，将规划和执行分离：Planner 模块先生成完整的任务分解（步骤列表），Executor 模块逐步执行每个步骤。计划是一个可审计的文本产物。 |
| **ReAct（边规划边执行）** | 一种 Agent 架构范式，规划和执行交替进行：每一步先思考（Thought），再行动（Action），根据观察（Observation）决定下一步。是动态规划，不需要预先制定完整计划。 |
| **Reflection（反思）** | Agent 在执行后（或失败后），对自己的行为和结果进行事后分析，识别错误、总结经验、生成改进策略的过程。反思结果通常存入记忆，供未来参考。 |
| **Reflexion** | 一种具体的反思框架（Shinn et al., 2023），在 Agent 失败后生成自然语言反思（诊断错误原因+改进建议），存入记忆，下次尝试时将反思作为上下文参考。AlfWorld 成功率 75%→97%。 |
| **Self-Correction（自我纠错）** | Agent 在执行过程中或执行后，检查结果是否正确，发现错误时自动修正的能力。是实时的闭环反馈，不需要等到任务完全失败。 |
| **Plan Verification（计划验证）** | 在执行前或执行中，用 Judge LLM 评审计划或行动序列的合理性，识别遗漏、矛盾、不相关的步骤，并指导 Planner 修正。 |

---

## 三、底层机制

### 一、任务分解（Task Decomposition）

```
高层目标："帮我做一个用户登录功能"
    ↓ 任务分解
子任务1：设计数据库表结构（用户表：id/username/password_hash/email/created_at）
子任务2：编写注册接口（POST /register，参数校验，密码加密，写入数据库）
子任务3：编写登录接口（POST /login，验证密码，生成 JWT token）
子任务4：编写前端登录页面（表单+提交+错误提示）
子任务5：编写测试用例（注册成功/失败、登录成功/失败、token 验证）
    ↓
每个子任务独立执行，结果组合起来达成总目标
```

#### 任务分解的方法

| 方法 | 说明 | 适用场景 |
|------|------|---------|
| **自上而下分解** | 从总目标开始，逐层拆分为子目标 | 目标明确的复杂任务 |
| **基于模式分解** | 识别任务类型，套用已知的分解模式 | 常见任务类型（如做网站=前端+后端+数据库） |
| **递归分解** | 子任务仍然复杂时，继续分解 | 非常复杂的任务 |
| **LLM 生成分解** | 用 LLM 根据目标生成步骤列表 | 通用任务，最常用 |
| **人工指定分解** | 开发者预先定义任务模板 | 固定流程的任务 |

#### 好的任务分解的标准
1. **每个子任务可独立执行**：不需要等待其他子任务的结果（有依赖的要标注）
2. **每个子任务有明确的完成标准**：“编写登录接口”→“能通过 curl 测试返回 token”
3. **子任务之间无重叠**：不重复做同一件事
4. **粒度适中**：太粗（“做个网站”）无法执行，太细（“输入用户名”）效率低
5. **覆盖完整**：所有子任务加起来能达成总目标，不遗漏

### 二、Plan-and-Execute（先规划后执行）

```
┌─────────────────────────────────────────────┐
│  Phase 1: Planning（规划阶段）                │
│  用户目标 → Planner LLM → 完整步骤列表        │
│  （步骤1、步骤2、步骤3...，每个步骤含工具和预期输出）│
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Phase 2: Execution（执行阶段）               │
│  逐个执行步骤：                                │
│    步骤1 → 执行 → 结果1                       │
│    步骤2 → 执行 → 结果2                       │
│    ...                                        │
│  （每步执行后检查是否成功，失败则重试或重新规划） │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Phase 3: Synthesis（综合阶段）               │
│  汇总所有步骤的结果 → 生成最终答案             │
└─────────────────────────────────────────────┘
```

#### Plan-and-Execute vs ReAct 的核心区别

| 维度 | ReAct | Plan-and-Execute |
|------|-------|-----------------|
| 规划方式 | 动态（边做边想） | 静态（先想好再做） |
| 计划可见性 | 隐式（Thought 里） | 显式（步骤列表） |
| 灵活性 | 高（随时调整） | 中（计划过时需重新规划） |
| 可审计性 | 低（Thought 可能不完整） | 高（计划是明确的文本） |
| 适用场景 | 探索性任务、不确定环境 | 步骤明确的复杂任务 |
| 典型框架 | LangGraph ReAct | LangChain Plan-and-Execute |

#### Plan-and-Execute 的优势
1. **计划可审计**：用户可以看到 Agent 打算做什么，在执行前干预
2. **减少弯路**：预先规划避免了“走一步看一步”的盲目性
3. **进度可跟踪**：明确知道做到第几步了，还剩几步
4. **失败可定位**：哪一步失败了一目了然

#### Plan-and-Execute 的劣势
1. **计划可能过时**：执行中环境变化（如 API 返回了预期外的数据），原计划不再适用
2. **初始规划成本**：需要一次额外的 LLM 调用来生成计划
3. **不够灵活**：严格按计划执行可能错过更好的路径

**解决方案**：执行中加入“重新规划”机制——当某步失败或环境变化时，回到 Planner 生成更新后的计划。

### 三、Reflexion（反思重试）

```
第1次尝试：
  执行任务 → 失败（测试不通过/结果错误）
    ↓
  反思（Reflection）：
    LLM 分析失败原因："测试失败是因为没有处理空输入的情况，
    函数在 input=None 时抛出了 TypeError"
    生成改进建议："下次应该在函数开头加空值检查"
    ↓
  存入记忆（Memory）：
    "经验：处理用户输入时必须先检查空值，否则会 TypeError"
    ↓
第2次尝试：
  执行任务（带上次的反思作为上下文）→ 成功！
```

#### Reflexion 的完整循环

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  执行     │ →  │  评估     │ →  │  反思     │
│ (Act)    │    │ (Evaluate)│    │ (Reflect) │
└──────────┘    └──────────┘    └────┬─────┘
     ↑                                │
     │                                ↓
     │                          ┌──────────┐
     └────────────────────────  │  记忆     │
        （下次尝试时带上反思）    │ (Memory)  │
                                └──────────┘
```

#### Reflexion 的实验效果（来自原始论文）

| 任务 | 基线（无反思） | Reflexion（有反思） | 提升 |
|------|-------------|-------------------|------|
| AlfWorld（家务决策） | 75% | **97%** | +22% |
| HumanEval（代码生成） | 67% | **88%** | +21% |

#### 反思的内容结构
1. **失败诊断**：哪里出错了？为什么错？
2. **根因分析**：错误的根本原因是什么？（不是表面症状）
3. **改进策略**：下次应该怎么做？具体的行动建议
4. **经验提炼**：从这次失败中学到了什么通用经验？

### 四、自我纠错（Self-Correction）

自我纠错是执行过程中的实时反馈闭环，不需要等到任务完全失败：

```
执行步骤 → 检查结果 → 正确？→ 继续下一步
                ↓ 否
            诊断错误 → 修正 → 重新执行该步骤
                ↓ 多次失败
            重新规划 / 求助用户
```

#### 自我纠错的触发时机
1. **工具返回错误**：API 调用失败、参数错误 → 修正参数重试
2. **结果不符合预期**：工具返回了数据，但 LLM 判断不是想要的 → 换工具或换查询
3. **逻辑矛盾**：当前步骤的结果与之前的结论矛盾 → 回溯检查
4. **进度停滞**：连续多步没有进展 → 重新规划
5. **最终答案检查**：任务完成后，用 Judge LLM 检查答案质量 → 不达标则修正

#### 自我纠错 vs Reflexion 的区别

| 维度 | 自我纠错（Self-Correction） | Reflexion |
|------|---------------------------|-----------|
| 时机 | 执行过程中（实时） | 任务失败后（事后） |
| 范围 | 当前步骤 | 整个任务 |
| 记忆 | 通常不存（即时修正） | 存入长期记忆 |
| 目的 | 修正当前错误 | 从错误中学习，避免下次再犯 |
| 类比 | 走路时发现走错了，立刻掉头 | 旅游回来写复盘，下次提前查攻略 |

### 五、Plan-Act-Reflect 循环（生产级组合）

生产环境通常不是只用一种范式，而是组合使用：

```
┌──────────────────────────────────────────────────┐
│  1. Plan（规划）                                   │
│     生成完整步骤列表（Plan-and-Execute）           │
└──────────────────────┬───────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────┐
│  2. Act（执行）                                    │
│     逐步执行，每步内部用 ReAct 动态调整             │
│     （想一步→做一步→看结果→再想下一步）            │
└──────────────────────┬───────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────┐
│  3. Reflect（反思）                                │
│     每步执行后检查结果：                           │
│     - 成功 → 更新计划，继续下一步                   │
│     - 失败 → 自我纠错（修正当前步骤）              │
│     - 多次失败 → 重新规划（回到 Plan 阶段）        │
│     - 任务完全失败 → Reflexion（深度反思+存记忆）  │
└──────────────────────┬───────────────────────────┘
                       ↓
                  循环直到完成
```

---

## 四、最小可运行代码

### Plan-and-Execute 最简实现

```python
import os
from openai import OpenAI

# 用自己的 provider 跑通本示例（任何 OpenAI 兼容接口均可）：
#   export OPENAI_API_KEY=sk-xxx        # 你的 key
#   export OPENAI_BASE_URL=https://...  # 接口地址（用 openai 官方可省略）
#   export LLM_MODEL=doubao-pro-32k     # 模型名，按你的 provider 填
client = OpenAI()  # 自动读取 OPENAI_API_KEY / OPENAI_BASE_URL
MODEL = os.environ["LLM_MODEL"]

def planner(goal: str) -> list:
    """规划阶段：生成步骤列表"""
    prompt = f"""请将以下目标分解为有序的执行步骤列表。
每个步骤应该具体、可执行、有明确的完成标准。
输出格式：每行一个步骤，以数字开头。

目标：{goal}"""
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    # 解析步骤列表
    steps = [line.strip() for line in resp.choices[0].message.content.split("\n") if line.strip() and line[0].isdigit()]
    return steps

def executor(step: str, context: str) -> str:
    """执行阶段：执行单个步骤"""
    prompt = f"""请执行以下任务步骤。
上下文：{context}
步骤：{step}
请给出执行结果。"""
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def plan_and_execute(goal: str):
    """完整的 Plan-and-Execute 流程"""
    # Phase 1: Planning
    print("=== 规划阶段 ===")
    steps = planner(goal)
    for i, step in enumerate(steps, 1):
        print(f"{i}. {step}")

    # Phase 2: Execution
    print("\n=== 执行阶段 ===")
    context = f"目标：{goal}\n"
    results = []
    for i, step in enumerate(steps, 1):
        print(f"\n执行步骤 {i}: {step}")
        result = executor(step, context)
        print(f"结果：{result[:100]}...")
        results.append(result)
        context += f"\n步骤 {i} 结果：{result}\n"

    # Phase 3: Synthesis
    print("\n=== 综合阶段 ===")
    synthesis_prompt = f"""目标：{goal}
各步骤执行结果：
{chr(10).join([f'步骤{i+1}: {r}' for i, r in enumerate(results)])}
请综合以上结果，给出最终答案。"""
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": synthesis_prompt}])
    return resp.choices[0].message.content

# 使用
final = plan_and_execute("帮我写一个 Python 函数，判断一个字符串是否是回文，并写测试用例")
print(f"\n最终答案：{final}")
```

### Reflexion（反思重试）实现

```python
# client/MODEL 沿用上节（env 三件套见上节说明）
from openai import OpenAI
client = OpenAI()

class ReflexionAgent:
    def __init__(self, max_attempts=3):
        self.max_attempts = max_attempts
        self.reflections = []  # 反思记忆

    def execute(self, task: str) -> str:
        """执行任务，失败后反思重试"""
        for attempt in range(self.max_attempts):
            print(f"\n=== 第 {attempt+1} 次尝试 ===")

            # 带上之前的反思作为上下文
            context = ""
            if self.reflections:
                context = "之前的经验教训：\n" + "\n".join(self.reflections) + "\n\n"

            # 执行任务
            prompt = f"""{context}请完成以下任务：
{task}
请给出解决方案。"""
            resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
            solution = resp.choices[0].message.content

            # 评估结果（这里用简单的检查，实际应用中可以用测试用例/Judge LLM）
            evaluation = self.evaluate(solution, task)

            if evaluation["success"]:
                print("任务成功！")
                return solution
            else:
                print(f"任务失败：{evaluation['reason']}")
                # 反思
                reflection = self.reflect(solution, evaluation, task)
                self.reflections.append(reflection)
                print(f"反思：{reflection[:100]}...")

        return f"超过最大尝试次数 {self.max_attempts}，任务失败"

    def evaluate(self, solution: str, task: str) -> dict:
        """评估解决方案是否正确"""
        # 简单示例：检查是否包含关键元素
        # 实际应用中应该运行测试用例或用 Judge LLM 评估
        prompt = f"""任务：{task}
解决方案：{solution}
请评估这个解决方案是否正确。输出 JSON 格式：
{{"success": true/false, "reason": "原因"}}"""
        resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
        try:
            import json
            return json.loads(resp.choices[0].message.content)
        except:
            return {"success": False, "reason": "评估失败"}

    def reflect(self, solution: str, evaluation: dict, task: str) -> str:
        """生成反思：诊断错误原因+改进建议"""
        prompt = f"""任务：{task}
尝试的解决方案：{solution}
失败原因：{evaluation['reason']}
请反思这次失败：
1. 错误的根本原因是什么？
2. 下次应该怎么改进？
请用2-3句话总结经验教训。"""
        resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
        return resp.choices[0].message.content

# 使用
agent = ReflexionAgent(max_attempts=3)
result = agent.execute("写一个 Python 函数，计算斐波那契数列的第 n 项，要求时间复杂度 O(n)")
print(f"\n最终结果：{result}")
```

### 自我纠错（执行中实时修正）

```python
# client/MODEL 沿用上节（env 三件套见上节说明）
from openai import OpenAI
client = OpenAI()

def self_correcting_agent(task: str, max_retries: int = 3):
    """自我纠错 Agent：执行后检查，发现错误就修正"""
    messages = [{"role": "user", "content": task}]

    for attempt in range(max_retries):
        # 执行
        resp = client.chat.completions.create(model=MODEL, messages=messages)
        solution = resp.choices[0].message.content
        messages.append({"role": "assistant", "content": solution})

        # 自我检查（Judge LLM）
        check_prompt = f"""请检查以下解决方案是否有错误。
任务：{task}
解决方案：{solution}
如果有错误，请指出具体错误和修正方法。如果没有错误，输出"无错误"。"""
        check_resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": check_prompt}])
        check_result = check_resp.choices[0].message.content

        if "无错误" in check_result:
            print(f"第 {attempt+1} 次尝试通过检查")
            return solution
        else:
            print(f"第 {attempt+1} 次尝试发现错误：{check_result[:100]}...")
            # 把检查结果作为反馈，让模型修正
            messages.append({"role": "user", "content": f"检查发现以下问题，请修正：\n{check_result}"})

    return solution  # 返回最后一次的结果（即使没通过检查）

# 使用
result = self_correcting_agent("写一个 Python 函数，判断一个年份是否是闰年")
print(f"\n最终结果：{result}")
```

---

## 五、易混对比表

| 维度 | ReAct | Plan-and-Execute | Reflexion |
|------|-------|-----------------|-----------|
| **核心思想** | 边想边做 | 先想好再做 | 做错了复盘再做 |
| 规划时机 | 执行中（动态） | 执行前（静态） | 失败后（事后） |
| 计划可见性 | 隐式（Thought） | 显式（步骤列表） | 显式（反思文本） |
| 灵活性 | 最高 | 中 | 高（重试时调整） |
| 从错误中学习 | 无（即时调整） | 无（重新规划） | 有（存入记忆） |
| 计算成本 | 低 | 中（多一次规划调用） | 高（多次尝试+反思） |
| 适用场景 | 探索性、不确定环境 | 步骤明确的复杂任务 | 容易失败的困难任务 |
| 典型框架 | LangGraph ReAct | LangChain Plan-and-Execute | Reflexion 论文实现 |
| 类比 | 没做攻略去旅游 | 提前做攻略 | 旅游回来写复盘 |

| 维度 | 自我纠错（Self-Correction） | Reflexion |
|------|---------------------------|-----------|
| 时机 | 执行过程中（实时） | 任务失败后（事后） |
| 范围 | 当前步骤 | 整个任务 |
| 是否存记忆 | 通常不存 | 存入长期记忆 |
| 目的 | 修正当前错误 | 从错误中学习 |
| 触发条件 | 每步执行后检查 | 任务完全失败 |
| 类比 | 走路发现走错了立刻掉头 | 考试后整理错题本 |

| 规划组件 | 作用 | 不做会怎样 |
|---------|------|-----------|
| 任务分解 | 把大目标拆成可执行的小步骤 | Agent 不知道从哪开始，或试图一步完成不可能的任务 |
| 计划生成 | 生成有序的步骤列表 | 执行顺序混乱，遗漏步骤 |
| 进度跟踪 | 记录已完成/未完成的步骤 | Agent 忘记做到哪了，重复执行或跳过步骤 |
| 自我纠错 | 执行后检查结果，发现错误修正 | 错误累积，最终答案错误 |
| 反思 | 失败后复盘，存入记忆 | 同样的错误反复犯 |
| 重新规划 | 环境变化时更新计划 | 按过时的计划执行，失败 |

| 反思类型 | 时机 | 内容 | 存储 |
|---------|------|------|------|
| 步骤内反思 | 每步执行后 | 这步做对了吗？需要调整吗？ | 不存（即时） |
| 任务内反思 | 任务失败后 | 哪里错了？怎么改进？ | 短期记忆（本次会话） |
| 跨任务反思 | 任务完成后 | 从这个任务中学到了什么通用经验？ | 长期记忆（跨会话） |

---

## 六、3 个实战坑

### 坑 1：计划制定得太死板，执行中环境变化了还硬按原计划走

**现象**：Plan-and-Execute 生成了一个 5 步计划，执行到第 3 步时，API 返回了预期外的数据（如用户不存在），但 Agent 还是硬按原计划执行第 4 步、第 5 步，结果全错。因为原计划假设“用户存在”，但实际环境变了。

#### 避坑
- **每步执行后检查结果是否符合预期**：如果不符合，触发重新规划，而不是继续执行
- **计划中包含“条件分支”**：好的计划不是线性的，应该包含“如果 A 则做 X，如果 B 则做 Y”
- **设置“重新规划”触发器**：
  - 某步连续失败 2 次以上 → 重新规划
  - 工具返回了预期外的数据 → 重新规划
  - 执行进度与计划严重偏离 → 重新规划
- **计划是“活的文档”，不是“死的命令”**：在 system prompt 中明确告诉 Agent “计划可以根据实际情况调整，如果发现计划不再适用，应该生成新的计划”
- **用 LangGraph 的条件边实现动态规划**：执行节点后，用条件边判断“继续下一步”还是“回到规划节点”

### 坑 2：反思变成了“甩锅”和“空话”，没有真正诊断错误原因

**现象**：Reflexion 的反思步骤生成了一堆空话——“这次失败是因为考虑不够周全，下次应该更加仔细”、“需要改进代码质量”。这些反思没有具体的错误诊断和改进建议，存入记忆后也没用，下次还是犯同样的错误。

#### 避坑
- **反思 prompt 要强制结构化输出**：
  ```
  请按以下格式反思：
  1. 具体错误：（哪一行代码/哪一步操作出错了？）
  2. 根本原因：（为什么会出错？不是表面症状）
  3. 改进措施：（下次具体应该怎么做？可执行的步骤）
  4. 通用经验：（从这次错误中学到了什么可以迁移的经验？）
  ```
- **反思必须基于具体的错误信息**：把测试失败的报错、工具返回的错误信息、不通过的检查项都提供给反思 LLM，不要让它“凭空反思”
- **反思的改进措施必须可执行**：“更加仔细”不是可执行的，“在函数开头加参数类型检查”是可执行的
- **验证反思是否有效**：下次尝试时，如果还是犯同样的错误，说明上次的反思没有用——需要更深入的反思（或换个角度）
- **区分“可修复的错误”和“能力边界”**：有些错误不是反思就能解决的（如模型能力不足、工具不支持），这种情况应该求助用户或换方法，而不是反复反思重试
- **反思记忆要定期整理**：时间长了反思记忆会很多，需要定期去重、合并、删除过时的

### 坑 3：自我纠错陷入“无限修正循环”，越改越错

**现象**：自我纠错 Agent 发现错误→修正→再检查→还有错误→再修正→... 循环了 10 次还没停，而且越改越错（第一次只是小问题，改到后来整个逻辑都乱了）。token 消耗巨大，最终结果还不如第一次。

#### 避坑
- **必须设置最大修正次数**：`max_retries=3`，超过后返回当前最佳结果（或求助用户）
- **检测“越改越差”的情况**：如果修正后的评估分数比修正前还低，说明在走下坡路——应该回退到上一个版本，而不是继续改
- **区分“小错误”和“根本性错误”**：
  - 小错误（拼写、格式、小 bug）→ 自我修正有效
  - 根本性错误（思路错了、方法不对）→ 自我修正无效，应该重新规划或从头再来
- **修正要有“休息”机制**：连续修正 2 次还没好，先停下来，用 Reflexion 做深度反思（而不是继续在错误的方向上微调）
- **保留历史版本**：每次修正前保存上一个版本，万一越改越差可以回退
- **最终答案用“最佳版本”而非“最后版本”**：记录每次修正后的评估分数，最终返回分数最高的版本，而不是最后一次修正的版本
- **简单任务不需要自我纠错**：对于简单任务（如翻译、提取），自我纠错的成本可能超过收益——直接输出即可

---

## 七、进阶问题（引导往下挖）

### 问题 1：规划能力是 LLM 内生的，还是需要外部框架赋予？推理模型（o1）的出现会让 Planning 框架过时吗？

#### 引导思考
- **LLM 本身有一定的规划能力**：只要 prompt 里说“请制定计划”，LLM 就能生成步骤列表。这是 LLM 内生的能力，来自预训练中见过的大量“计划”文本（项目计划、旅行攻略、食谱步骤等）
- **但 LLM 的规划能力有局限**：
  1. **不会自动规划**：如果 prompt 里没说“先规划”，LLM 会直接开始执行（ReAct 模式），可能走弯路
  2. **规划质量不稳定**：有时候分解得很好，有时候遗漏关键步骤或粒度不对
  3. **不会跟踪进度**：LLM 没有“当前做到第几步”的状态意识，容易重复或跳过
  4. **不会主动反思**：失败了不会自动复盘，需要外部框架触发
- **Planning 框架的价值是“强制结构化”**：
  - 强制先规划再执行（而不是直接开始）
  - 强制跟踪进度（维护计划状态）
  - 强制自我纠错（执行后检查）
  - 强制反思重试（失败后复盘）
  这些“强制”是 LLM 内生能力不会自动做的，需要外部框架赋予
- **推理模型（o1）的影响**：
  - o1 等推理模型在内部做了长链推理（隐藏的 CoT），规划能力确实比普通模型强
  - 但 o1 的推理是“隐式的”——你看不到它的计划，无法审计、无法干预、无法在执行中调整
  - 对于需要可解释性、可审计性、人机协作的场景，显式的 Planning 框架仍然必要
  - o1 更适合“端到端”的简单任务（直接给答案），复杂任务仍然需要框架来组织
- **未来趋势**：Planning 框架不会消失，但会演进——从“硬编码的流程”（必须先规划再执行）转向“自适应的流程”（根据任务复杂度自动决定是否需要规划、反思、重试）。推理模型负责内部的细粒度推理，外部框架负责高层的流程控制和状态管理，两者协同
- 延伸：后续课程（Agentic Workflow 编排、生产级 Agent 架构设计）会深入讲解如何设计自适应的 Planning 框架

### 问题 2：人类的规划和 Agent 的规划有什么本质区别？为什么 Agent 经常“计划得很好但执行失败”？

#### 引导思考
- **人类规划的特点**：
  1. **基于经验**：人类规划时会自动调用过去的经验（“上次这么做失败了，这次换个方法”）
  2. **考虑约束**：人类会自然考虑时间、资源、能力边界（“这个任务 3 天做不完，得砍需求”）
  3. **模糊性容忍**：人类计划不需要每步都精确，可以有“大概”、“看情况”的弹性
  4. **实时调整**：人类执行中发现情况不对，会立刻调整计划，不需要“重新规划”的显式步骤
  5. **常识推理**：人类知道“如果下雨就带伞”这种常识，不需要显式写在计划里
- **Agent 规划的局限**：
  1. **经验有限**：Agent 的“经验”来自训练数据和记忆系统，不如人类丰富，而且检索可能失败
  2. **约束意识弱**：Agent 经常制定不切实际的计划（如“1 分钟写完一个完整的网站”），因为它对时间、资源、能力边界没有直觉
  3. **过于刚性**：Agent 的计划通常是线性的步骤列表，缺乏“看情况”的弹性
  4. **调整成本高**：Agent 调整计划需要显式的“重新规划”步骤（额外的 LLM 调用），不如人类实时调整快
  5. **常识缺失**：Agent 经常忽略常识性的步骤（如“写完代码要测试”），除非 prompt 里明确要求
- **“计划得很好但执行失败”的原因**：
  1. **计划与现实脱节**：规划时假设了理想环境（API 一定返回预期数据、工具一定可用），但现实有各种意外
  2. **子任务依赖未考虑**：计划中步骤 2 依赖步骤 1 的结果，但步骤 1 失败了，步骤 2 就无法执行
  3. **能力边界误判**：计划中包含了 Agent 实际做不到的步骤（如“调用一个不存在的工具”）
  4. **错误传播**：前面步骤的小错误没有被发现和修正，传播到后面导致大失败
  5. **缺乏验证**：计划中没有“验证每步结果”的环节，错误累积到最后才发现
- **改进方向**：
  1. **计划中加入验证步骤**：每步执行后检查结果，不达标就修正
  2. **计划中加入条件分支**：“如果 A 则做 X，如果 B 则做 Y”
  3. **规划时考虑约束**：在规划 prompt 中明确时间、资源、能力边界
  4. **小步快跑**：不要制定太长的计划（超过 10 步），先制定前 3 步，执行后再规划后续
  5. **从失败中学习**：用 Reflexion 把失败经验存入记忆，下次规划时参考
- 延伸：后续课程（生产级 Agent 架构设计、Agent 评估指标）会深入讲解如何提高规划的可靠性和执行成功率

---

## 八、四关自测

### 复述关（3句话讲清）
1. Planning 是 Agent 的指挥官，决定先做什么后做什么；没有规划的 Agent 走一步看一步（ReAct），有规划的先列完整步骤再执行（Plan-and-Execute），失败后复盘改进（Reflexion）。
2. 两大核心能力是任务分解（把大目标拆成可执行子任务）和自我纠错（执行后检查、发现错误就修正）；生产环境通常是 Plan+Act+Reflect 三者组合。
3. Reflexion 论文证明反思威力巨大：AlfWorld 成功率从 75% 提到 97%、HumanEval 从 67% 提到 88%，但反思必须具体可执行，不能是空话。

### 举例关（真实场景）
让 Agent“做一个用户登录功能”。纯 ReAct 会走一步看一步，可能写到前端才想起没设计数据库表；Plan-and-Execute 先拆成“建表→注册接口→登录接口→前端页→测试”5步列出来给你看，你可以提前干预；执行到注册接口失败时，Reflexion 复盘“没做空值检查导致 TypeError”，下次就记住先校验空输入。

### 反例关（边界条件）
计划做得太死板，第3步 API 返回“用户不存在”这种预期外结果，还硬按原计划执行第4、5步，全盘皆错——计划必须是活文档，环境变了要触发重新规划。另外反思写成“下次要更仔细”这种空话、或自我纠错陷入“改了又错、错了又改”的无限循环越改越乱，都是典型坑，必须设最大重试次数并保留最佳版本。

### 教学关（给小白讲）
没规划的 Agent 像没做攻略就出门旅游，走到哪算哪，结果景点关门了、还绕了路。有规划的像提前列好行程单，高效不遗漏。会反思的像回来后写复盘：“景点没开门，下次出发前先查开放时间”，下次就不再犯。自我纠错则像走着走着发现走错了，当场看地图掉头。最聪明的游客是先做攻略、走着随时调整、走错了当场改、回来还记笔记。

---

## 资料来源

- 论文: [Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning, arXiv:2303.11366](https://arxiv.org/abs/2303.11366)
- 论文: [Understanding the planning of LLM agents: A survey, arXiv:2402.02716](https://arxiv.org/pdf/2402.02716.pdf)
- 论文: [LLM-based Agentic Reasoning Frameworks: A Survey, arXiv:2508.17692](https://arxiv.org/html/2508.17692v1)
- 技术博客: [OpenLegion - AI Agent Planning: ReAct, ToT, and Plan-and-Execute](https://www.openlegion.ai/en/learn/ai-agent-planning)
- 技术博客: [OpenLegion - Agentic AI Design Patterns](https://www.openlegion.ai/en/learn/agentic-ai-design-patterns)
- 教学文档: [Codemia - Planning and Task Decomposition](https://codemia.io/courses/introduction_to_agentic_ai/planning_and_task_decomposition)
- 教学文档: [Nerd Level Tech - Autonomous Agents: Planning and Self-Correction](https://nerdleveltech.com/courses/ai-agent-engineer-interviews/learn/autonomous-task-execution/autonomous-agents-planning-and-self-correction)
- 技术博客: [SegmentFault - LLM Agent 框架设计：Plan-Act-Reflect](https://segmentfault.com/a/1190000047316435)
- 技术博客: [掘金 - Agent 的三种思考范式详解](https://juejin.cn/post/7638507596300648486)
- 官方文档: [Microsoft Learn - Implement agent reflection and planning cycles](https://learn.microsoft.com/en-au/training/modules/aaai-design-agentic-loops-azure-ai-agent-service/4-implement-agent-reflection-planning-cycles)
- 框架文档: [Reactive Agents - Plan-Execute-Reflect](https://docs.reactiveagents.dev/guides/reasoning/)
- 论文: [Plan Verification for LLM-Based Agents, arXiv:2509.02761](https://arxiv.org/html/2509.02761)
- 论文: [MIRROR: Multi-agent Reflection, arXiv:2505.20670](https://arxiv.org/html/2505.20670v1)
