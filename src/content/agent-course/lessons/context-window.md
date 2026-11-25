## 一、结论前置

1. **上下文窗口是 Agent 最宝贵的有限资源——它不是“越大越好”，而是需要像管理预算一样精细管理**。上下文窗口包含：System Prompt、工具定义、对话历史、工具结果、检索文档、工作记忆。当对话变长时，这些内容会累积，最终超出窗口限制导致报错，或者因为“Lost in the Middle”效应（模型对中间内容注意力下降）导致质量下降。Databricks Mosaic 实测：多数模型的正确率下降拐点远低于标称窗口上限，且拐点因模型而异（各模型实测数据见文末 Databricks 原文）。
2. **上下文管理的三大核心策略**：①**滑动窗口（Sliding Window）**——只保留最近 N 条消息，丢弃旧消息，最简单最快，但会“忘记”早期内容；②**摘要压缩（Summarization/Compaction）**——当上下文达到阈值（通常 60-80%）时，用 LLM 把旧内容压缩成摘要，保留关键决策和约束，替换原始记录，保留信息但节省空间；③**混合策略（Hybrid）**——滑动窗口 + 摘要压缩 + 重要性选择，是生产级系统的标准做法。Microsoft Agent Framework 的组合策略就是：工具结果压缩 → 摘要压缩 → 滑动窗口，按优先级依次执行。
3. **长时间运行的 Agent 有一个隐藏的成本炸弹——O(N²) Token 累积**。每次 LLM 调用都要重传所有历史消息，对话越长，单次调用的 Token 成本越高，总成本是 O(N²) 增长。Prompt Cache 失效会放大这一效应：前缀一旦失效，本可按缓存折扣价读取的历史就要按全价重算，长会话中重复计算可以占账单的大头（量化参考：“Don't Break the Cache”论文实测，prompt caching 正常生效时可节省 41-80% 成本，缓存失效即反向损失同量级）。上下文管理不只是“防止溢出”，更是“控制成本”和“维持质量”的核心工程能力。

---

## 二、通俗类比 + 专业定义

### 通俗类比

#### 上下文窗口 = 你的办公桌桌面

- **桌面大小（上下文窗口）**：
  - 你的办公桌面积是有限的（比如 2 平方米）
  - 你能同时放在桌面上的东西是有限的
  - 桌面越大，能同时放的东西越多，但也越贵（大窗口模型更贵）

- **桌面上放什么（上下文内容）**：
  - **工作手册（System Prompt）**：一直放在桌面左上角，随时参考
  - **工具说明书（工具定义）**：放在手册旁边，告诉你每个工具怎么用
  - **正在做的任务（当前用户请求）**：放在桌面中央，最显眼
  - **之前的对话记录（对话历史）**：从左到右摊开，越旧的越靠左
  - **查资料的结果（工具结果/检索文档）**：散落在桌面上，可能很厚
  - **临时笔记（工作记忆）**：便签纸，记着关键信息

- **问题：桌面满了怎么办？**
  - 如果你把所有东西都堆在桌面上，很快就满了
  - 满了之后，你要么：①把旧东西扔掉（滑动窗口）；②把旧东西整理成摘要笔记（摘要压缩）；③把不重要的东西收起来，只留重要的（重要性选择）
  - 如果你不管理，桌面会越来越乱，你找不到需要的东西（质量下降），或者东西堆不下掉地上了（溢出报错）

- **“Lost in the Middle”效应**：
  - 你坐在办公桌前，最容易看到的是**正中央**（当前任务）和**最近放的东西**（右侧的新对话）
  - **最左边**的旧东西（早期对话）你偶尔会瞟一眼
  - 但**中间偏左**的东西（不太新也不太旧的对话）最容易被忽略——你知道它在那里，但不会主动去看
  - 这就是“Lost in the Middle”——模型对上下文中间的内容注意力最低

- **成本问题**：
  - 每次你要工作，都要把桌面上所有东西看一遍（LLM 每次调用都要处理全部上下文）
  - 桌面越满，每次“看一遍”的时间越长（Token 成本越高）
  - 如果桌面有 100 份文件，你每次工作都要翻 100 份——即使你只需要其中 3 份
  - 这就是 O(N²) 成本：文件越多，每次翻的时间越长，总时间是文件数的平方

### 专业定义

| 概念 | 定义 |
|------|------|
| **Context Window（上下文窗口）** | LLM 在单次请求中能处理的最大 Token 数。包含 System Prompt、对话历史、工具定义、工具结果、检索文档和工作记忆。不同模型的窗口大小不同（从 4K 到 1M+），但实际有效范围通常远小于标称上限。 |
| **Token Budget（Token 预算）** | 为上下文窗口的各个部分分配的 Token 额度。通常分为：System Prompt（固定）、工具定义（固定）、对话历史（动态）、工具结果（动态）、检索文档（动态）、工作记忆（动态）。预算管理确保任何部分都不会挤占其他部分的空间。 |
| **Sliding Window（滑动窗口）** | 最简单的上下文管理策略——只保留最近的 N 条消息（或 N 个 Token），当新消息加入时，最旧的消息被丢弃。优点是简单、确定性、无额外延迟；缺点是会完全丢失早期上下文。 |
| **Summarization / Compaction（摘要压缩）** | 当上下文使用量达到阈值时，用 LLM 将旧的对话历史压缩成摘要，保留关键决策、约束和未解决问题，然后用摘要替换原始记录。优点是保留关键信息；缺点是需要额外的 LLM 调用（增加延迟和成本），且摘要可能丢失细节（“摘要漂移”）。 |
| **Context Compaction（上下文压缩）** | 摘要压缩的另一种称呼，特指在长时间运行的 Agent 会话中，自动将旧内容压缩为紧凑形式的技术。关键是保留“决策、文件变更、生效中的约束”等关键事实，而不是完整的对话记录。 |
| **Hybrid Strategy（混合策略）** | 结合多种上下文管理策略的方法。通常是：①重要信息（System Prompt、关键约束）永久保留；②最近的 N 条消息完整保留（滑动窗口）；③更早的消息压缩为摘要；④工具结果特殊处理（保留最近的，旧的压缩或丢弃）。生产级系统的标准做法。 |
| **Lost in the Middle（中间遗忘）** | LLM 的注意力分布现象——模型对上下文开头和结尾的内容注意力最高，对中间的内容注意力最低。即使在 1M Token 的长上下文中，这个效应仍然存在。Databricks Mosaic 实测：多数模型的正确率拐点远低于标称窗口上限，且拐点因模型而异。 |
| **Tool Result Compaction（工具结果压缩）** | 针对工具调用结果的特殊压缩策略。工具结果可能很长（如搜索结果、代码文件内容），且通常只在调用后的几步内需要。策略是：保留最近 1-2 次工具调用的完整结果，更早的工具结果压缩为摘要或直接丢弃。 |
| **Adaptive Focus Memory（自适应焦点记忆）** | 一种高级上下文管理系统，根据语义相关性、时间衰减和重要性分类，动态地为每条历史消息分配三个保真度级别：Full（完整保留）、Compressed（压缩为摘要）、Placeholder（只保留占位符/元数据）。在固定 Token 预算下，优先保留关键信息，允许低重要性上下文优雅降级。 |
| **Prompt Cache（提示词缓存）** | LLM 提供商的优化技术——如果多次请求的 Prompt 前缀相同，缓存前缀的计算结果，只计算新增部分，大幅降低成本和延迟。上下文管理操作（如压缩、滑动窗口）可能改变 Prompt 前缀，导致缓存失效，需要特别注意。 |

