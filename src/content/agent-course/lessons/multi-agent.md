## 一、结论前置
1. **Multi-Agent（多智能体）是让多个 LLM Agent 像团队一样协作完成任务 —— 每个 Agent 有专门的角色和工具，通过通信协议交换信息，共同达成目标**。核心优势是「分工专业化」和「交叉验证」：前端 Agent 专门写前端，后端 Agent 专门写后端，评审 Agent 专门检查错误 —— 比一个「全能但不精」的单 Agent 质量更高。
2. **多智能体的三大协作模式**：①**Supervisor（主管模式）**—— 一个主管 Agent 分配任务、汇总结果，其他专业 Agent 执行（最常用、最可控）；②**Peer-to-Peer（对等模式）**—— Agent 之间平等对话、自由交接（最灵活、但容易发散）；③**Hierarchical（分层模式）**—— 多层级架构，战略层→规划层→执行层（适合超大型项目）。
3. **多智能体的核心机制是角色分工 + 通信 + 共识**。角色分工让每个 Agent 专注一个领域（CrewAI 像写职位描述一样定义 Agent）；通信让 Agent 交换信息（AutoGen 的消息传递、共享黑板）；共识解决分歧（辩论、投票、评审）。但多智能体不是银弹 —— 它引入了协调成本、通信开销、调试难度，很多时候优化单 Agent 比引入多 Agent 更有效。

---

## 二、通俗类比 + 专业定义
### 通俗类比
单 Agent 像一个刚毕业的全栈工程师 —— 什么都懂一点，但写前端不如专业前端，做测试不如专业 QA。多智能体就是组建一支小团队：产品经理（Supervisor）负责拆任务和验收，前端、后端、测试各自领活，做完互相评审。好处是专业的人干专业的事，还能交叉检查出错；坏处是「开会沟通」本身要花时间和钱 —— 小活儿一个人干反而更快。

### 专业定义
| 概念 | 定义 |
| --- | --- |
| **Multi-Agent System（多智能体系统）** | 由多个自主的 LLM Agent 组成的系统，每个 Agent 有独立的角色、目标、工具和上下文，通过通信协议交换信息，通过协调机制共同完成单个 Agent 难以完成的复杂任务。 |
| **Role Assignment（角色分工）** | 为每个 Agent 定义明确的角色、职责、目标和工具范围。通常基于「职位描述」模式 —— 像招聘员工一样定义 Agent 的角色（如「你是一个资深前端工程师，擅长 React 和 TypeScript」）。 |
| **Communication Protocol（通信协议）** | 定义 Agent 之间如何交换信息的规则。包括：消息传递（AutoGen 的 send/receive）、共享记忆 / 黑板（Blackboard）、直接对话、MCP / A2A 等标准协议。 |
| **Coordination Mechanism（协调机制）** | 定义如何组织和管理多个 Agent 的行为。包括：集中式（Supervisor 分配）、分布式（对等协商）、分层式（多层级管理）。 |
| **Consensus（共识）** | 多个 Agent 产生分歧时，达成一致决策的过程。包括：投票（多数 / 加权）、辩论（多轮讨论）、评审（上级 / 元评审决策）、证据-based（谁的证据充分听谁的）。 |
| **Debate（辩论）** | 一种多 Agent 协作模式：多个 Agent 被分配对立或不同的观点，通过多轮结构化讨论（提出论点→反驳→修正）探索问题，最终达成共识或由裁判决策。Du et al. 2023 提出。 |
| **Voting（投票）** | 一种共识机制：多个 Agent 独立解决同一问题，然后通过投票（多数投票、加权投票、排序选择）决定最终答案。简单高效，但可能忽略少数派的正确观点。 |
| **Mixture-of-Agents（MoA）** | 一种多 Agent 架构（ICLR 2025 Spotlight）：多个 Agent 分层协作，前一层的输出作为后一层的输入参考，通过逐层精炼提升答案质量。 |

---

## 三、底层机制
### 一、多智能体的三大协作模式
```text
模式 1：Supervisor（主管模式）—— 最常用
┌─────────────────────────────────────┐
│           Supervisor Agent           │
│         （分配任务、汇总结果）         │
└──────┬────────┬────────┬───────────┘
       ↓        ↓        ↓
   ┌───────┐ ┌───────┐ ┌───────┐
   │Agent A│ │Agent B│ │Agent C│
   │(前端) │ │(后端) │ │(测试) │
   └───────┘ └───────┘ └───────┘
特点：集中控制、易调试、可审计
适用：任务可明确分解、需要人工监督

模式 2：Peer-to-Peer（对等模式）—— 最灵活
┌───────┐ ←→ ┌───────┐ ←→ ┌───────┐
│Agent A│    │Agent B│    │Agent C│
└───────┘    └───────┘    └───────┘
   ↓              ↓              ↓
任意 Agent 可以自由交接给任意其他 Agent
特点：灵活、探索性强、但容易发散
适用：开放式探索、创意生成、不确定环境

模式 3：Hierarchical（分层模式）—— 超大型项目
┌─────────────────────┐
│   战略层（CEO Agent） │  决定方向和目标
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   规划层（PM Agent）  │  制定计划和分配
└──────┬────────┬─────┘
       ↓        ↓
┌─────────┐ ┌─────────┐
│ 执行层A  │ │ 执行层B  │  具体执行
└─────────┘ └─────────┘
特点：可扩展、适合超大型项目、但层级多延迟高
适用：大型软件开发、复杂企业流程
```

