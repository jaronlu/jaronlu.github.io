## 一、结论前置

1. **三者是“推理结构”的演进：链（CoT）→ 树（ToT）→ 图（GoT）**。CoT 是单条路径顺序推理（一条路走到黑），ToT 是多条路径并行探索+回溯（走不通就换一条），GoT 是任意图结构推理（多条路径可以合并、聚合、反馈）。推理能力和灵活性递增，计算成本也递增。
2. **CoT 的核心发现是“让模型先写步骤再给答案”**。2022 年 Google Brain 发现，只需在 prompt 末尾加一句“Let's think step by step”，数学推理准确率就能从 17.7% 飙升到 78.7%。原理是把大问题拆成小步骤，每步更容易做对，同时推理过程作为“外部工作记忆”减少遗忘。
3. **ToT 和 GoT 是“搜索增强的推理”**，不是简单的 prompt 技巧——它们需要外部控制器管理搜索（BFS/DFS）、评估候选路径、剪枝、回溯。在需要探索解空间的任务（如 24 点游戏、创意写作）上效果惊人：ToT 把 24 点游戏成功率从 CoT 的 4% 提升到 74%。但成本是 CoT 的数倍到数十倍，生产环境需要权衡。

---

## 二、通俗类比 + 专业定义

### 通俗类比

**CoT（思维链）= 一个人闭卷做题，在草稿纸上一步步推导**
- 题目：“用 4、6、8、2 这四个数，每个用一次，通过加减乘除得到 24”
- CoT 学生：“4×6=24，剩下 8 和 2……8-2=6，不对……4×6=24，8÷2=4，24+4=28，不对……”（一条路走到黑，走错了就回不来）
- 结果：4% 成功率（经常在第一步就走错，然后越走越偏）

**ToT（思维树）= 一个人同时尝试多种解法，走不通就回溯换一条**
- ToT 学生：
  - 分支1：“4×6=24，剩下 8 和 2 怎么消掉？”→ 走不通，剪枝
  - 分支2：“8×6=48，48÷2=24，剩下 4……”→ 走不通，剪枝
  - 分支3：“8÷4=2，6×2=12，12×2=24！”→ 成功！
- 结果：74% 成功率（同时探索多条路径，走不通就回溯）

**GoT（思维图）= 多个人组队做题，可以互相交流、合并思路**
- GoT 团队：
  - 成员A：“4×6=24”
  - 成员B：“8÷2=4”
  - 合并：“24×(8÷2÷4)=24×1=24！”（两条路径的中间结果合并，得到答案）
- 关键优势：ToT 的树结构不能“合并”——两条分支各有一半答案时，ToT 只能选一条丢弃另一条；GoT 的图结构可以把两条分支的结果聚合起来

### 专业定义

| 概念 | 定义 |
|------|------|
| **CoT（Chain-of-Thought，思维链）** | 一种 prompting 技术，让 LLM 在给出最终答案前，先生成中间推理步骤。由 Wei et al. 于 2022 年提出（Google Brain）。核心发现：添加“Let's think step by step”可显著提升推理任务准确率。 |
| **Self-Consistency（自洽性）** | CoT 的改进版：对同一问题采样多条不同的 CoT 推理路径（通过提高 temperature），然后取出现最频繁的答案作为最终输出。由 Wang et al. 于 2022 年提出。本质是“多数投票”。 |
| **ToT（Tree-of-Thoughts，思维树）** | 将 CoT 的线性推理扩展为树状搜索。每个节点是一个“思维”（中间推理步骤），在每一步生成多个候选思维，用 LLM 自我评估，通过 BFS/DFS 探索和回溯，找到最优解。由 Yao et al. 于 2023 年提出。 |
| **GoT（Graph-of-Thoughts，思维图）** | 将 ToT 的树结构扩展为有向无环图（DAG）。允许思维节点有多个父节点和多个子节点，支持推理路径的**合并（aggregation）**和**反馈循环**。由 Besta et al. 于 2024 年提出。比 ToT 平均提升 15-24% 准确率。 |

---

## 三、底层机制