---

## 三、底层机制

### 一、上下文窗口的组成与 Token 预算分配

```
┌─────────────────────────────────────────────────────────────┐
│                    上下文窗口（如 128K tokens）               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐  固定部分（不可压缩）                │
│  │ System Prompt       │  ~2K-5K tokens                     │
│  │ (身份/规则/流程)     │                                      │
│  ├─────────────────────┤                                      │
│  │ 工具定义            │  ~1K-3K tokens（每个工具~200-500）  │
│  │ (名称/描述/参数)     │                                      │
│  └─────────────────────┘                                      │
│                                                               │
│  ┌─────────────────────┐  动态部分（需要管理）                │
│  │ 当前用户请求        │  ~0.1K-1K tokens                    │
│  ├─────────────────────┤                                      │
│  │ 对话历史            │  可变，可能累积到几十K                │
│  │ (用户+助手消息)     │                                      │
│  ├─────────────────────┤                                      │
│  │ 工具结果            │  可变，可能很长（搜索结果/代码）       │
│  │ (工具调用返回)       │                                      │
│  ├─────────────────────┤                                      │
│  │ 检索文档            │  可变，RAG 场景下可能几K到几十K       │
│  │ (RAG 检索结果)      │                                      │
│  ├─────────────────────┤                                      │
│  │ 工作记忆/摘要       │  可变，压缩后的历史摘要               │
│  └─────────────────────┘                                      │
│                                                               │
│  ┌─────────────────────┐  预留部分                            │
│  │ 模型输出预留        │  ~1K-4K tokens（确保有空间生成回答）  │
│  └─────────────────────┘                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Token 预算分配原则
- **固定部分优先**：System Prompt 和工具定义是必须的，先分配
- **输出预留**：必须预留足够空间给模型生成回答（通常 1K-4K）
- **动态部分共享剩余预算**：对话历史、工具结果、检索文档共享剩余的 Token 预算
- **设置阈值触发压缩**：当动态部分使用量达到预算的 60-80% 时，触发压缩操作
- **示例预算分配（128K 窗口）**：
  - System Prompt：4K
  - 工具定义：2K
  - 输出预留：4K
  - 动态部分预算：118K
    - 对话历史：最多 60K
    - 工具结果：最多 30K
    - 检索文档：最多 20K
    - 工作记忆：8K

### 二、三大核心策略详解

#### 策略 1：滑动窗口（Sliding Window）

```
对话历史（按时间顺序）：
[消息1] [消息2] [消息3] [消息4] [消息5] [消息6] [消息7] [消息8]
                                    ↑
                              窗口左边界（保留最近 N=4 条）

保留：[消息5] [消息6] [消息7] [消息8]
丢弃：[消息1] [消息2] [消息3] [消息4]

新消息加入后：
[消息5] [消息6] [消息7] [消息8] [消息9]
              ↑
         窗口左边界右移，丢弃 [消息5]
```

##### 实现
```python
def sliding_window(messages: list, max_turns: int = 10) -> list:
    """保留最近 max_turns 轮对话（一轮=用户+助手）"""
    # 每轮 2 条消息，所以保留最近 max_turns * 2 条
    return messages[-max_turns * 2:]

# 改进版：保留 System Prompt + 最近 N 条
def sliding_window_with_system(messages: list, max_recent: int = 20) -> list:
    """保留第一条（通常是 System Prompt）+ 最近 max_recent 条"""
    if len(messages) <= max_recent + 1:
        return messages
    return [messages[0]] + messages[-max_recent:]
```

| 优点 | 缺点 |
|------|------|
| 最简单，实现成本低 | 完全丢失早期上下文 |
| 确定性，行为可预测 | 可能丢失关键约束和决策 |
| 无额外 LLM 调用（零延迟） | 不适合需要长期记忆的任务 |
| 最近信息完整保留 | “忘记”用户最初的需求 |
| 适合：简单对话、近期上下文最重要的场景 | 不适合：长任务、需要参考早期决策的场景 |

#### 策略 2：摘要压缩（Summarization / Compaction）

```
压缩前：
[System Prompt]
[消息1] [消息2] [消息3] ... [消息50] [消息51] [消息52]
←──── 旧内容（4K tokens）────→ ←─ 最近内容（1K）─→

压缩触发（达到阈值）：
  ↓
用 LLM 把旧内容压缩为摘要（500 tokens）：
"对话摘要：用户最初要求写一篇关于AI的文章。
 已完成：研究阶段、大纲确定。
 关键决策：用5个章节结构，重点关注应用案例。
 当前状态：正在写第3章。"

压缩后：
[System Prompt]
[对话摘要] [消息50] [消息51] [消息52]
←─ 摘要（500）─→ ←─ 最近内容（1K）─→
总大小从 5K 降到 1.5K，节省 70% 空间
```

##### 实现
```python
import os
from openai import OpenAI

# 用自己的 provider 跑通本示例（任何 OpenAI 兼容接口均可）：
#   export OPENAI_API_KEY=sk-xxx        # 你的 key
#   export OPENAI_BASE_URL=https://...  # 接口地址（用 openai 官方可省略）
#   export LLM_MODEL=doubao-pro-32k     # 模型名，按你的 provider 填
client = OpenAI()  # 自动读取 OPENAI_API_KEY / OPENAI_BASE_URL
MODEL = os.environ["LLM_MODEL"]


def compact_context(messages: list, threshold: int = 0.7, model: str = MODEL) -> list:
    """当上下文使用量超过阈值时，压缩旧消息"""
    total_tokens = count_tokens(messages)
    max_tokens = 128000  # 模型窗口大小

    if total_tokens < max_tokens * threshold:
        return messages  # 未达阈值，不压缩

    # 找到压缩点：保留最近的 N 条不压缩
    keep_recent = 10  # 保留最近 10 条
    if len(messages) <= keep_recent + 1:
        return messages

    system_msg = messages[0]  # System Prompt
    old_messages = messages[1:-keep_recent]  # 旧消息
    recent_messages = messages[-keep_recent:]  # 最近消息

    # 用 LLM 压缩旧消息
    old_text = "\n".join([f"{m['role']}: {m['content']}" for m in old_messages])
    summary_prompt = f"""请将以下对话历史压缩为简洁的摘要，保留：
1. 用户的原始需求和目标
2. 已做出的关键决策和约束
3. 已完成的工作和当前进度
4. 未解决的问题

对话历史：
{old_text}

摘要（不超过500字）："""

    resp = client.chat.completions.create(model=model, messages=[{"role": "user", "content": summary_prompt}])
    summary = resp.choices[0].message.content

    # 用摘要替换旧消息
    summary_msg = {"role": "system", "content": f"[对话历史摘要]\n{summary}"}
    return [system_msg, summary_msg] + recent_messages