### 二、角色分工（Role Assignment）
**CrewAI 的角色驱动模型**：像写职位描述一样定义 Agent
```python
# CrewAI 风格的 Agent 定义（概念示例）
frontend_agent = Agent(
    role="资深前端工程师",
    goal="高质量完成前端页面开发",
    backstory="你有 10 年前端开发经验，精通 React、TypeScript 和 Tailwind CSS，注重代码质量和用户体验",
    tools=[read_file, write_file, run_tests],  # 只有前端相关工具
    verbose=True
)

backend_agent = Agent(
    role="后端工程师",
    goal="设计和实现可扩展的后端 API",
    backstory="你擅长 Node.js 和 PostgreSQL，关注性能和安全",
    tools=[read_file, write_file, run_tests, query_database],
)

tester_agent = Agent(
    role="测试工程师",
    goal="确保代码质量，发现潜在 bug",
    backstory="你有丰富的测试经验，擅长单元测试和集成测试",
    tools=[run_tests, read_file, write_test],
)
```
#### 角色分工的关键原则
1. **角色明确**：每个 Agent 有清晰的职责边界，不重叠
2. **工具按角色分配**：前端 Agent 只有前端工具，后端 Agent 只有后端工具 —— 工具少了选择更准
3. **上下文隔离**：每个 Agent 有独立的上下文，只看到和自己角色相关的信息 —— 减少干扰
4. **专业深度**：通过 backstory 和 system prompt 引导 Agent 调用特定领域的知识
5. **避免「全能 Agent」**：不要让一个 Agent 什么都做 —— 那又退化成单 Agent 了

### 三、通信协议（Communication）
#### 方式 1：消息传递（Message Passing）—— AutoGen 风格
```text
Agent A.send("我需要用户数据") → Agent B.receive()
Agent B.send("用户数据是 {...}") → Agent A.receive()
```
- 每个 Agent 有 `send()` 和 `receive()` 方法
- Agent 之间直接交换消息
- 优点：简单、直接、灵活
- 缺点：通信路径复杂时难以管理
#### 方式 2：共享黑板（Blackboard）—— 共享记忆
```text
┌─────────────────────────────────┐
│         Blackboard（共享记忆）     │
│  - 任务状态                       │
│  - 中间结果                       │
│  - 文档/文件                      │
└──────┬────────┬────────┬────────┘
       ↓        ↓        ↓
   Agent A   Agent B   Agent C
   写入结果   读取结果   写入结果
```
- 所有 Agent 共享一个中央记忆 / 存储
- Agent 通过读写黑板交换信息
- 优点：解耦（Agent 不需要知道彼此的存在）、信息持久化
- 缺点：可能有并发冲突、需要管理读写权限
#### 方式 3：标准协议（MCP / A2A）
- **MCP（Model Context Protocol）**：Agent 与工具 / 数据源之间的标准协议
- **A2A（Agent-to-Agent）**：Google 于 2025 年提出的 Agent 之间通信协议
- 优点：标准化、可互操作、跨框架
- 缺点：协议仍在演进中

### 四、共识机制（Consensus）
#### 方式 1：辩论（Debate）—— Du et al. 2023
#### 辩论流程图（独立作答 → 交叉阅读修正 → 多轮迭代 → 裁决）
```text
                       问题 / 任务
                            ↓
      ┌─────────────────────┼─────────────────────┐
      ↓                     ↓                     ↓
┌──────────┐          ┌──────────┐          ┌──────────┐
│ Agent 1  │          │ Agent 2  │          │ Agent 3  │
│ 独立作答 │          │ 独立作答 │          │ 独立作答 │
└─────┬────┘          └─────┬────┘          └─────┬────┘
      └─────────────────────┼─────────────────────┘
                            ↓
              ┌───────────────────────────┐
              │ 交叉阅读其他 Agent 的答案 │
              │ 多轮迭代修正（Round 1→N） │
              └─────────────┬─────────────┘
                            ↓ 收敛或达到最大轮数
                  ┌────────────────────┐
                  │ 最终裁决（收敛后） │
                  │多数投票 / 裁判 LLM │
                  └─────────┬──────────┘
                            ↓
                        最终答案
```
**效果**：提高事实性和推理准确性，减少幻觉。Agent 在看到其他 Agent 的不同观点后，会修正自己的错误。
#### 方式 2：投票（Voting）

| 投票方式 | 方法 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 多数投票 | 超过半数的选项获胜 | 简单高效 | 可能忽略少数派正确观点 |
| 加权投票 | 按 Agent 专业度 / 可靠性加权 | 更合理 | 权重难校准 |
| 排序选择 | Agent 对选项排序，计票 | 能捕捉偏好强度 | 复杂 |

#### 投票流程图
```text
                       问题 / 任务
                            ↓
      ┌─────────────────────┼─────────────────────┐
      ↓                     ↓                     ↓
┌──────────┐          ┌──────────┐          ┌──────────┐
│ Agent 1  │          │ Agent 2  │          │ Agent 3  │
│ 独立作答 │          │ 独立作答 │          │ 独立作答 │
└─────┬────┘          └─────┬────┘          └─────┬────┘
      ↓                     ↓                     ↓
    答案 A               答案 B                 答案 C
      └─────────────────────┼─────────────────────┘
                            ↓
                 ┌────────────────────┐
                 │聚合计票（互不通告）│
                 │ 多数/加权/排序选择 │
                 └──────────┬─────────┘
                            ↓
                        最终答案
```
**特点**：Agent 之间零通信、可并行，通信开销最低；但「一轮定胜负」，无法像辩论那样看到别人观点后自我修正。
#### 方式 3：评审（Review）—— MARS 框架
#### 评审流程图（Author → 独立评审 → Meta-Reviewer → 修改循环）
```text
                  ┌────────────────────┐
                  │   Author Agent     │
                  │    生成初始方案    │
                  └─────────┬──────────┘
                            ↓
      ┌─────────────────────┼─────────────────────┐
      ↓                     ↓                     ↓
┌──────────┐          ┌──────────┐          ┌──────────┐
│Reviewer 1│          │Reviewer 2│          │Reviewer 3│
│ 独立评审 │          │ 独立评审 │          │ 独立评审 │
└─────┬────┘          └─────┬────┘          └─────┬────┘
      └─────────────────────┼─────────────────────┘
                            ↓ （评审员互不通信，减少开销）
                  ┌────────────────────┐
                  │   Meta-Reviewer    │
                  │ 汇总意见做最终决策 │
                  └─────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │ 通过 → 输出最终方案 │
                 │未通过 → Author 修改 │
                 │ （最多 N 轮循环）   │
                 └─────────────────────┘
```
**优点**：比辩论通信开销小（评审员独立工作），质量高（多视角检查）。
#### 方式 4：冲突解决策略