### 一、CoT 的工作原理

```
输入问题 → LLM 生成推理步骤1 → 步骤2 → 步骤3 → ... → 最终答案
（单条线性路径，自回归生成，一步错可能步步错）
```

**CoT 为什么有效？四个原因**：

1. **分解（Decomposition）**：大问题拆成小步骤，每步更容易做对。就像复杂数学题分步算比心算可靠。
2. **外部工作记忆（External Working Memory）**：推理步骤写在文本里，模型在生成后续步骤时可以“看到”之前的推理，减少遗忘。
3. **知识激活（Knowledge Activation）**：分步推理引导模型按顺序激活相关知识，避免“跳步”导致的逻辑跳跃。
4. **错误定位（Error Localization）**：如果答案错了，可以定位是哪一步推理出错，便于调试和改进。

**CoT 的两种用法**：

| 用法 | 方法 | 适用场景 |
|------|------|---------|
| **Few-shot CoT** | 在 prompt 中给几个“问题→推理步骤→答案”的示例 | 需要特定推理格式的任务 |
| **Zero-shot CoT** | 只在 prompt 末尾加“Let's think step by step” | 通用任务，最简单 |

### 二、Self-Consistency（自洽性）

```
问题 → 采样路径1（temperature=0.7）→ 答案A
     → 采样路径2 → 答案B
     → 采样路径3 → 答案A
     → ...
     → 多数投票：答案A（出现最频繁）
```

**原理**：CoT 用贪婪解码（temperature=0）只生成一条路径，可能恰好走错。Self-Consistency 采样多条不同路径，取多数答案，利用“正确的推理路径往往殊途同归，错误的路径则五花八门”的统计规律。

**效果**：在数学推理任务上通常比标准 CoT 再提升 5-10%。

**代价**：需要生成 K 条路径（通常 K=5-10），计算成本是标准 CoT 的 K 倍。

### 三、ToT（思维树）的工作原理

```
                    根节点（问题）
                   /    |    \
              思维1a  思维1b  思维1c  ← 生成多个候选
              /  \      |      |
           思维2a 思维2b 思维2c ...  ← 继续扩展
            ↓
         评估+剪枝：丢弃不好的路径
            ↓
         回溯：走不通就回到上一分支
            ↓
         最终选择最优路径的答案
```

**ToT 的四个核心组件**：

1. **思维分解（Thought Decomposition）**：把推理过程分解为离散的“思维”步骤。每个思维是一段连贯的语言片段，朝最终答案推进。
2. **思维生成（Thought Generation）**：在每个节点，生成多个候选思维（通常 2-5 个）。
3. **状态评估（State Evaluation）**：用 LLM 自我评估每个候选思维的质量（“这个思路离解决问题还有多远？”），打分 1-10。
4. **搜索算法（Search Algorithm）**：用 BFS（广度优先）或 DFS（深度优先）探索树，根据评估分数剪枝和回溯。

**ToT vs CoT 的本质区别**：

| 维度 | CoT | ToT |
|------|-----|-----|
| 推理结构 | 线性链（深度=N，宽度=1） | 树（深度=N，宽度=B） |
| 探索方式 | 自回归解码（一条路） | 刻意搜索（多条路+回溯） |
| 错误恢复 | 无（一步错步步错） | 有（剪枝+回溯） |
| 评估机制 | 无 | 有（LLM 自我评估） |
| 外部控制器 | 不需要 | 需要（管理搜索） |
| 计算成本 | 低（1 次生成） | 高（多次生成+评估） |
| 24点游戏成功率 | 4% | 74% |

### 四、GoT（思维图）的工作原理

```
          思维A ──→ 思维C ──→ 合并 ──→ 最终答案
             \         ↑         /
              \       /         /
               思维B ──────────┘
          （两条路径的中间结果合并，产生新思维）
```

**GoT 对 ToT 的核心突破：支持节点合并（Aggregation）**

ToT 的树结构有一个根本限制：**树不能合并**。如果两条分支各产生了有价值的部分答案，ToT 只能选择一条、丢弃另一条，无法把两者结合起来。