```

| 优点 | 缺点 |
|------|------|
| 保留关键信息（决策、约束、进度） | 需要额外 LLM 调用（增加延迟和成本） |
| 比滑动窗口“记性好” | 摘要可能丢失细节（“摘要漂移”） |
| 适合长任务、需要参考早期内容的场景 | 摘要质量依赖 LLM，可能不准确 |
| 可以控制压缩比（摘要长度） | 压缩操作可能导致 Prompt Cache 失效 |
| 适合：长任务、复杂对话、需要长期记忆 | 不适合：简单对话、对延迟敏感的场景 |

#### 策略 3：混合策略（Hybrid）—— 生产级标准

```
┌─────────────────────────────────────────────────────────┐
│                    混合策略上下文管理                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  永久保留（永不删除）：                                    │
│  ┌─────────────────────────────────────────────┐        │
│  │ System Prompt + 关键约束 + 当前任务目标       │        │
│  └─────────────────────────────────────────────┘        │
│                                                           │
│  完整保留（滑动窗口）：                                    │
│  ┌─────────────────────────────────────────────┐        │
│  │ 最近 5-10 轮对话 + 最近 1-2 次工具结果       │        │
│  └─────────────────────────────────────────────┘        │
│                                                           │
│  压缩保留（摘要）：                                        │
│  ┌─────────────────────────────────────────────┐        │
│  │ 更早的对话 → 压缩为摘要（保留关键决策/约束）   │        │
│  │ 更早的工具结果 → 压缩为摘要或丢弃              │        │
│  └─────────────────────────────────────────────┘        │
│                                                           │
│  动态加载（按需检索）：                                    │
│  ┌─────────────────────────────────────────────┐        │
│  │ 长期记忆 → 存在外部存储，需要时检索注入        │        │
│  │ 历史工具结果 → 存在外部存储，需要时检索        │        │
│  └─────────────────────────────────────────────┘        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

##### Microsoft Agent Framework 的组合策略示例
```python
strategy = TokenBudgetComposedStrategy(
    token_budget=16_000,  # 总 Token 预算
    tokenizer=CharacterEstimatorTokenizer(),
    strategies=[
        # 优先级 1：先压缩工具结果（工具结果通常最长且最不需要完整保留）
        ToolResultCompactionStrategy(keep_last_tool_call_groups=1),
        # 优先级 2：再压缩旧对话为摘要
        SummarizationStrategy(client=summarizer_client, target_count=4, threshold=2),
        # 优先级 3：最后用滑动窗口兜底（确保不超预算）
        SlidingWindowStrategy(keep_last_groups=20),
    ],
)
```

##### 混合策略的执行顺序（按优先级）
1. **工具结果压缩**：工具结果通常最长，且只在调用后几步内需要，优先压缩
2. **旧对话摘要**：超过滑动窗口的旧对话压缩为摘要
3. **滑动窗口兜底**：如果压缩后仍超预算，用滑动窗口丢弃最旧的内容
4. **重要性选择**：在滑动窗口内，优先保留包含关键决策、约束的消息

### 三、“Lost in the Middle”效应与质量维护

**现象**：即使上下文窗口很大（200K、1M），模型对中间内容的注意力也会下降，导致：
- 放在中间的检索文档被忽略
- 中间的对话历史被“忘记”
- 关键约束如果放在中间，可能不被遵循

**Databricks Mosaic 实测数据**：长上下文 RAG 场景下，多数模型的正确率拐点远低于标称窗口上限，且拐点因模型而异——不要按标称窗口上限规划上下文预算。

#### 应对策略
1. **重要信息放在开头或结尾**：
   - System Prompt 放在开头（模型最关注）
   - 关键约束、当前任务目标放在 System Prompt 中（开头）
   - 最近的对话放在结尾（模型次关注）
   - 不要把重要信息放在中间
2. **重复关键约束**：在 System Prompt 和最近的消息中都强调关键约束（“再次提醒：不要泄露用户信息”）
3. **控制上下文长度**：不要因为窗口大就塞满。保持在模型的“有效范围”内（通常 16K-64K，取决于模型）
4. **检索文档重排序**：RAG 场景下，把最相关的文档放在开头和结尾，次相关的放中间
5. **定期“刷新”关键信息**：在对话过程中，定期把关键约束和目标“重新注入”到最近的消息中，确保模型不会忘记

### 四、O(N²) 成本问题与 Prompt Cache

#### 成本累积机制
```
第 1 次调用：上下文 1K tokens → 成本 $0.01
第 2 次调用：上下文 2K tokens → 成本 $0.02
第 3 次调用：上下文 3K tokens → 成本 $0.03
...
第 N 次调用：上下文 N*K tokens → 成本 $0.01*N

总成本 = 0.01 * (1 + 2 + 3 + ... + N) = 0.01 * N(N+1)/2 ≈ O(N²)
```

**缓存失效的代价**：已按缓存折扣价结算过的历史前缀按全价重算，会话越长、失效越频繁，重复计算占总成本的比例越高（“Don't Break the Cache”论文实测，prompt caching 正常生效时可节省 41-80% 成本，失效即反向损失同量级）。

#### Prompt Cache 原理
- 如果多次请求的 Prompt 前缀相同，提供商缓存前缀的计算结果
- 只计算新增部分，大幅降低成本（可达 90%）和延迟
- 但如果前缀改变（如压缩操作修改了历史记录），缓存失效，需要重新计算全部

#### 上下文管理对 Prompt Cache 的影响
- ❌ 滑动窗口：每次丢弃最旧消息，前缀改变 → 缓存失效
- ❌ 摘要压缩：压缩后历史记录改变 → 前缀改变 → 缓存失效
- ✅ 在消息末尾追加：前缀不变 → 缓存有效（只计算新增部分）

#### 优化策略
1. **减少压缩频率**：不要每步都压缩，设置较高的阈值（如 80%），减少压缩次数
2. **压缩后“稳定”一段时间**：压缩后不要立即又压缩，让缓存有时间生效
3. **把易变内容放在末尾**：System Prompt、摘要等“稳定”内容放在开头（缓存友好），对话历史等“易变”内容放在末尾
4. **使用提供商的原生压缩 API**：Anthropic、OpenAI 提供原生的上下文压缩 API，这些 API 设计时考虑了缓存友好性
5. **监控缓存命中率**：记录每次调用的缓存命中率，如果命中率低，分析原因（可能是压缩太频繁）

### 五、工具结果的特殊管理

工具结果是上下文中最容易“爆炸”的部分——一次搜索可能返回几千字，一次代码读取可能返回整个文件。

#### 工具结果管理策略
1. **限制工具返回长度**：在工具层面限制返回结果的长度（如搜索只返回前 3 条，代码只返回相关函数）
2. **保留最近的工具结果**：只保留最近 1-2 次工具调用的完整结果，更早的压缩或丢弃
3. **工具结果即时摘要**：工具返回后，立即用 LLM 提取关键信息，用摘要替换原始结果
4. **工具结果存在外部存储**：完整的工具结果存在外部存储（数据库/文件），上下文中只存摘要和引用 ID，需要时再检索
5. **工具调用参数保留**：即使丢弃工具结果，也要保留工具调用的参数（知道“调用了什么工具、传了什么参数”），这对理解对话历史很重要

---

## 四、最小可运行代码示例

### 滑动窗口 + 摘要压缩的混合上下文管理器