| 策略 | 方法 | 适用场景 |
| --- | --- | --- |
| 投票 | 多数 / 加权投票 | 有多个候选方案 |
| 层级 | 指定上级 Agent 决策 | 有明确层级的系统 |
| 证据-based | 谁的证据充分听谁的 | 事实性问题 |
| 升级人工 | 冲突无法解决时请人决策 | 高风险 / 高不确定性 |

#### 冲突解决流程图（按冲突类型选择决策路径）
```text
     Agent 之间产生分歧 / 冲突
                 ↓
           判断冲突类型
                 ├─ 有多个候选方案 ───→ 投票（多数 / 加权）
                 ├─ 有明确层级 ─────→ 上级 Agent 裁决
                 ├─ 事实性问题 ─────→ 证据-based（证据充分者胜）
                 └─ 高风险/无法解决 → 升级人工决策
                 ↓
         冲突解决，继续执行
```

### 五、典型多智能体框架
| 框架 | 开发者 | 核心思想 | 特点 |
| --- | --- | --- | --- |
| **AutoGen** | 微软 | 对话驱动 | Agent 之间自由对话，灵活，适合探索性任务 |
| **CrewAI** | 开源社区 | 角色驱动 | 像写职位描述一样定义 Agent，YAML 配置，适合团队结构的工作流 |
| **MetaGPT** | 开源社区 | SOP 流水线 | 把软件开发流程（产品经理→架构师→工程师→测试）编码为 SOP，适合软件开发 |
| **LangGraph** | LangChain | 图编排 | 用有向图定义 Agent 之间的控制流，灵活可控，适合生产级 |
| **Camel** | 开源社区 | 角色扮演 | 两个 Agent 扮演不同角色（如用户 + 助手），通过对话完成任务 |

---

## 四、最小可运行代码示例
以下 6 组 demo 覆盖全部协作模式（Supervisor / 对等 / 分层）与共识机制（辩论 / 投票 / 评审）。
### Supervisor 模式（主管分配任务）
```python
import os
from openai import OpenAI

# 用自己的 provider 跑通本示例（任何 OpenAI 兼容接口均可）：
#   export OPENAI_API_KEY=sk-xxx        # 你的 key
#   export OPENAI_BASE_URL=https://...  # 接口地址（用 openai 官方可省略）
#   export LLM_MODEL=doubao-pro-32k     # 模型名，按你的 provider 填
client = OpenAI()  # 自动读取 OPENAI_API_KEY / OPENAI_BASE_URL
MODEL = os.environ["LLM_MODEL"]

# 三个专业 Agent
def researcher(query: str) -> str:
    """研究员：搜索和整理信息"""
    prompt = f"你是一个研究员。请搜索并整理以下主题的关键信息：{query}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def writer(information: str) -> str:
    """撰稿人：根据信息写文章"""
    prompt = f"你是一个撰稿人。请根据以下信息写一篇 500 字的文章：\n{information}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def editor(article: str) -> str:
    """编辑：审校文章"""
    prompt = f"你是一个编辑。请审校以下文章，修正错误并改进表达：\n{article}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def supervisor(task: str) -> str:
    """主管 Agent：分配任务、汇总结果"""
    print(f"[主管] 收到任务：{task}")

    # 步骤 1：分配给研究员
    print("[主管] 分配任务给研究员...")
    info = researcher(task)
    print(f"[研究员] 完成，信息长度：{len(info)} 字")

    # 步骤 2：分配给撰稿人
    print("[主管] 分配任务给撰稿人...")
    article = writer(info)
    print(f"[撰稿人] 完成，文章长度：{len(article)} 字")

    # 步骤 3：分配给编辑
    print("[主管] 分配任务给编辑...")
    final = editor(article)
    print("[编辑] 完成审校")

    # 汇总结果
    print("[主管] 任务完成，汇总结果")
    return final

# 使用
result = supervisor("人工智能的发展历史和未来趋势")
print(f"\n最终文章：\n{result}")
```

### 对等模式（Peer-to-Peer 自由交接）