GoT 用有向无环图（DAG）替代树，允许：
- **聚合（Aggregation）**：多个父节点的思维合并成一个新思维（如“成员A算出了一半，成员B算出了另一半，合并得到完整答案”）
- **细化（Refinement）**：一个思维节点可以被后续思维改进和修正
- **反馈循环**：思维可以影响之前的节点（在 DAG 约束下）

**GoT 的图操作类型**：

| 操作 | 说明 | 类比 |
|------|------|------|
| **生成（Generate）** | 从现有思维生成新思维（同 CoT/ToT） | 一个人想出新点子 |
| **聚合（Aggregate）** | 合并多个思维为一个新思维 | 团队成员讨论后达成共识 |
| **细化（Refine）** | 改进和修正现有思维 | 初稿→修改稿→终稿 |
| **打分（Score）** | 评估思维质量 | 评委打分 |

**GoT 的实验效果**：在分类任务上比 ToT 提升约 24%，在 24 点游戏上提升约 15%，在创意写作上提升约 20%。

### 五、推理范式演进时间线

```
2022.01  CoT（Wei et al.）—— "Let's think step by step"，数学题 17.7%→78.7%
2022.03  Self-Consistency（Wang et al.）—— 多条路径多数投票
2023.05  ToT（Yao et al.）—— 树搜索，24点游戏 4%→74%
2024.01  GoT（Besta et al.）—— 图结构，支持合并，比 ToT 提升 15-24%
2024.09  OpenAI o1—— 隐藏长 CoT + RL，测试时计算扩展（推理模型时代）
2025+    推理模型成为主流—— o1/o3、DeepSeek-R1、Claude 3.7 等内置长链推理
```

**关键趋势**：从“显式 CoT（推理过程可见）”走向“隐式 CoT（推理过程隐藏在模型内部，如 o1）”。o1 等推理模型在预训练时就用 RL 训练了长链推理能力，不需要在 prompt 中显式要求“step by step”。

---

## 四、最小可运行代码

### Zero-shot CoT（最简单）

```python
import os
from openai import OpenAI

# 用自己的 provider 跑通本示例（任何 OpenAI 兼容接口均可）：
#   export OPENAI_API_KEY=sk-xxx        # 你的 key
#   export OPENAI_BASE_URL=https://...  # 接口地址（用 openai 官方可省略）
#   export LLM_MODEL=doubao-pro-32k     # 模型名，按你的 provider 填
client = OpenAI()  # 自动读取 OPENAI_API_KEY / OPENAI_BASE_URL
MODEL = os.environ["LLM_MODEL"]

# 只需加一句 "Let's think step by step"
response = client.chat.completions.create(
    model=MODEL,
    messages=[{
        "role": "user",
        "content": "一个商店卖苹果，每斤3元，买5斤以上打8折。买8斤需要多少钱？Let's think step by step."
    }]
)
print(response.choices[0].message.content)
# 输出：
# 步骤1：原价 = 3元/斤 × 8斤 = 24元
# 步骤2：因为买了8斤，超过5斤，所以打8折
# 步骤3：折后价 = 24元 × 0.8 = 19.2元
# 答案：买8斤需要19.2元
```

### Self-Consistency（自洽性）

```python
# client/MODEL 沿用上节（env 三件套见上节说明）
from openai import OpenAI
from collections import Counter

client = OpenAI()

def self_consistency(question: str, n_samples: int = 5):
    answers = []
    for _ in range(n_samples):
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": f"{question} Let's think step by step."}],
            temperature=0.7  # 提高温度，生成不同路径
        )
        # 提取最终答案（假设答案在 "答案：" 之后）
        content = resp.choices[0].message.content
        if "答案：" in content:
            answer = content.split("答案：")[-1].strip()
        else:
            answer = content.strip()
        answers.append(answer)

    # 多数投票
    counter = Counter(answers)
    most_common = counter.most_common(1)[0]
    return most_common[0], counter

# 使用
answer, votes = self_consistency("一个商店卖苹果，每斤3元，买5斤以上打8折。买8斤需要多少钱？")
print(f"最终答案：{answer}")
print(f"投票分布：{votes}")
```