```python
# client/MODEL 沿用上节（compact_context 示例已定义，env 三件套见该节）
from openai import OpenAI
import tiktoken

client = OpenAI()
# tiktoken 只认 OpenAI 官方模型名做「模型名→分词器」映射，与实际调用哪家 provider 无关；
# 换其他 provider 时仍可用 gpt-4o 的分词器近似估算 Token 数
encoding = tiktoken.encoding_for_model("gpt-4o")

def count_tokens(messages: list) -> int:
    """计算消息列表的 Token 数"""
    total = 0
    for msg in messages:
        total += len(encoding.encode(msg["content"]))
        if "tool_calls" in msg:
            for tc in msg["tool_calls"]:
                total += len(encoding.encode(tc["function"]["arguments"]))
    return total

class ContextManager:
    """混合上下文管理器：滑动窗口 + 摘要压缩 + 工具结果处理"""

    def __init__(
        self,
        max_tokens: int = 128000,
        compact_threshold: float = 0.7,
        keep_recent_turns: int = 8,
        keep_recent_tool_results: int = 2,
        summary_model: str = MODEL,  # 演示与主模型同源；生产建议换成更便宜的小模型做摘要
    ):
        self.max_tokens = max_tokens
        self.compact_threshold = compact_threshold
        self.keep_recent_turns = keep_recent_turns
        self.keep_recent_tool_results = keep_recent_tool_results
        self.summary_model = summary_model
        self.summary = None  # 对话摘要

    def manage(self, messages: list) -> list:
        """管理上下文，返回适合发送给 LLM 的消息列表"""
        current_tokens = count_tokens(messages)

        # 如果未达阈值，直接返回
        if current_tokens < self.max_tokens * self.compact_threshold:
            return self._build_messages(messages)

        # 达到阈值，执行压缩
        print(f"[ContextManager] 上下文达到阈值 ({current_tokens}/{self.max_tokens})，开始压缩")

        # Step 1：压缩旧的工具结果
        messages = self._compact_tool_results(messages)

        # Step 2：如果仍超阈值，压缩旧对话为摘要
        if count_tokens(messages) > self.max_tokens * self.compact_threshold:
            messages = self._summarize_old_messages(messages)

        # Step 3：如果仍超阈值，滑动窗口兜底
        if count_tokens(messages) > self.max_tokens * 0.9:
            messages = self._sliding_window(messages)

        return self._build_messages(messages)

    def _compact_tool_results(self, messages: list) -> list:
        """压缩旧的工具结果，只保留最近的 N 个完整结果"""
        tool_result_count = 0
        result = []
        for msg in reversed(messages):  # 从后往前遍历
            if msg["role"] == "tool":
                tool_result_count += 1
                if tool_result_count > self.keep_recent_tool_results:
                    # 旧的工具结果，替换为摘要
                    summarized = msg["content"][:200] + "..." if len(msg["content"]) > 200 else msg["content"]
                    result.append({"role": "tool", "content": f"[工具结果摘要] {summarized}", "tool_call_id": msg.get("tool_call_id", "")})
                    continue
            result.append(msg)
        return list(reversed(result))

    def _summarize_old_messages(self, messages: list) -> list:
        """将旧对话压缩为摘要"""
        system_msg = messages[0]  # System Prompt
        keep_count = self.keep_recent_turns * 2  # 每轮 2 条消息

        if len(messages) <= keep_count + 1:
            return messages

        old_messages = messages[1:-keep_count]
        recent_messages = messages[-keep_count:]

        # 用 LLM 压缩旧消息
        old_text = "\n".join([f"{m['role']}: {m['content'][:500]}" for m in old_messages])
        prompt = f"""请将以下对话历史压缩为简洁摘要，保留：
1. 用户原始需求和目标
2. 关键决策和约束
3. 已完成工作和当前进度
4. 未解决问题

对话历史：
{old_text[:8000]}

摘要（不超过500字）："""

        resp = client.chat.completions.create(model=self.summary_model, messages=[{"role": "user", "content": prompt}])
        self.summary = resp.choices[0].message.content
        print(f"[ContextManager] 旧对话已压缩为摘要（{len(self.summary)}字）")

        summary_msg = {"role": "system", "content": f"[对话历史摘要]\n{self.summary}"}
        return [system_msg, summary_msg] + recent_messages

    def _sliding_window(self, messages: list) -> list:
        """滑动窗口：只保留最近的 N 条消息"""
        keep_count = self.keep_recent_turns * 2
        if len(messages) <= keep_count + 1:
            return messages
        print(f"[ContextManager] 滑动窗口：保留最近 {keep_count} 条消息")
        return [messages[0]] + messages[-keep_count:]

    def _build_messages(self, messages: list) -> list:
        """构建最终发送给 LLM 的消息列表"""
        # 如果有摘要但不在消息中，插入到 System Prompt 之后
        if self.summary and not any("[对话历史摘要]" in m.get("content", "") for m in messages):
            summary_msg = {"role": "system", "content": f"[对话历史摘要]\n{self.summary}"}
            return [messages[0], summary_msg] + messages[1:]
        return messages


# 使用示例
context_manager = ContextManager(max_tokens=128000, compact_threshold=0.7)

messages = [
    {"role": "system", "content": "你是一个编程助手。"},
    {"role": "user", "content": "帮我写一个 Python 爬虫"},
    # ... 很多轮对话后 ...
]

# 在每次调用 LLM 前，先管理上下文
managed_messages = context_manager.manage(messages)
response = client.chat.completions.create(model=MODEL, messages=managed_messages)
```

### 工具结果即时摘要（防止上下文爆炸）

```python
# client/MODEL 沿用上节（compact_context 示例已定义，env 三件套见该节）
def search_with_summary(query: str, max_length: int = 500) -> str:
    """搜索工具：返回结果后立即摘要，防止长结果撑爆上下文"""
    # 1. 执行搜索（可能返回很长的结果）
    raw_results = search_api(query)  # 可能返回 5000+ 字

    # 2. 立即用 LLM 摘要，只保留关键信息
    summary_prompt = f"""请从以下搜索结果中提取与查询相关的关键信息，保留：
1. 直接答案（如果有）
2. 关键数据和事实
3. 来源链接

查询：{query}
搜索结果：
{raw_results[:8000]}

摘要（不超过{max_length}字）："""

    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": summary_prompt}])
    summary = resp.choices[0].message.content

    # 3. 完整结果存在外部存储，返回摘要 + 引用 ID
    result_id = save_to_external_storage(raw_results)  # 存到数据库/文件
    return f"{summary}\n\n[完整结果ID: {result_id}，需要时可检索]"


# 使用：工具返回的已经是摘要，不会撑爆上下文
result = search_with_summary("Python 爬虫最佳实践")
print(result)  # 只有 500 字左右，而不是 5000 字
```

### 带 Token 预算分配的上下文管理器（生产级）