```python
# client/MODEL 沿用上节（Supervisor 示例已定义，env 三件套见该节）
from openai import OpenAI
client = OpenAI()

SKILLS = {
    "researcher": "擅长搜集和整理资料",
    "writer": "擅长把资料写成文章",
    "editor": "擅长审校和改进文章",
}

def peer_agent(name: str, task: str, history: list) -> tuple:
    """一个平级 Agent：自己决定继续交接给谁，还是宣布任务完成"""
    peers = {k: v for k, v in SKILLS.items() if k != name}
    context = "\n".join(history) or "（暂无）"
    prompt = f"""你是 {name}，你{SKILLS[name]}。
同伴：{peers}
任务：{task}
已有进展：
{context}
请按以下格式回答：
HANDOFF: <同伴名字；若你认为任务已完成，填 DONE>
CONTRIBUTION: <你这轮的贡献>"""
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    handoff, contrib = "DONE", ""
    for line in resp.choices[0].message.content.splitlines():
        if line.startswith("HANDOFF:"):
            handoff = line.split(":", 1)[1].strip()
        elif line.startswith("CONTRIBUTION:"):
            contrib = line.split(":", 1)[1].strip()
    return handoff, contrib

def peer_collaboration(task: str, start: str = "researcher", max_rounds: int = 6) -> str:
    """对等协作：没有主管，任意 Agent 可交接给任意 Agent；用最大轮次防止无限发散"""
    current, history = start, []
    for round_num in range(1, max_rounds + 1):
        handoff, contrib = peer_agent(current, task, history)
        history.append(f"[{current}] {contrib}")
        print(f"[第 {round_num} 轮] {current} → 交接给 {handoff}")
        if handoff == "DONE" or handoff not in SKILLS:
            break
        current = handoff
    print("[对等协作结束]")
    return "\n".join(history)

# 使用
result = peer_collaboration("写一篇 300 字的 AI Agent 科普短文")
print(f"\n各轮贡献：\n{result}")
```

### 分层模式（Hierarchical 战略层→规划层→执行层）

```python
# client/MODEL 沿用上节（Supervisor 示例已定义，env 三件套见该节）
from openai import OpenAI
client = OpenAI()

def ceo_agent(goal: str) -> str:
    """战略层：决定方向，把总目标拆成 2-3 个子目标"""
    prompt = f"你是 CEO Agent。总目标：{goal}\n请拆成 2 个子目标，每行一个，格式：子目标N: 描述"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def pm_agent(sub_goal: str) -> list:
    """规划层：把每个子目标拆成可执行步骤，分配给执行层"""
    prompt = f"你是 PM Agent。子目标：{sub_goal}\n请给出 2 个可执行步骤，每行一个，格式：步骤N: 描述"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return [line for line in resp.choices[0].message.content.splitlines() if line.strip()]

def worker_agent(step_desc: str) -> str:
    """执行层：具体干活"""
    prompt = f"你是执行 Agent。请完成该步骤并简要输出结果：{step_desc}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def hierarchical(goal: str) -> str:
    """分层协作：战略层 → 规划层 → 执行层，逐层下发、逐层汇总"""
    print("[战略层] CEO 拆解目标...")
    sub_goals = [line for line in ceo_agent(goal).splitlines() if line.strip()]
    results = []
    for sg in sub_goals:
        print(f"[规划层] PM 展开：{sg[:30]}...")
        for step_desc in pm_agent(sg):
            print(f"[执行层] 执行：{step_desc[:30]}...")
            results.append(worker_agent(f"{sg} → {step_desc}"))
    print("[分层协作完成]")
    return "\n\n".join(results)

# 使用
final = hierarchical("为一家咖啡店做一份线上推广方案")
print(f"\n执行结果汇总：\n{final}")
```

### 多 Agent 辩论（Debate）
```python
# client/MODEL 沿用上节（Supervisor 示例已定义，env 三件套见该节）
from openai import OpenAI

client = OpenAI()

def agent_answer(question: str, role: str, context: str = "") -> str:
    """单个 Agent 生成答案"""
    prompt = f"你是一个{role}。请回答以下问题：{question}\n{context}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def multi_agent_debate(question: str, n_agents: int = 3, n_rounds: int = 2) -> str:
    """多 Agent 辩论：独立回答→交叉阅读→多轮迭代→投票"""
    roles = ["逻辑严谨的分析师", "创新思维的思想家", "经验丰富的实践者"]

    # Round 0：独立回答
    answers = []
    for i in range(n_agents):
        ans = agent_answer(question, roles[i])
        answers.append(ans)
        print(f"[Round 0] Agent {i+1} ({roles[i]})：{ans[:50]}...")

    # 多轮辩论
    for round_num in range(1, n_rounds + 1):
        new_answers = []
        context = "\n".join([f"Agent {i+1} 的答案：{a}" for i, a in enumerate(answers)])
        for i in range(n_agents):
            # 阅读其他 Agent 的答案，修正自己的
            ans = agent_answer(question, roles[i], f"其他 Agent 的答案：\n{context}\n请参考其他观点，修正或坚持你的答案。")
            new_answers.append(ans)
            print(f"[Round {round_num}] Agent {i+1} 修正后：{ans[:50]}...")
        answers = new_answers

    # 最终投票（这里简化为 LLM 裁判综合，实际也可提取关键结论做多数投票）
    print("\n[辩论结束] 综合各 Agent 观点...")
    final_prompt = f"问题：{question}\n各 Agent 最终答案：\n" + "\n".join([f"Agent {i+1}：{a}" for i, a in enumerate(answers)]) + "\n请综合以上观点，给出最终答案。"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": final_prompt}])
    return resp.choices[0].message.content

# 使用
result = multi_agent_debate("人工智能会取代程序员吗？", n_agents=3, n_rounds=2)
print(f"\n最终答案：\n{result}")
```

### 多数投票（Voting 独立作答→计票）