### ToT（思维树）最简实现

```python
# client/MODEL 沿用上节（env 三件套见上节说明）
from openai import OpenAI
client = OpenAI()

def generate_thoughts(problem: str, current_thought: str, n_candidates: int = 3):
    """生成多个候选思维"""
    prompt = f"""问题：{problem}
当前推理：{current_thought}
请生成 {n_candidates} 个不同的下一步推理思路，每个用数字编号。
只输出思路，不要输出最终答案。"""
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    thoughts = [t.strip() for t in resp.choices[0].message.content.split("\n") if t.strip() and t[0].isdigit()]
    return thoughts[:n_candidates]

def evaluate_thought(problem: str, thought: str) -> int:
    """用 LLM 评估思维质量，返回 1-10 分"""
    prompt = f"""问题：{problem}
推理思路：{thought}
请评估这个思路离解决问题还有多远，打分 1-10（10=非常有希望，1=完全走偏）。
只输出一个数字。"""
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    try:
        return int(resp.choices[0].message.content.strip())
    except:
        return 5

def tot_solve(problem: str, max_depth: int = 3, n_candidates: int = 3, top_k: int = 2):
    """ToT 树搜索（简化版 BFS）"""
    # 根节点
    frontier = [{"thought": "", "score": 5, "path": []}]

    for depth in range(max_depth):
        all_candidates = []
        for node in frontier:
            thoughts = generate_thoughts(problem, node["thought"], n_candidates)
            for t in thoughts:
                score = evaluate_thought(problem, t)
                all_candidates.append({
                    "thought": t,
                    "score": score,
                    "path": node["path"] + [t]
                })
        # 剪枝：只保留 top_k
        all_candidates.sort(key=lambda x: x["score"], reverse=True)
        frontier = all_candidates[:top_k]
        print(f"深度 {depth+1}: 最佳思路分数={frontier[0]['score']}")

    # 用最佳路径生成最终答案
    best_path = frontier[0]["path"]
    final_prompt = f"问题：{problem}\n推理过程：{' → '.join(best_path)}\n请给出最终答案。"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": final_prompt}])
    return resp.choices[0].message.content

# 使用
answer = tot_solve("用 4、6、8、2 这四个数，每个用一次，通过加减乘除得到 24")
print(answer)
```

---

## 五、易混对比表

| 维度 | CoT | Self-Consistency | ToT | GoT |
|------|-----|-----------------|-----|-----|
| **推理结构** | 线性链 | 多条独立链 | 树 | 有向无环图（DAG） |
| **路径数量** | 1条 | K条（多数投票） | 多条（搜索） | 多条（可合并） |
| **回溯能力** | 无 | 无（各路径独立） | 有（剪枝+回溯） | 有（图遍历） |
| **路径合并** | 不支持 | 不支持（只投票） | 不支持（树不能合并） | 支持（核心优势） |
| **评估机制** | 无 | 无（靠统计） | 有（LLM自我评估） | 有（图打分） |
| **外部控制器** | 不需要 | 简单（采样+投票） | 需要（搜索管理） | 需要（图管理） |
| **计算成本** | 低 | 中（K倍） | 高（数十倍） | 最高 |
| **推理能力** | 基础 | 中等 | 强 | 最强 |
| **适用场景** | 通用推理 | 有确定答案的题 | 需要探索解空间 | 需要聚合多路径 |
| **24点游戏** | 4% | ~10% | 74% | ~85% |
| **提出时间** | 2022.01 | 2022.03 | 2023.05 | 2024.01 |

| 维度 | 显式 CoT（prompt 触发） | 隐式 CoT（推理模型如 o1） |
|------|------------------------|--------------------------|
| **推理过程** | 可见（输出在文本中） | 隐藏（在模型内部完成） |
| **触发方式** | prompt 加 “step by step” | 自动触发（模型训练时学会） |
| **可调试性** | 高（可以看推理步骤） | 低（推理过程不可见） |
| **计算成本** | 可控（输出长度有限） | 高（内部可能推理数千 token） |
| **代表模型** | GPT-4o、Claude 3.5 | o1/o3、DeepSeek-R1、Claude 3.7 |
| **趋势** | 2022-2024 主流 | 2024+ 成为主流 |