```python
class TokenBudgetManager:
    """Token 预算管理器：为上下文各部分分配预算，确保不超总预算"""

    def __init__(self, total_budget: int = 128000):
        self.total_budget = total_budget
        # 预算分配
        self.budgets = {
            "system_prompt": 4000,      # System Prompt
            "tool_definitions": 2000,    # 工具定义
            "current_request": 1000,     # 当前用户请求
            "conversation_history": 60000,  # 对话历史
            "tool_results": 30000,       # 工具结果
            "retrieved_docs": 20000,     # 检索文档
            "working_memory": 8000,      # 工作记忆/摘要
            "output_reserve": 4000,      # 输出预留
        }
        # 验证预算总和不超过总预算
        assert sum(self.budgets.values()) <= total_budget, "预算分配超过总预算"

    def check_budget(self, category: str, content: str) -> bool:
        """检查某类内容是否在预算内"""
        tokens = len(encoding.encode(content))
        return tokens <= self.budgets[category]

    def enforce_budget(self, category: str, messages: list) -> list:
        """强制执行某类内容的预算，超预算则压缩"""
        category_tokens = self._count_category_tokens(category, messages)
        budget = self.budgets[category]

        if category_tokens <= budget:
            return messages

        print(f"[BudgetManager] {category} 超预算 ({category_tokens}/{budget})，执行压缩")

        if category == "conversation_history":
            return self._compact_conversation(messages, budget)
        elif category == "tool_results":
            return self._compact_tool_results(messages, budget)
        elif category == "retrieved_docs":
            return self._compact_retrieved_docs(messages, budget)
        else:
            return messages  # 固定部分不压缩

    def _compact_conversation(self, messages: list, budget: int) -> list:
        """压缩对话历史到预算内"""
        # 实现：摘要压缩 + 滑动窗口
        ...

    def _compact_tool_results(self, messages: list, budget: int) -> list:
        """压缩工具结果到预算内"""
        # 实现：只保留最近 N 个，旧的摘要或丢弃
        ...

    def _compact_retrieved_docs(self, messages: list, budget: int) -> list:
        """压缩检索文档到预算内"""
        # 实现：重排序，只保留最相关的 Top-K
        ...

    def get_status(self) -> dict:
        """获取当前预算使用状态"""
        return {
            category: {
                "budget": budget,
                "used": self._count_category_tokens(category, self.current_messages),
                "usage_percent": self._count_category_tokens(category, self.current_messages) / budget * 100
            }
            for category, budget in self.budgets.items()
        }
```

---

## 五、易混概念对比表

| 策略 | 方法 | 保留信息 | 额外成本 | 延迟 | 适用场景 |
|------|------|---------|---------|------|---------|
| 滑动窗口 | 保留最近 N 条 | 最近信息完整，早期完全丢失 | 无 | 无 | 简单对话、短期任务 |
| 摘要压缩 | 旧内容压缩为摘要 | 关键信息保留，细节丢失 | 1 次 LLM 调用 | 中 | 长任务、需要长期记忆 |
| 混合策略 | 滑动窗口+摘要+重要性选择 | 重要信息完整，次要信息摘要 | 偶尔 LLM 调用 | 低 | 生产级系统 |
| 外部记忆 | 长期记忆存外部，按需检索 | 理论上无限，但检索可能遗漏 | 检索成本 | 中 | 超长时间任务 |
| 长上下文模型 | 用大窗口模型（200K/1M） | 全部保留 | 高 Token 成本 | 高（处理慢） | 简单但需要长上下文 |

| 维度 | 滑动窗口 | 摘要压缩 |
|------|---------|---------|
| 实现复杂度 | 极低 | 中 |
| 确定性 | 高（完全可预测） | 中（摘要质量有波动） |
| 额外 LLM 调用 | 无 | 有（压缩时） |
| 信息保留 | 差（早期完全丢失） | 中（关键信息保留） |
| 摘要漂移风险 | 无 | 有（摘要可能不准确） |
| Prompt Cache 影响 | 每次都改变前缀 | 压缩时改变前缀 |
| 适合对话长度 | 短（<10 轮） | 长（>10 轮） |

| 上下文组成部分 | 固定/动态 | 压缩策略 | 优先级 |
|--------------|----------|---------|--------|
| System Prompt | 固定 | 不压缩（永久保留） | 最高 |
| 工具定义 | 固定 | 不压缩（但可以动态加载） | 高 |
| 当前用户请求 | 动态 | 不压缩（必须完整） | 最高 |
| 对话历史 | 动态 | 滑动窗口 + 摘要压缩 | 中 |
| 工具结果 | 动态 | 保留最近 N 个，旧的摘要/丢弃 | 低（最容易压缩） |
| 检索文档 | 动态 | 重排序 + Top-K 截断 | 中 |
| 工作记忆/摘要 | 动态 | 定期更新，控制长度 | 中 |
| 输出预留 | 固定 | 必须预留 | 最高 |

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 上下文溢出报错 | 总 Token 超过窗口限制 | 滑动窗口兜底 + 提前压缩 |
| 模型“忘记”早期需求 | 滑动窗口丢弃了早期消息 | 摘要压缩保留关键需求 |
| 回答质量下降 | Lost in the Middle 效应 | 重要信息放开头/结尾，控制总长度 |
| Token 成本飙升 | O(N²) 累积 + 缓存失效 | 减少压缩频率，缓存友好设计 |
| 工具结果撑爆上下文 | 工具返回太长 | 即时摘要 + 限制返回长度 |
| 压缩后信息丢失 | 摘要不够详细 | 提高摘要质量，重要信息不压缩 |
| Prompt Cache 频繁失效 | 压缩操作改变前缀 | 减少压缩频率，稳定前缀 |

---

## 六、3个实战中的常见坑

### 坑 1：只在“快溢出”时才压缩，导致每次压缩都让 Prompt Cache 失效，成本反而更高

**现象**：团队实现了上下文压缩，但设置的阈值很高（90%），只有快溢出时才压缩。结果是：①压缩频率虽然低，但每次压缩都改变了大量历史记录，导致 Prompt Cache 完全失效；②压缩后上下文变小了，但随着对话继续，很快又达到阈值，又要压缩，又让缓存失效；③总成本反而比不压缩更高——缓存失效会让已按折扣价结算的历史按全价重算，长会话中重复计算可占账单大头。

#### 避坑
- **理解 Prompt Cache 的工作原理**：提供商缓存的是 Prompt 的**前缀**。如果前缀不变，只在末尾追加新内容，缓存有效（只计算新增部分，成本降低 50-90%）。如果前缀改变（如压缩修改了历史记录），缓存完全失效，需要重新计算全部内容。
- **压缩策略要“缓存友好”**：
  - 把**稳定的内容**（System Prompt、对话摘要）放在**开头**（前缀，缓存友好）
  - 把**易变的内容**（最近的对话历史）放在**末尾**（追加，不影响前缀）
  - 压缩时，尽量只修改**末尾**的内容，不要修改开头的稳定内容
- **设置合理的压缩阈值**：
  - 不要等到 90% 才压缩（那时要压缩的内容很多，前缀改变大）
  - 也不要太频繁（如 50% 就压缩，压缩次数多）
  - 推荐阈值：**60-70%**——有足够空间压缩，压缩量适中，前缀改变较小