```python
import re
from collections import Counter
# client/MODEL 沿用上节（Supervisor 示例已定义，env 三件套见该节）
from openai import OpenAI
client = OpenAI()

def independent_answer(question: str, style: str) -> str:
    """一个 Agent 独立作答，互不通告"""
    prompt = f"你是一个{style}。请回答问题，并在最后一行用「答案：X」给出结论（X 为 A/B/C）。\n问题：{question}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def extract_choice(text: str) -> str:
    """从回答末尾提取选项字母"""
    found = re.findall(r"答案：([ABC])", text)
    return found[-1] if found else "?"

def majority_vote(question: str, n_agents: int = 5) -> str:
    """多数投票：N 个 Agent 独立回答 → 提取选项 → 计票取众数；Agent 之间零通信、可并行"""
    styles = ["严谨的逻辑学家", "务实的数据分析师", "谨慎的风险评估师", "富有创意的策略师", "经验丰富的行业顾问"]
    votes = []
    for i in range(n_agents):
        choice = extract_choice(independent_answer(question, styles[i % len(styles)]))
        votes.append(choice)
        print(f"[Agent {i+1}] 投票：{choice}")
    tally = Counter(votes)
    winner, count = tally.most_common(1)[0]
    print(f"[计票] {dict(tally)} → 多数答案 {winner}（{count}/{n_agents} 票）")
    return winner

# 使用
question = "个人开发者冷启动更适合哪种方式：A 内容自媒体，B 付费投流，C 社区运营？"
winner = majority_vote(question)
print(f"\n多数票答案：{winner}")
```

### 评审模式（Author-Reviewer-MetaReviewer）
```python
import json
# client/MODEL 沿用上节（Supervisor 示例已定义，env 三件套见该节）
from openai import OpenAI
client = OpenAI()

def author(task: str) -> str:
    """作者：生成初始方案"""
    prompt = f"你是一个开发者。请完成以下任务，给出代码方案：{task}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def reviewer(solution: str, focus: str) -> dict:
    """评审员：独立评审，返回决策和意见"""
    prompt = f"""你是一个{focus}评审专家。请评审以下代码方案：
{solution}
请输出 JSON 格式：
{{"decision": "approve/reject", "comments": "具体评审意见", "confidence": 0-1}}"""
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    try:
        return json.loads(resp.choices[0].message.content)
    except Exception:
        return {"decision": "reject", "comments": "评审格式错误", "confidence": 0.5}

def meta_reviewer(solution: str, reviews: list) -> dict:
    """元评审：汇总所有评审意见，做最终决策"""
    reviews_text = "\n".join([f"评审员{i+1}：决策={r['decision']}, 意见={r['comments']}, 置信度={r['confidence']}" for i, r in enumerate(reviews)])
    prompt = f"""你是元评审。请汇总以下评审意见，做最终决策。
代码方案：{solution[:500]}...
评审意见：
{reviews_text}
请输出 JSON：{{"final_decision": "approve/reject", "summary": "汇总意见", "action_items": ["需要修改的点"]}}"""
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    try:
        return json.loads(resp.choices[0].message.content)
    except Exception:
        return {"final_decision": "reject", "summary": "元评审格式错误", "action_items": []}

def review_pipeline(task: str, max_revisions: int = 2) -> str:
    """评审流水线：作者→多评审员独立评审→元评审→修改→循环"""
    solution = author(task)
    print(f"[作者] 生成初始方案，长度：{len(solution)} 字")

    for revision in range(max_revisions):
        # 多个评审员独立评审（不同关注点）
        reviews = [
            reviewer(solution, "代码质量"),
            reviewer(solution, "安全性"),
            reviewer(solution, "性能"),
        ]
        print(f"[评审] 3 位评审员完成：{[r['decision'] for r in reviews]}")

        # 元评审汇总
        meta = meta_reviewer(solution, reviews)
        print(f"[元评审] 最终决策：{meta['final_decision']}")

        if meta["final_decision"] == "approve":
            print("[通过] 方案已通过评审")
            return solution

        # 修改方案
        print(f"[修改] 根据反馈修改，待办：{meta['action_items']}")
        revise_prompt = f"请根据以下反馈修改你的方案：\n方案：{solution}\n反馈：{meta['summary']}\n待修改：{meta['action_items']}"
        resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": revise_prompt}])
        solution = resp.choices[0].message.content

    print("[达到最大修改次数] 返回当前方案")
    return solution

# 使用
final = review_pipeline("用 Python 写一个函数，判断一个字符串是否是有效的邮箱地址")
print(f"\n最终方案：\n{final}")
```

---

## 五、易混概念对比表
| 维度 | 单智能体（Single Agent） | 多智能体（Multi-Agent） |
| --- | --- | --- |
| LLM 实例 | 1 个 | 多个 |
| 上下文 | 1 个共享 | 每个 Agent 独立 |
| 工具 | 所有工具给一个 LLM | 按角色分配 |
| 决策 | 集中式 | 分布式 / 协商 |
| 复杂度 | 低 | 高 |
| 调试 | 简单 | 复杂 |
| 能力上限 | 单 LLM 能力 | 可远超单 LLM |
| 成本 | 低 | 高 |
| 延迟 | 低（串行） | 可能高（多轮交互） |
| 适用 | 中等复杂度任务 | 超复杂 / 多领域任务 |
| 类比 | 全能独立工作者 | 专业团队 |

| 协作模式             | 控制方式 | 灵活性 | 可控性 | 适用场景           |
| ---------------- | ---- | --- | --- | -------------- |
| Supervisor（主管）   | 集中式  | 中   | 高   | 任务可分解、需监督      |
| Peer-to-Peer（对等） | 分布式  | 高   | 低   | 开放式探索、创意生成     |
| Hierarchical（分层） | 多层级  | 中   | 高   | 超大型项目、企业流程     |
| Pipeline（流水线）    | 顺序   | 低   | 高   | 步骤固定的流程（如内容创作） |
| Debate（辩论）       | 协商   | 高   | 中   | 决策分析、事实核查      |

| 共识机制 | 方法 | 通信开销 | 质量 | 适用场景 |
| --- | --- | --- | --- | --- |
| 投票 | 独立回答→多数投票 | 低（并行） | 中 | 有确定答案的问题 |
| 辩论 | 多轮交叉讨论 | 高（多轮） | 高 | 复杂推理、事实核查 |
| 评审 | 作者→多评审→元评审 | 中（评审独立） | 高 | 代码审查、方案评审 |
| 层级决策 | 上级 Agent 决策 | 低 | 中 | 有明确层级的系统 |
| 人工决策 | 升级给人 | 高（需人介入） | 最高 | 高风险 / 高不确定性 |