| 推理范式 | 核心思想 | 一句话总结 |
|---------|---------|-----------|
| CoT | 分步推理 | “想一步写一步” |
| Self-Consistency | 多数投票 | “多试几次，选出现最多的答案” |
| ToT | 树搜索 | “同时想几条路，走不通就换” |
| GoT | 图推理 | “几条路可以合并，团队协作” |
| Plan-and-Execute | 先规划后执行 | “先制定完整计划，再逐步执行” |
| Reflexion | 失败反思 | “做错了就复盘，再试一次” |
| ReAct | 推理+行动 | “想一步做一步，看结果再想” |

---

## 六、3 个实战坑

### 坑 1：以为 CoT 万能，结果在简单任务上反而变慢、还引入错误

**现象**：不管什么任务都加“Let's think step by step”，结果简单的分类任务（如“这句话是正面还是负面”）反而变慢了（多生成了一堆推理步骤），而且有时候推理步骤写错了导致最终答案也错了（“过度思考”）。

**避坑**：
- **CoT 只用于需要推理的任务**：数学、逻辑、多步分析、代码调试。简单分类、提取、翻译不需要 CoT
- **简单任务直接要答案**：“请判断这句话的情感倾向，直接回答正面/负面/中性，不需要推理过程”
- **用 `response_format` 强制输出格式**：简单任务用 JSON Schema 强制只输出答案，不生成推理
- **推理模型（o1）不需要显式 CoT**：o1 等推理模型内部已经做了长链推理，再加 “step by step” 是多余的，甚至可能干扰
- **监控 CoT 的 token 消耗**：如果推理步骤占了总输出的 80% 但任务很简单，说明不需要 CoT

### 坑 2：ToT/GoT 实现太复杂，外部控制器 bug 比模型错误还多

**现象**：想实现 ToT，结果写了一大堆搜索、评估、剪枝、回溯的代码，bug 层出不穷——评估函数返回格式不对、剪枝逻辑把正确路径剪掉了、回溯时状态没恢复……最后 ToT 的效果还不如简单的 CoT。

**避坑**：
- **先用现成框架，不要自己造轮子**：LangGraph 支持 ToT 风格的图搜索，有现成的节点、条件边、检查点机制
- **从简单版本开始**：先实现“生成 3 个候选→评估→选最好的→继续”（只有 1 层搜索），验证有效后再加多层
- **评估函数要简单可靠**：不要让 LLM 输出复杂的评估 JSON，直接让它输出 1-10 的数字，加 try-except 兜底
- **设置超时和最大步数**：ToT 搜索可能陷入死循环，必须设置最大深度、最大候选数、总 token 预算
- **评估 ToT 效果要有对照组**：同时跑 CoT 和 ToT，对比准确率和成本。如果 ToT 只提升了 5% 但成本涨了 10 倍，不值得
- **考虑用推理模型替代**：o1 等推理模型内部已经做了类似 ToT 的搜索（隐藏的长链推理+RL），效果可能比自己实现的 ToT 还好，成本还更低

### 坑 3：Self-Consistency 的“多数投票”在开放式任务上失效

**现象**：Self-Consistency 在数学题上效果很好（答案是确定的，多数投票有效），但在创意写作、开放式问答上反而变差——因为开放式任务没有“正确答案”，多条路径生成的答案各不相同，“多数投票”没有意义，甚至会选出最平庸的答案。