- **压缩后“稳定”一段时间**：压缩后不要立即又压缩。让对话在压缩后的状态下运行一段时间（至少 10-20 轮），让缓存有时间生效。如果压缩后很快又要压缩，说明压缩比不够（摘要太长）或窗口太小
- **使用提供商的原生压缩 API**：Anthropic、OpenAI 等提供商提供原生的上下文压缩 API（如 Anthropic 的 Context Compaction）。这些 API 在设计时考虑了缓存友好性，比自己实现的压缩更高效
- **监控缓存命中率**：在日志中记录每次调用的缓存命中率（通常在 API 响应的 `usage` 字段中有 `cached_tokens`）。如果命中率持续低于 50%，分析原因——可能是压缩太频繁、前缀不稳定、或其他问题
- **类比**：就像手机的“应用预加载”——如果你每次都清理后台（压缩），下次打开应用就要重新加载（缓存失效，慢且费电）。如果你不清理后台（不压缩），内存会满（溢出）。最佳策略是：**只在内存快满时清理最不常用的应用（适度压缩），清理后让系统稳定运行一段时间（缓存生效）**

### 坑 2：摘要压缩时“摘要漂移”——LLM 摘要遗漏了关键约束，导致 Agent 后续行为偏离

**现象**：团队实现了摘要压缩，用 LLM 把旧对话压缩为摘要。但运行时发现：①压缩后 Agent“忘记”了用户最初的关键约束（如“不要用专业术语”、“输出要 JSON 格式”）；②摘要中遗漏了已做出的关键决策（如“已确定用 5 个章节结构”），导致 Agent 重复讨论已经决定的问题；③摘要中引入了 LLM 的“幻觉”——摘要里有一些原始对话中根本没有的内容，导致 Agent 基于错误信息行动。

#### 避坑
- **摘要 Prompt 要明确“必须保留什么”**：不要只说“请总结对话”，要明确列出必须保留的内容类别：
  ```
  请压缩以下对话历史，必须保留：
  1. 用户的原始需求和目标（特别是约束条件，如输出格式、语气、限制）
  2. 已做出的关键决策和约定（如结构、方案、分工）
  3. 已完成的工作和当前进度
  4. 未解决的问题和待办事项
  5. 用户明确强调的偏好和要求

  不要添加对话中没有的内容。如果某些信息不确定，标注为"待确认"。
  ```
- **关键约束不压缩，永久保留在 System Prompt 中**：用户的核心约束（如“输出 JSON 格式”、“不要泄露信息”）应该在对话开始时就提取出来，写入 System Prompt（或工作记忆），永久保留，不参与压缩。压缩的只是“对话过程”，不是“核心约束”
- **结构化摘要，而不是自由文本**：让 LLM 输出结构化的摘要（JSON 格式），包含固定字段（目标、约束、决策、进度、待办）。结构化摘要比自由文本更不容易遗漏关键信息，也更容易验证
  ```python
  class ConversationSummary(BaseModel):
      user_goal: str           # 用户目标
      key_constraints: list[str]  # 关键约束
      decisions_made: list[str]   # 已做决策
      progress: str            # 当前进度
      pending_items: list[str]    # 待办事项
  ```
- **摘要后验证**：压缩后，检查摘要中是否包含关键约束和决策。可以用简单的关键词检查（如“用户要求 JSON 格式”是否在摘要中），或用 LLM 验证（“以下摘要是否遗漏了原始对话中的关键约束？”）。如果遗漏，重新压缩或手动补充
- **保留“锚点”消息不压缩**：在对话历史中，标记一些“锚点”消息（如用户明确提出约束的消息、做出关键决策的消息），这些消息永远不压缩，完整保留。压缩的只是“普通”消息
- **用更强的模型做摘要**：摘要的质量很重要，用更强的模型（如 GPT-4o、Claude 3.5）做摘要，而不是用小模型。虽然摘要调用增加了成本，但摘要质量差导致的后续错误成本更高
- **类比**：就像会议纪要——如果会议纪要写得不好（遗漏了关键决策、记错了约定），后续没参加会议的人就会做错事。好的会议纪要应该：明确记录“决定了什么”、“谁负责什么”、“约束条件是什么”、“下一步做什么”。对话摘要也是一样，它是“后续 Agent 的会议纪要”，必须准确、完整、无幻觉

### 坑 3：工具结果没有特殊处理，一次搜索返回几千字，几次调用就撑爆上下文

**现象**：团队的 Agent 有搜索工具，每次搜索返回完整的搜索结果（可能 3000-5000 字）。运行时发现：①只需要 3-4 次搜索，工具结果就占了几万 Token，撑爆了上下文；②很多工具结果是 Agent 已经不需要的（如早期搜索的结果，后续已经基于它做了决策），但仍然完整保留在上下文中；③工具结果中大量是“无关信息”（如搜索结果的页面导航、广告、相关推荐），但 Agent 无法区分，全部保留。

#### 避坑
- **工具层面限制返回长度**：在工具实现时就限制返回结果的长度，不要把完整结果返回给 Agent：
  - 搜索工具：只返回 Top 3 结果，每条结果只返回标题+摘要（不返回全文）
  - 代码读取工具：只返回相关函数/类（不返回整个文件），或限制行数（如最多 200 行）
  - 数据库查询工具：只返回前 N 条记录（如最多 10 条）
- **工具结果即时摘要**：工具返回后，立即用 LLM 提取关键信息，用摘要替换原始结果。完整结果存在外部存储，上下文中只存摘要和引用 ID
  ```python
  def search_tool(query):
      raw_results = search_api(query)  # 可能 5000 字
      summary = llm_summarize(raw_results, query)  # 压缩到 500 字
      result_id = save_to_storage(raw_results)  # 完整结果存外部
      return f"{summary}\n[完整结果ID: {result_id}]"  # 只返回摘要
  ```
- **工具结果的滑动窗口**：只保留最近 1-2 次工具调用的完整结果，更早的工具结果压缩为摘要或直接丢弃。工具结果通常只在调用后的几步内需要，更早的结果 Agent 已经基于它做了决策，不需要再保留完整内容
- **工具调用参数必须保留**：即使丢弃工具结果，也要保留工具调用的参数（`tool_calls` 字段）。知道“调用了什么工具、传了什么参数”对理解对话历史很重要，比工具结果本身更重要
- **区分“工具结果”和“对话消息”的预算**：在 Token 预算中，给工具结果单独分配预算（如 30K），和对话历史（60K）分开管理。工具结果超预算时，优先压缩工具结果，而不是压缩对话历史
- **工具结果的“相关性”标记**：Agent 在使用工具结果后，可以标记“这个结果已经用过了，后续不需要”。被标记的工具结果可以优先压缩或丢弃
- **类比**：就像查资料做研究——你不会把所有查到的资料都打印出来堆在桌上（撑爆桌面），而是：①只复印最相关的几页（限制返回长度）；②在笔记本上记下关键信息（即时摘要）；③完整资料放在文件柜里（外部存储），需要时再取；④桌上只留最近正在看的资料（滑动窗口）。工具结果管理也是一样，“桌面”（上下文）有限，要聪明地管理

---

## 七、进阶问题（引导往下挖）

### 问题 1：随着模型上下文窗口越来越大（从 4K 到 200K 到 1M+），“上下文管理”还重要吗？会不会被“足够大的窗口”淘汰？

#### 引导思考
- **“更大的窗口”的诱惑**：
  - 窗口越大，能放的内容越多，似乎越不需要管理
  - 200K 窗口可以放约 15 万字，1M 窗口可以放约 75 万字
  - 很多人认为“窗口足够大就不需要上下文管理了”