| 框架 | 核心思想 | 通信方式 | 适合场景 |
| --- | --- | --- | --- |
| AutoGen | 对话驱动 | 消息传递 | 探索性任务、灵活对话 |
| CrewAI | 角色驱动 | 任务交接 | 团队结构工作流 |
| MetaGPT | SOP 流水线 | 文档传递 | 软件开发 |
| LangGraph | 图编排 | 图节点通信 | 生产级、复杂控制流 |
| Camel | 角色扮演 | 对话 | 角色扮演、任务协作 |

| 多智能体优势 | 说明 |
| --- | --- |
| 分工专业化 | 每个 Agent 专注一个领域，质量更高 |
| 交叉验证 | 多个 Agent 检查彼此的工作，减少错误 |
| 并行处理 | 独立任务可以并行执行，缩短总时间 |
| 上下文隔离 | 每个 Agent 只看到相关信息，减少干扰 |
| 可扩展性 | 可以轻松增加新的专业 Agent |

| 多智能体挑战 | 说明 |
| --- | --- |
| 协调成本 | 需要分配任务、跟踪进度、汇总结果 |
| 通信开销 | Agent 之间交换信息消耗 token 和时间 |
| 调试困难 | 问题定位难，不知道哪个 Agent 出错 |
| 状态管理 | 跨 Agent 的状态同步是最难的操作挑战 |
| 错误传播 | 一个 Agent 的错误可能传播给其他 Agent |
| 发散风险 | 对等模式可能陷入无限讨论，无法收敛 |
| 成本高 | 多个 LLM 调用，token 消耗大 |

---

## 六、3 个实战中的常见坑
### 坑 1：为了用多智能体而用多智能体，结果简单任务也搞成 3 个 Agent，成本翻 3 倍质量还没提升
**现象**：看到「多智能体是趋势」，不管什么任务都搞成多 Agent ——「查个天气」也搞个「规划 Agent + 搜索 Agent + 回答 Agent」。结果是：成本是单 Agent 的 3 倍，延迟是 3 倍，质量还不如单 Agent（因为 Agent 之间通信丢失了信息）。
#### 避坑
- **先用单 Agent，搞不定再考虑多 Agent**：这是黄金原则。单 Agent 简单、快、省、易调试，80% 的场景单 Agent 就够了
- **多 Agent 的触发信号**（满足多个才考虑）：
  - 任务超过 15 步
  - 需要 3 个以上不同专业领域
  - 工具超过 20 个（单 Agent 选不准）
  - 需要交叉验证 / 评审（高风险任务）
  - 需要并行处理（多个独立子任务）
- **优化单 Agent 比引入多 Agent 更有效**：很多「单 Agent 搞不定」的问题，其实是 prompt 写得不好、工具 description 不清晰、记忆管理不到位 —— 先优化这些，再考虑多 Agent
- **从简单的多 Agent 开始**：如果确实需要多 Agent，先从 Supervisor 模式（1 个主管 + 2-3 个专业 Agent）开始，不要一上来就搞 Peer-to-Peer 或复杂的辩论
- **衡量多 Agent 的收益**：对比单 Agent 和多 Agent 的质量、成本、延迟。如果多 Agent 只提升了 5% 的质量但成本涨了 200%，不值得
- **记住：多 Agent 不是银弹**：它是解决「单 Agent 确实搞不定」的问题的工具，不是所有任务的默认选择

### 坑 2：多 Agent 之间通信混乱，信息丢失或重复，结果「三个和尚没水喝」
**现象**：搞了 3 个 Agent（前端、后端、测试），结果是：①前端 Agent 写了代码，但后端 Agent 不知道前端写了什么（信息丢失）；②两个 Agent 都写了同一个文件（重复工作）；③测试 Agent 等前端和后端都完成，但它们互相等待对方先完成（死锁）；④Agent 之间来回讨论，永远无法收敛（发散）。
#### 避坑
- **用 Supervisor 模式集中控制**：不要让 Agent 之间自由通信（Peer-to-Peer），由 Supervisor 统一分配任务、传递信息、汇总结果。Supervisor 知道全局状态，能避免信息丢失和死锁
- **明确的交接协议**：每个 Agent 的输出格式标准化（如「任务完成，输出文件路径：xxx，关键结论：xxx」），下一个 Agent 知道该读取什么
- **共享状态 / 黑板**：用一个中央存储（文件系统、数据库、共享记忆）保存中间结果，所有 Agent 都能读取。避免 Agent 之间直接传递大段信息（容易丢失）
- **避免循环依赖**：任务分解时确保是有向无环图（DAG），不要有「A 等 B，B 等 A」的循环依赖
- **设置超时和最大轮次**：Agent 之间的讨论 / 通信设置最大轮次（如 3 轮），超过后强制由 Supervisor 决策，防止无限发散
- **Agent 数量控制在 3-5 个**：Agent 越多，协调成本越高，通信越复杂。超过 5 个 Agent 时，考虑分层架构（而不是全部对等）
- **监控通信状态**：记录每个 Agent 的输入 / 输出、等待时间、通信次数，方便发现死锁和发散