**避坑**：
- **Self-Consistency 只用于有确定答案的任务**：数学、逻辑、事实性问答、代码生成（有唯一正确输出）
- **开放式任务用“最佳选择”而非“多数投票”**：生成多条路径后，用 LLM 评估哪条最好（“哪个答案最有创意/最全面/最准确”），选最佳的而非最多的
- **创意任务用“融合”而非“投票”**：生成多条路径后，让 LLM 融合各条的优点（“综合以上几个思路，给出一个最佳版本”），这其实就是 GoT 的聚合思想
- **注意 temperature 设置**：Self-Consistency 需要 temperature>0（通常 0.5-0.9）来生成不同路径。如果 temperature=0，所有路径都一样，投票没有意义
- **采样数量 K 不是越大越好**：K=5 通常足够，K>10 边际收益递减但成本线性增长
- **答案提取要鲁棒**：不同路径的答案格式可能不同（“19.2元”vs“19.2”vs“19.2元钱”），需要做归一化再投票

---

## 七、进阶问题（引导往下挖）

### 问题 1：推理模型（o1、DeepSeek-R1）内置了隐藏的长链推理，CoT/ToT/GoT 这些 prompt 技术还有用吗？

**引导思考**：
- **短期看，显式 CoT 的需求在减少**：o1 等推理模型在预训练时就用 RL 训练了长链推理能力，不需要在 prompt 中显式要求 “step by step”。对于使用推理模型的场景，显式 CoT 确实是多余的
- **但推理模型有局限性**：
  1. **推理过程不可见**：o1 的推理过程是隐藏的（只输出最终答案），无法调试和定位错误
  2. **成本高**：推理模型的推理 token 可能是普通模型的 10-100 倍，简单任务用推理模型是浪费
  3. **可控性差**：无法控制推理的深度、方向、格式
  4. **不是所有模型都有推理能力**：很多开源模型、轻量模型、垂直领域模型还是需要显式 CoT
- **ToT/GoT 在推理模型时代仍然有价值**：
  1. **需要探索解空间的任务**（如 24 点游戏、创意写作），推理模型的内部搜索可能不够，显式的 ToT/GoT 可以提供更系统的探索
  2. **需要可解释性的场景**（医疗、法律、金融），显式推理过程是必须的
  3. **多 Agent 协作**：多个推理模型之间需要显式的推理轨迹来交流和协作
- **未来趋势**：显式推理和隐式推理会融合——推理模型负责内部的细粒度推理，外部框架（LangGraph）负责显式的高层规划和搜索，两者协同
- 延伸：后续知识点（Planning、生产级 Agent 架构设计）会深入讲解如何在推理模型时代设计 Agent 系统

### 问题 2：CoT/ToT/GoT 的“推理”和人类的“思考”有什么本质区别？

**引导思考**：
- **人类思考是“语义理解”，LLM 推理是“模式匹配”**：人类理解“2+2=4”的含义，LLM 只是根据训练数据中的统计规律预测“2+2=”后面最可能出现“4”。CoT 让 LLM 分步生成，本质是分步预测，每一步都基于前面的文本做下一个 token 预测
- **但效果上有相似性**：就像飞机不是像鸟一样扇翅膀，但同样能飞。LLM 的“推理”虽然机制不同，但在效果上确实能解决很多需要推理的问题
- **关键区别 1：一致性**：人类思考有全局一致性（不会在第3步 contradict 第1步），LLM 可能出现“中途变卦”——前面说 A，后面说非 A，因为它只看最近的上下文
- **关键区别 2：自我纠错**：人类能发现自己的错误并纠正，LLM 的“纠错”往往是因为生成了“我之前错了”这个 token 模式，而不是真正理解了错误
- **关键区别 3：工作记忆**：人类的工作记忆是真正的“脑内状态”，LLM 的“工作记忆”就是上下文窗口中的文本——它不是“记住”了，而是“看到”了之前写的文本
- **关键区别 4：组合泛化**：人类能把两个不相关的知识组合起来解决新问题，LLM 的组合能力有限，经常出现“两个都懂但合起来就错”
- **哲学层面**：这涉及“中文房间”论证——如果一个系统能完美模拟推理，它算不算真正在推理？不同哲学流派有不同答案
- **工程层面**：我们不关心哲学，只关心效果。CoT/ToT/GoT 确实能提升 LLM 的推理准确率，这就够了。但要意识到它们的局限性，不要把 LLM 的“推理”等同于人类的“思考”
- 延伸：后续知识点（Agent 安全与对齐）会深入讲解 LLM 推理的局限性和对应的安全措施