- **但“大窗口”不等于“有效窗口”**：
  - **Lost in the Middle 效应**：即使窗口很大，模型对中间内容的注意力也会下降。Databricks Mosaic 实测显示多数模型的正确率拐点远低于标称窗口上限，且拐点因模型而异——远低于 200K 的窗口上限
  - **“大海捞针”问题**：上下文越大，关键信息被“淹没”的概率越高。就像在 1000 页的书里找一句话，比在 10 页的书里找难得多
  - **推理质量下降**：研究表明，当上下文超过一定长度后，模型的推理能力（逻辑、数学、多步推理）会下降，因为注意力被分散
  - **“看起来在上下文里”不等于“模型会用到”**：很多时候信息在上下文中，但模型没有注意到或没有正确使用
- **成本问题**：
  - 大窗口模型更贵（每 1K tokens 的成本更高）
  - 即使窗口大，每次调用都要处理全部上下文，O(N²) 成本问题更严重
  - 一个 1M 上下文的对话，单次调用可能就要几十美元
- **延迟问题**：
  - 上下文越大，模型处理越慢（需要更多的计算）
  - 200K 上下文的单次调用可能需要 30 秒以上，1M 可能需要几分钟
  - 对于交互式应用，这样的延迟是不可接受的
- **上下文管理的价值不会消失，反而更重要**：
  - **从“防止溢出”到“提升质量”**：窗口小的时候，上下文管理主要是“防止溢出报错”；窗口大的时候，上下文管理主要是“确保模型能注意到关键信息”（对抗 Lost in the Middle）
  - **从“节省空间”到“节省成本”**：窗口大了，但成本更高了。上下文管理可以确保“只把真正需要的信息放进上下文”，避免为无关信息付费
  - **从“简单滑动窗口”到“智能信息选择”**：大窗口时代，需要更智能的上下文管理——根据当前任务动态选择最相关的信息（RAG、自适应焦点记忆、重要性评分），而不是简单地“全放进去”
- **未来趋势：分层上下文架构**
  - **热层（Hot）**：当前任务最相关的信息，放在上下文开头和结尾（模型最关注），1K-4K tokens
  - **温层（Warm）**：近期对话和最近的工具结果，完整保留，10K-30K tokens
  - **冷层（Cold）**：历史对话和旧工具结果，压缩为摘要或存在外部存储，需要时检索
  - **冻结层（Frozen）**：System Prompt、关键约束、长期目标，永久保留在开头，永不压缩
  - 这种分层架构即使在 1M 窗口下也很有价值——它确保“模型的注意力集中在最重要的信息上”，而不是被无关信息分散
- **类比**：就像“图书馆”和“书桌”的关系——
  - 图书馆（大窗口）有几百万册书，你可以借任何书
  - 但你不会把所有书都搬到书桌上（上下文）——那样你找不到需要的书，而且搬运成本很高
  - 聪明的做法是：①把正在用的几本书放在书桌上（热层）；②把最近可能用到的书放在手边的书架上（温层）；③其他书留在图书馆书架上，需要时再去取（冷层）；④把字典、手册等常用参考书固定放在书桌一角（冻结层）
  - 即使图书馆有 100 万册书（1M 窗口），你仍然需要管理书桌（上下文）——因为书桌的有效空间（模型的有效注意力）是有限的
- 延伸：后续课程（Memory 记忆、RAG、生产级 Agent 架构设计）会深入讲解分层记忆和智能信息检索

### 问题 2：“上下文管理”和“记忆系统”（Memory）有什么区别和联系？生产级 Agent 应该如何设计两者的协作？

#### 引导思考
- **上下文管理（Context Management）的定义**：
  - 管理“当前 LLM 调用的上下文窗口”中的内容
  - 关注：什么信息放在当前上下文中、如何压缩、如何防止溢出
  - 范围：单次 LLM 调用的输入（System Prompt + 对话历史 + 工具结果 + 检索文档）
  - 目标：在有限的窗口内，放入最相关的信息，控制成本和延迟
- **记忆系统（Memory）的定义**：
  - 管理“Agent 的长期知识和经验”，存储在外部（数据库、向量库、文件）
  - 关注：什么信息需要长期记住、如何存储、如何检索、如何遗忘
  - 范围：跨会话、跨任务的持久化知识（用户偏好、历史决策、学习到的经验、实体关系）
  - 目标：让 Agent 拥有“长期记忆”，能从过去的经验中学习和参考
- **两者的区别**：
  | 维度 | 上下文管理 | 记忆系统 |
  |------|----------|---------|
  | 存储位置 | LLM 上下文窗口（内存） | 外部存储（数据库/向量库/文件） |
  | 持久性 | 临时（单次调用或单会话） | 持久（跨会话、跨任务） |
  | 容量 | 有限（4K-1M tokens） | 理论上无限 |
  | 访问速度 | 极快（直接在上下文中） | 较慢（需要检索） |
  | 管理目标 | 窗口内放什么、如何压缩 | 长期记住什么、如何检索 |
  | 类比 | 书桌（当前在用的东西） | 图书馆/文件柜（长期存放的东西） |
- **两者的联系**：
  - **记忆系统是上下文管理的“数据源”**：当上下文需要某些信息时，从记忆系统检索，注入到上下文中
  - **上下文管理是记忆系统的“访问层”**：上下文管理决定“什么时候从记忆系统检索什么”
  - **两者协作形成“分层记忆架构”**：
    ```
    LLM 上下文（热记忆）← 检索 ← 短期记忆（工作记忆）← 检索 ← 长期记忆（外部存储）
         ↑                      ↑                        ↑
      上下文管理              上下文管理                记忆系统
      （放什么、压缩）        （检索什么、注入）        （存什么、如何组织）
    ```
- **生产级 Agent 的协作设计**：
  - **第一层：LLM 上下文（热记忆）**
    - 内容：System Prompt、当前任务、最近 5-10 轮对话、最近 1-2 次工具结果、当前检索到的文档
    - 管理：上下文管理器（滑动窗口 + 摘要压缩 + Token 预算）
    - 容量：16K-64K tokens（模型的有效范围）
  - **第二层：工作记忆（温记忆）**
    - 内容：当前会话的完整对话历史、所有工具结果、会话级的关键决策和约束
    - 存储：内存或 Redis（会话级持久化）
    - 管理：上下文管理器在需要时从工作记忆检索，注入到 LLM 上下文
    - 容量：会话级，可能几百 K tokens
  - **第三层：长期记忆（冷记忆）**
    - 内容：用户偏好、历史决策、学习到的经验、实体关系、跨会话的知识
    - 存储：向量数据库（语义检索）+ 关系数据库（结构化数据）+ 文件（非结构化数据）
    - 管理：记忆系统（写入、检索、遗忘、更新）
    - 容量：理论上无限
  - **协作流程**：
    1. 用户发送请求
    2. 上下文管理器从长期记忆检索相关信息（用户偏好、历史经验）
    3. 上下文管理器从工作记忆获取当前会话历史
    4. 上下文管理器组装 LLM 上下文（System Prompt + 检索到的长期记忆 + 最近的对话历史 + 当前请求），确保在 Token 预算内
    5. LLM 生成回复，可能调用工具
    6. 工具结果先存入工作记忆，再按需注入 LLM 上下文
    7. 会话结束时，关键信息（用户偏好、新学到的知识）从工作记忆写入长期记忆
    8. 下次会话时，从长期记忆检索相关信息，注入上下文