### 坑 3：多 Agent 的上下文没有隔离，每个 Agent 都看到全部信息，结果「角色混乱」—— 前端 Agent 开始写后端代码
**现象**：定义了前端 Agent 和后端 Agent，但把所有信息（包括后端 API 文档、数据库 schema）都传给了前端 Agent。结果前端 Agent「越界」了 —— 它觉得自己也能写后端，开始写后端代码，和后端 Agent 产生冲突。或者 Agent 看到了太多无关信息，注意力被分散，本职工作做不好。
#### 避坑
- **上下文隔离是多 Agent 的核心价值之一**：多 Agent 不只是「多个 LLM」，更重要的是「每个 Agent 只看到和自己角色相关的信息」。这减少了干扰，提高了专注度
- **按角色过滤信息**：
  - 前端 Agent：只看到前端需求、设计稿、前端代码库
  - 后端 Agent：只看到后端需求、API 规范、数据库 schema
  - 测试 Agent：只看到需求文档、测试用例、代码（只读）
- **工具按角色分配**：前端 Agent 只有前端工具（写前端文件、跑前端测试），不要给它数据库工具、部署工具 —— 工具多了它会「忍不住」用
- **角色提示要强硬**：在 system prompt 中明确「你是一个前端工程师，你的职责是完成前端开发。不要尝试写后端代码，后端由后端工程师负责。如果你需要后端数据，请通过 Supervisor 请求。」
- **Supervisor 控制信息流动**：不是所有信息都共享，由 Supervisor 决定什么信息传给哪个 Agent。这就是为什么 Supervisor 模式比 Peer-to-Peer 更可控
- **避免「全能 Agent」**：如果一个 Agent 看到了所有信息、有所有工具，那它和单 Agent 没区别 —— 多 Agent 的优势就消失了
- **定期检查角色边界**：运行后检查每个 Agent 的输出，确认它没有越界。如果发现越界，加强角色提示或减少工具 / 信息

---

## 七、进阶问题（引导往下挖）
### 问题 1：多智能体的「协作」和人类团队的协作有什么本质区别？多 Agent 真的能像人类团队一样「1+1>2」吗？
#### 引导思考
- **人类团队协作的特点**：
  1. **共同目标**：团队成员真正理解并认同共同目标
  2. **隐性知识共享**：通过眼神、语气、肢体语言传递大量非语言信息
  3. **信任和默契**：长期合作形成的默契，不需要每次都明确沟通
  4. **主动补位**：看到队友遇到困难，主动帮忙，不需要被分配
  5. **创造性碰撞**：不同背景的人交流，产生意想不到的新想法
  6. **情感和动机**：团队成员有情感、有动机、有归属感
- **多 Agent 协作的特点**：
  1. **目标是外部赋予的**：Agent 的目标是 Supervisor 或用户给的，它自己并不「理解」或「认同」目标，只是按 prompt 执行
  2. **通信只有文本**：Agent 之间只能通过文本交换信息，没有非语言沟通
  3. **没有默契**：每次协作都需要明确的通信协议，没有「心照不宣」
  4. **不会主动补位**：Agent 只做自己角色范围内的事，不会主动帮助其他 Agent（除非被明确要求）
  5. **「创造性碰撞」有限**：Agent 之间的交流是结构化的，很难产生真正的「意外」想法
  6. **没有情感和动机**：Agent 没有情感，不会因为「团队荣誉感」而努力，也不会因为「队友拖后腿」而生气
- **多 Agent 能「1+1>2」吗？**
  - **在某些场景下可以**：
    - 交叉验证：多个 Agent 检查同一个任务，确实能减少错误（「三个臭皮匠」）
    - 分工专业化：前端 Agent 写前端确实比「全能 Agent」写得好（因为上下文更聚焦、工具更专业）
    - 并行处理：独立任务并行执行，确实能缩短总时间
  - **但不是所有场景都能**：
    - 简单任务：多 Agent 的协调成本超过收益，「1+1<2」
    - 需要高度默契的任务：Agent 之间没有默契，协作效率低
    - 需要创造性碰撞的任务：结构化的交流很难产生真正的创意
- **关键区别**：人类团队的「1+1>2」来自「化学反应」（默契、信任、情感、创造性碰撞），多 Agent 的「1+1>2」来自「工程优化」（分工、并行、交叉验证）。前者是质的提升，后者是量的优化
- **未来趋势**：随着 Agent 能力提升，多 Agent 协作可能会越来越接近人类团队 —— 更灵活的通信、更主动的补位、更自然的协作。但在可预见的未来，多 Agent 仍然是「工程优化」为主，不会真正拥有人类团队的「化学反应」
- 延伸：后续课程（Supervisor 模式、Agentic Workflow 编排）会深入讲解如何设计高效的多 Agent 协作系统

### 问题 2：多智能体的「上下文隔离」是核心优势，但也带来了「信息孤岛」问题 —— 如何平衡隔离和共享？
#### 引导思考
- **上下文隔离的价值**：
  - 减少干扰：Agent 只看到相关信息，注意力更集中
  - 角色清晰：每个 Agent 专注自己的领域，不会越界
  - 减少 token：不需要把所有信息传给每个 Agent，节省成本
  - 安全性：敏感信息只传给需要的 Agent
- **信息孤岛的问题**：
  - 重复工作：两个 Agent 做了同一件事（因为不知道对方已经做了）
  - 不一致：Agent A 的结论和 Agent B 的结论矛盾（因为信息不对称）
  - 集成困难：最后汇总结果时，发现各 Agent 的输出格式、假设、标准不一致
  - 错过协同：Agent A 发现了一个重要信息，但 Agent B 不知道，错过了利用机会