---

## 八、四关自测

### 复述关（3句话讲清）
1. CoT/ToT/GoT 是推理结构从链→树→图的演进：CoT 一条路走到底，ToT 多路探索+回溯，GoT 支持多条路径的合并聚合。
2. CoT 的关键发现是“Let's think step by step”一句话就能把数学题准确率从 17.7% 拉到 78.7%，原理是分解难题+外部工作记忆；Self-Consistency 则是多采样几条路径多数投票。
3. ToT/GoT 是带外部搜索控制器的“搜解空间”方法（24点游戏成功率从 CoT 的 4% 飙到 ToT 的 74%），但成本是 CoT 的数倍到数十倍，简单任务别滥用。

### 举例关（真实场景）
玩 24 点游戏：用 4、6、8、2 凑 24。CoT 学生一路算到底经常卡在第一步；ToT 学生同时试“4×6”“8×6”“8÷4”三条分支，前两条走不通就剪枝回溯，第三条 8÷4=2、6×2=12、12×2=24 成功；GoT 更进一步，把“4×6=24”和“8÷2=4”两个分支的中间结果合并，得到 24×(8÷2÷4)=24。

### 反例关（边界条件）
对“这句话情感是正面还是负面”这种简单分类也硬加 step-by-step，模型多写一堆推理、还可能推理写错把答案带偏——CoT 只对需要多步逻辑的任务有用。另外 Self-Consistency 的“多数投票”在创意写作上失效，因为没有唯一正确答案，投出来的往往是最平庸的那条。

### 教学关（给小白讲）
CoT 像一个人做题在草稿纸上一步步算，一条路走到黑，走错了就回不来。ToT 像这个人同时摆好几条解题思路在桌上，哪条算着不对就划掉换另一条。GoT 像几个人凑一桌做题，甲算一半、乙算一半，两人把思路一拼答案就出来了。越聪明的办法越费纸费时间，所以简单题用 CoT、难题才上 ToT/GoT。

---

## 资料来源

- 论文: [Wei et al., Chain-of-Thought Prompting Elicits Reasoning in Large Language Models, arXiv:2201.11903](https://arxiv.org/abs/2201.11903)
- 论文: [Wang et al., Self-Consistency Improves Chain of Thought Reasoning, arXiv:2203.11171](https://arxiv.org/abs/2203.11171)
- 论文: [Yao et al., Tree of Thoughts: Deliberate Problem Solving with Large Language Models, arXiv:2305.10601](https://arxiv.org/abs/2305.10601)
- 论文: [Besta et al., Graph of Thoughts: Solving Elaborate Problems with Large Language Models, arXiv:2308.09687](https://arxiv.org/abs/2308.09687)
- 论文: [Demystifying Chains, Trees, and Graphs of Thoughts, arXiv:2401.14295](https://arxiv.org/html/2401.14295v5)
- 技术博客: [腾讯云 - AI推理方法演进：CoT、ToT与GoT技术对比分析](https://developer.cloud.tencent.cn/news/2924210)
- 权威媒体: [36氪 - 如何让大语言模型思考得更准确](https://36kr.com/p/3909063329748097)
- 技术博客: [CSDN - 思维链推理：CoT、ToT与GoT](https://blog.csdn.net/AladdinEdu/article/details/159960584)
- 教学文档: [Foundation Model Engineering - Tree/Graph of Thoughts](https://sungeuns.github.io/foundation-model-engineering/chapter-15/tree-graph-of-thoughts/)
- 技术博客: [Articsledge - What is Chain of Thought (CoT) Prompting?](https://www.articsledge.com/post/chain-of-thoughts-cot-prompting)
- 论文: [Towards Structured Reasoning: CoT Survey, TechRxiv](https://www.techrxiv.org/doi/pdf/10.36227/techrxiv.176617594.46953319/v1)
- 教材: [清华大学出版社 - 第5章 大模型推理能力优化](http://www.tup.tsinghua.edu.cn/upload/books/yz/111943-01.pdf)