- **关键设计原则**：
  - **不要把所有记忆都放进上下文**：上下文是“稀缺资源”，只放当前任务最相关的信息
  - **检索是记忆系统的核心能力**：长期记忆的价值在于“能在需要时找到”，而不是“存得多”。好的检索（语义检索 + 元数据过滤 + 重排序）比大存储更重要
  - **记忆要有“遗忘机制”**：不是所有信息都值得永久记住。过时的信息、错误的信息、低价值的信息应该被遗忘或降级存储
  - **上下文管理和记忆系统要解耦**：上下文管理器不需要知道记忆是怎么存储的，只需要“给我相关的信息”；记忆系统不需要知道上下文是怎么管理的，只需要“存好、能检索到”。两者通过清晰的接口协作
- **类比**：就像“人的记忆系统”——
  - **工作记忆（上下文）**：你当前正在思考的内容，容量有限（7±2 个组块），持续时间短
  - **短期记忆（工作记忆层）**：你最近经历的事情，容量较大，持续几小时到几天
  - **长期记忆（记忆系统）**：你多年积累的知识和经验，容量几乎无限，持续时间长
  - **协作**：当你解决一个问题时，你会从长期记忆中检索相关的知识和经验，放到工作记忆中思考。工作记忆满了，你会把不重要的内容“忘掉”（压缩），只保留最相关的。解决完问题后，重要的经验会写入长期记忆
  - Agent 的上下文管理 + 记忆系统，就是在模拟人的记忆分层架构
- 延伸：后续课程（Memory 记忆、RAG、生产级 Agent 架构设计）会深入讲解记忆系统的设计和实现

---

## 八、四关自测

### 复述关（3句话讲清）
1. 上下文窗口是 Agent 最宝贵的有限资源，不是“越大越好”——当对话变长时，System Prompt、对话历史、工具结果会累积，要么溢出报错，要么因“中间遗忘（Lost in the Middle）”效应让质量下降，Databricks Mosaic 实测显示多数模型的正确率拐点远低于标称窗口上限，且拐点因模型而异。
2. 三大核心策略：滑动窗口（只留最近 N 条，最简单但忘早期）、摘要压缩（达阈值用 LLM 把旧内容压成摘要保留关键决策）、混合策略（工具结果压缩→摘要→滑动窗口兜底），是生产级标准做法。
3. 隐藏成本炸弹是 O(N²) Token 累积——每次调用都重传全部历史，Prompt Cache 失效会让已缓存的历史按全价重算，是长会话成本失控的主因之一；所以上下文管理不只是防溢出，更是控成本和保质量。

### 举例关（真实场景）
你做一个长会话的编程助手 Agent，连续聊了 50 轮，每次搜索还返回 5000 字的网页结果。几次调用后上下文就爆了。正确做法：工具返回后立即用小模型压成 500 字摘要存外部、完整结果只留引用 ID；对话达到 70% 阈值时把旧对话压成“已决定用 5 章节结构、当前在写第 3 章”的摘要；最近 8 轮完整保留；System Prompt 和关键约束永久放开头（缓存友好）。这样既不溢出、成本也不爆炸。

### 反例关（边界条件）
只在快溢出（90%）时才压缩，结果每次压缩都大改历史记录、把 Prompt Cache 前缀改得面目全非，缓存全失效，成本反而比不压缩还高。另外，摘要压缩时 LLM 把用户的关键约束（“输出 JSON、不要用术语”）漏了或加了幻觉（摘要里有原始对话没有的内容），Agent 后续基于错误摘要瞎干——这就是“摘要漂移”，必须把核心约束单独提取永久保留、用结构化摘要防遗漏。

### 教学关（给小白讲）
上下文窗口就像你的办公桌桌面，面积有限。桌上长期摆着工作手册（System Prompt）和工具说明书（工具定义），越旧的对话记录越堆在左边。桌面满了有三种办法：把最旧的纸直接扔了（滑动窗口）、把旧笔记整理成一张摘要便签（摘要压缩）、或者先把最厚的搜索资料收进文件柜只留要点（工具结果压缩）。注意：每次你干活都得把桌上所有东西重新看一遍，所以桌上文件越多越费时间费钱（O(N²)）；而且你最容易看清的是桌面正中间和刚放上去的东西，中间偏左的旧纸最容易被忽略（Lost in the Middle）。

---

## 资料来源

- 技术博客: [Athenic — Building Conversational AI Agents: Context Management](https://getathenic.com/blog/building-conversational-ai-agents-context-management)
- 技术博客: [Zylos AI — Context Engineering for AI Agents: From Craft to Production Discipline](https://zylos.ai/research/2026-06-26-context-engineering-ai-agents-production-discipline/)
- 技术博客: [Zylos AI — Agent Context Compaction for Long-Running Sessions](https://zylos.ai/research/2026-04-21-agent-context-compaction-long-running-sessions/)
- 技术博客: [AI/TLDR — What Is Context Compaction?](https://ai-tldr.dev/learn/ai-agents/planning-and-memory/context-compaction-explained/)
- 官方文档: [Microsoft Learn — Agent Framework Conversation Compaction](https://learn.microsoft.com/pt-br/agent-framework/concepts/agents/conversations/compaction)
- 教程: [Ran Wei — Module 7: Memory & Context Management](https://wrwei.github.io/tutorials/agent/module_07_EN.html)
- 论文: [arXiv:2511.04919 — BudgetMem: Training-Free Selective Memory for Cost-Efficient Long-Context Processing in Language Models](https://arxiv.org/abs/2511.04919)
- 论文: [arXiv:2307.03172 — Lost in the Middle: How Language Models Use Long Contexts（效应的原始出处）](https://arxiv.org/abs/2307.03172)
- 论文: [arXiv:2601.06007 — Don't Break the Cache（prompt caching 节省 41-80% 成本的量化来源）](https://arxiv.org/html/2601.06007v2)
- 官方博客: [Databricks — Long-Context RAG Performance of LLMs（正确率拐点实测数据的原始出处）](https://www.databricks.com/blog/long-context-rag-performance-llms)
- 官方博客: [OpenAI — From model to agent: Equipping the Responses API with a computer environment（Responses API 原生压缩与 /compact 端点）](https://openai.com/index/equip-responses-api-computer-environment/)
- 官方文档: [Anthropic — Context editing（clear_tool_uses / server-side compaction）](https://platform.claude.com/docs/en/build-with-claude/context-editing)
- 论文: [arXiv:2511.12712 — Adaptive Focus Memory for Language Models](https://arxiv.org/html/2511.12712v2/)
- 论文: [Preprints — Context Compression for Long-Horizon AI Agents](https://www.preprints.org/manuscript/202607.0924)
- 权威媒体: [腾讯新闻 — 横向拆解六大 Agent 上下文压缩策略](http://news.qq.com/rain/a/20260608A07HSX00)

> 来源核验 2026-11-25：全部外链逐一联网核验可访问，论文标题按 arXiv 原文校准；存疑数字保留原文标注。技术结论与官方文档不一致时以官方为准。