- **平衡策略**：
  1. **分层信息共享**：
     - 全局信息（目标、约束、最终交付标准）：所有 Agent 共享
     - 领域信息（前端需求、后端规范）：只传给相关 Agent
     - 细节信息（具体代码、中间结果）：Agent 自己保留，需要时通过 Supervisor 请求
  2. **Supervisor 作为信息枢纽**：
     - 不是所有 Agent 直接通信，而是通过 Supervisor 中转
     - Supervisor 知道全局状态，决定什么信息传给谁
     - 避免信息泛滥，也避免信息孤岛
  3. **共享「状态」而非「原始数据」**：
     - 用一个中央状态存储（Blackboard）保存关键状态（任务进度、关键结论、已完成的工作）
     - 所有 Agent 都能读取状态，但不共享原始的大段数据
     - 状态是精简的、结构化的，不会造成信息过载
  4. **标准化交接协议**：
     - 每个 Agent 的输出格式标准化（包含：完成状态、关键结论、输出位置、待办事项）
     - 下一个 Agent 知道该读取什么、该注意什么
     - 减少信息丢失和误解
  5. **定期同步会议**：
     - 在关键节点（如每个阶段结束），让所有 Agent 同步状态（通过 Supervisor 汇总）
     - 发现不一致、重复工作、集成问题，及时解决
     - 不要等到最后才汇总（那时候问题已经积累太多）
  6. **「需要知道」原则**：
     - 不是「能共享就共享」，而是「需要知道才共享」
     - 问自己：这个 Agent 完成自己的任务，真的需要这条信息吗？
     - 如果不需要，就不要传 —— 减少干扰，节省 token
- **类比**：就像企业的信息管理 —— 不是所有信息都公开（信息过载），也不是各部门完全隔离（信息孤岛），而是「按需共享」：全局目标全员共享，部门信息内部共享，敏感信息按需授权，关键节点跨部门同步
- 延伸：后续课程（Supervisor 模式、生产级 Agent 架构设计）会深入讲解多 Agent 系统的信息管理和状态同步

---

## 八、四关自测
### 复述关（3 句话讲清）
1. Multi-Agent 是让多个 LLM Agent 像团队一样协作 —— 每个 Agent 有专门的角色、工具和独立上下文，通过通信协议交换信息，共同完成单个 Agent 搞不定的复杂任务。
2. 三大协作模式是 Supervisor（主管分配，最可控）、Peer-to-Peer（对等自由对话，最灵活但容易发散）、Hierarchical（分层，适合超大型项目）；核心机制是角色分工 + 通信 + 共识（辩论 / 投票 / 评审）。
3. 多 Agent 不是银弹 —— 它带来分工专业化和交叉验证，但也引入协调成本、通信开销和调试难度，黄金原则是「先用单 Agent，搞不定再上多 Agent」。

### 举例关（真实场景）
你要做一篇行业研报：单 Agent 查资料 + 写稿 + 校对容易顾此失彼。改成多 Agent 流水线 —— 研究员 Agent 搜资料整理数据、撰稿人 Agent 写初稿、编辑 Agent 审校润色、分析师 Agent 交叉验证结论。每个 Agent 只干自己擅长的，上下文聚焦，质量明显高于一个全能 Agent 从头做到尾。

### 反例关（边界条件）
「查深圳今天天气」这种简单任务硬上三 Agent（规划 Agent + 搜索 Agent + 回答 Agent），成本是单 Agent 的 3 倍、延迟 3 倍，还因为 Agent 间通信丢信息导致质量反而下降。另外，Peer-to-Peer 模式下多个 Agent 自由对话没有主管收敛，容易陷入无限讨论「三个和尚没水喝」，必须设最大轮次和主管裁决。

### 教学关（给小白讲）
单智能体像一个全能打杂的，什么都能干一点但不精；多智能体像一个专业团队 —— 产品经理、工程师、设计师、测试各管一摊，通过开会（通信）和投票辩论（共识）一起把大事干完。好处是专业、能交叉检查出错；坏处是协调起来费钱费时，小活儿没必要请团队，自己一个人半小时就搞定了。

---

## 资料来源
> 来源核验 2026-11-26：全部外链逐一联网核验可访问，论文标题按 arXiv 原文校准；存疑数字保留原文标注。技术结论与官方文档不一致时以官方为准。

- 论文：[arXiv:2305.14325 — Improving Factuality and Reasoning in Language Models through Multiagent Debate（ICML 2024）](https://arxiv.org/abs/2305.14325)
- 论文：[arXiv:2308.00352 — MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework](https://arxiv.org/abs/2308.00352)
- 论文：[arXiv:2406.04692 — Mixture-of-Agents Enhances Large Language Model Capabilities（ICLR 2025 Spotlight）](https://arxiv.org/abs/2406.04692)
  - [OpenReview — ICLR 2025 Spotlight 页面](https://openreview.net/forum?id=h0ZfDIrj7T)
- 论文：[arXiv:2509.20502 — MARS: Toward More Efficient Multi-Agent Collaboration for LLM Reasoning](https://arxiv.org/abs/2509.20502)
- 论文：[arXiv:2409.14457 — Large Model Based Agents: State-of-the-Art, Cooperation Paradigms, Security and Privacy, and Future Trends](https://arxiv.org/abs/2409.14457)
- 论文：[LLM-Based Autonomous Multi-Agent Systems: A Survey（nanoAgentTeam）](https://nanoagentteam.github.io/assets/autonomous-multi-agent-survey.pdf)
- 技术博客：[AI Wiki — Multi-agent system](https://aiwiki.ai/wiki/multi_agent_system)
- 技术博客：[AI/TLDR — What Is AutoGen?](https://ai-tldr.dev/learn/agent-frameworks/orchestration-frameworks/what-is-autogen/)
- 技术博客：[metacto — Multi-Agent Systems: How Multi Agent AI Works in 2026](https://www.metacto.com/blogs/multi-agent-systems-how-ai-agents-work-together)
- 框架文档：[GitHub — Multi-Agent Patterns (Supervisor/P2P/Hierarchical)（muratcankoylan/Agent-Skills-for-Context-Engineering）](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering/blob/main/skills/multi-agent-patterns/SKILL.md)
