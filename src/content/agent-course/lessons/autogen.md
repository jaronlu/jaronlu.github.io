## 一、结论前置

1. **AutoGen 是微软开源的多智能体框架，核心创新是“对话式编程”（Conversation Programming）范式——把多个具备不同角色、独立上下文的可对话智能体（Conversable Agent）放进一个“群聊”，它们通过自然语言交互、自主协商、任务移交、互相辩论来完成复杂任务，而不是用传统的链式调用或显式流程图**。经典的 Agent 类型包括 `ConversableAgent`（基础类）、`AssistantAgent`（LLM 助手）、`UserProxyAgent`（人类代理，可执行代码和请求人工输入）、`GroupChat`（群聊）和 `GroupChatManager`（群聊管理器）。群聊支持两种发言模式：round-robin（轮流发言）和 dynamic（LLM 动态选择下一个发言者）。**AutoGen 适合“讨论式”协作场景（如软件开发团队、内容创作团队、辩论评审），与 LangGraph 的“流程式”编排形成互补**。

2. **AutoGen 正在向 Microsoft Agent Framework（MAF）演进——2026 年 2 月 MAF 达到 Release Candidate，BUILD 2026 宣布 Agent Harness、Hosted Agents、CodeAct 等新特性，官方提供从 AutoGen 到 MAF 的完整迁移指南，新项目建议直接用 MAF**。MAF 的分层架构是：AutoGen Core（Actor 模型底层）→ AutoGen AgentChat（简单 API 中层）→ Extensions（高级集成上层）。MAF 引入了新的编排模式：Sequential（顺序）、Concurrent（并发）、Handoff（移交，声明 Agent 间有向边，框架注入 handoff 工具）、Group Chat（群聊），全部支持流式。Handoff 模式是对传统 Router 的改进——Agent 可以在执行中途发现“这个问题应该交给另一个专家”，然后主动移交控制权，而不是一开始就路由完就不管了。

3. **AutoGen 的核心优势是“代码执行 + 人机交互 + 多 Agent 辩论”的原生集成——UserProxyAgent 可以自动检测消息中的代码块并执行（支持 Docker 沙箱），也可以在需要时请求人类输入，多 Agent 可以通过辩论和评审提高输出质量**。典型的软件开发流程是：AssistantAgent（程序员）写代码 → UserProxyAgent 执行代码 → 如果报错，把错误信息发回给 AssistantAgent 调试 → 循环直到代码运行成功。这种“写代码→执行→调试”的闭环是 AutoGen 的杀手级应用。多 Agent 辩论模式（如 Commander + Writer + Safeguard）则通过角色分工和互相评审来提高输出质量和安全性。**但 AutoGen 的生产级能力（持久化、可观测性、权限控制）不如 LangGraph 成熟，复杂的生产级 Agent 建议用 LangGraph，AutoGen 适合原型验证和“讨论式”协作**。

---

## 二、通俗类比 + 专业定义

### 通俗类比

#### AutoGen = 一个 AI 专家团队的“群聊会议室”

- **ConversableAgent = 会议室里的每个人**：
  - 每个人有自己的身份（名字、角色、专业背景）
  - 每个人可以发言（发送消息），也可以听别人发言（接收消息）
  - 每个人有自己的“脑子”（LLM），根据讨论内容决定说什么
  - 不是传统的“领导下达命令→员工执行”的层级结构，而是“大家一起讨论”的扁平结构

- **AssistantAgent = 专家顾问**：
  - 有特定的专业背景（系统提示词），如“你是一个资深 Python 开发者”
  - 用 LLM 思考，根据讨论内容提供专业意见
  - 可以调用工具（如搜索、计算器）
  - 不直接执行代码，只提供建议和代码

- **UserProxyAgent = 人类的替身 + 执行者**：
  - 代表人类参与讨论，需要时可以问“老板，你觉得呢？”（请求人类输入）
  - 可以执行代码——专家说“运行这段代码试试”，UserProxyAgent 就真的去运行，然后把结果发回群里
  - 可以调用工具
  - 是连接“AI 讨论”和“真实世界执行”的桥梁

- **GroupChat = 群聊会议室**：
  - 多个 Agent 聚在一个群里，轮流或按需发言
  - 所有发言都记录在群聊历史中，每个 Agent 都能看到
  - Agent 根据群聊内容决定“我现在要不要发言”、“我说什么”
  - 就像真实的团队会议——有人提出问题，有人回答，有人补充，有人质疑

- **GroupChatManager = 会议主持人**：
  - 控制发言顺序——round-robin 模式（按顺序轮流发言）或 dynamic 模式（根据讨论内容选择最该发言的人）
  - 控制会议轮数（max_round），防止无限讨论
  - 决定何时结束会议
  - 就像真实的会议主持人——“下一个谁发言？”、“讨论得差不多了，总结一下吧”

- **代码执行闭环 = 程序员 + 测试员的协作**：
  - 程序员（AssistantAgent）写代码，发到群里
  - 测试员（UserProxyAgent）看到代码，自动运行，把运行结果（成功/报错）发回群里
  - 如果报错，程序员看错误信息，修改代码，再发回群里
  - 测试员再运行，循环直到代码运行成功
  - 这就是 AutoGen 的“写代码→执行→调试”闭环，是它的杀手级应用

- **多 Agent 辩论 = 评审委员会**：
  - Commander（指挥官）：协调讨论，管理记忆，决定流程
  - Writer（写手）：起草内容
  - Safeguard（安全员）：审查内容的安全性、准确性、合规性
  - 三个人在群里讨论：Writer 起草 → Safeguard 审查，指出问题 → Writer 修改 → Commander 总结
  - 通过角色分工和互相评审，提高输出质量和安全性
  - 就像真实的出版流程——作者写稿、编辑审校、法务审查、主编定稿

- **Handoff（移交）= 专家会诊**：
  - 一个专家（Agent）在处理问题时，发现“这个问题我不擅长，应该交给另一个专家”
  - 他主动把问题和上下文移交给另一个专家（handoff）
  - 另一个专家接手，继续处理
  - 就像医院的会诊——全科医生看不了的病，转介给专科医生；专科医生看不了的，再转介给更资深的专家
  - 与传统 Router 的区别：Router 是“一开始就决定谁处理”，Handoff 是“处理过程中发现不对再移交”——更灵活，更像真实的专家协作

### 专业定义

| 概念 | 定义 |
|------|------|
| **AutoGen** | 微软开源的多智能体框架，通过“对话式编程”范式，让多个可对话智能体通过自然语言交互协作完成复杂任务。支持代码执行、工具调用、人机交互。 |
| **Conversation Programming（对话式编程）** | AutoGen 提出的编程范式——用 Agent 之间的对话来编排任务流程，而不是用传统的链式调用或显式流程图。Agent 自主决定何时发言、说什么。 |
| **ConversableAgent** | AutoGen 的基础 Agent 类，可以发送和接收消息，维护对话历史。所有其他 Agent 类型都继承自它。 |
| **AssistantAgent** | LLM 驱动的助手 Agent，有系统提示词定义角色和能力，可以调用工具。是 AutoGen 中最常用的 Agent 类型。 |
| **UserProxyAgent** | 人类用户的代理 Agent，默认每轮请求人类输入，也可以自动执行代码和调用工具。是连接 AI 讨论和真实世界执行的桥梁。 |
| **GroupChat** | 多 Agent 群聊的管理类，维护群聊消息历史和 Agent 列表。支持 round-robin 和 dynamic 两种发言模式。 |
| **GroupChatManager** | 群聊管理器，基于 LLM 决定下一个发言的 Agent，控制群聊流程和轮数。是 GroupChat 的“主持人”。 |
| **RoundRobinGroupChat** | AgentChat 中的轮流发言群聊——Agent 按固定顺序轮流发言。适合结构化的协作流程。 |
| **SelectorGroupChat** | AgentChat 中的选择器群聊——用 LLM 根据讨论内容动态选择下一个发言的 Agent。适合灵活的讨论场景。 |
| **Handoff（移交）** | Microsoft Agent Framework 中的编排模式——Agent 在执行过程中可以主动将控制权移交给另一个 Agent。声明 Agent 间的有向边，框架注入 handoff 工具。 |
| **Code Execution（代码执行）** | UserProxyAgent 的核心能力——自动检测消息中的代码块，在沙箱（Docker）中执行，将结果返回给对话。支持 Python、shell 等。 |
| **Human-in-the-loop（人机交互）** | UserProxyAgent 可以在需要时暂停执行，请求人类输入，收到输入后继续对话。支持人工审批、纠错、补充信息。 |
| **AutoGen Core** | AutoGen 0.5+ 的底层，实现 Agent 的 Actor 模型，提供消息传递、订阅、事件驱动等基础能力。 |
| **AutoGen AgentChat** | AutoGen 0.5+ 的中层，在 Core 之上提供简单易用的高级 API（AssistantAgent、GroupChat 等），适合快速原型。 |
| **Extensions** | AutoGen 0.5+ 的上层，提供高级客户端、Agent 和团队，以及第三方软件集成。 |
| **Microsoft Agent Framework（MAF）** | AutoGen 的演进版本，2026 年达到 Release Candidate。提供更完善的编排模式（Sequential/Concurrent/Handoff/Group Chat）、流式支持、生产级特性。 |
| **Agent Harness** | MAF BUILD 2026 宣布的特性——Agent 的运行时框架，提供标准化的 Agent 生命周期管理、工具调用、状态管理。 |
| **CodeAct** | MAF BUILD 2026 宣布的特性——代码即行动，Agent 通过编写和执行代码来完成任务，是 AutoGen 代码执行能力的演进。 |

---

## 三、底层机制

### 一、AutoGen 的对话式编程范式

```
传统编排（链式调用 / 流程图）：
用户输入 → 节点A → 节点B → 节点C → 输出
（流程是预定义的，每个节点做什么是固定的）

AutoGen 对话式编程（群聊）：
用户输入
    ↓
┌─────────────────────────────────┐
│         GroupChat 群聊           │
│                                 │
│  AgentA: "我来分析这个问题..."   │
│  AgentB: "补充一下，还需要..."   │
│  AgentA: "好的，我写个代码..."   │
│  UserProxy: "代码执行结果: ..."  │
│  AgentC: "审查一下，这里有问题"  │
│  ...                            │
│  （Agent 自主决定何时发言、说什么）│
└─────────────────────────────────┘
    ↓
最终输出（群聊讨论的结果）
```

#### 对话式编程的核心思想
1. **Agent 是自主的**：每个 Agent 有自己的 LLM 和系统提示词，根据对话历史自主决定“我现在要不要发言”、“我说什么”
2. **流程是涌现的**：不是预定义的流程图，而是在 Agent 交互过程中自然涌现的
3. **上下文是共享的**：所有 Agent 共享群聊历史，每个 Agent 都能看到其他人说了什么
4. **角色是专业的**：每个 Agent 有特定的角色和专业背景，分工协作

#### 对话式编程 vs 传统编排的对比
| 维度 | 传统编排（LangGraph） | 对话式编程（AutoGen） |
|------|---------------------|---------------------|
| 流程控制 | 显式（节点+边） | 隐式（Agent 自主） |
| Agent 自主性 | 低（按图流转） | 高（自主决策） |
| 可预测性 | 高（流程固定） | 低（流程涌现） |
| 灵活性 | 中（改图改流程） | 高（改 Agent 提示词即可） |
| 调试难度 | 低（按节点追踪） | 高（对话历史复杂） |
| 适用场景 | 流程明确的任务 | 需要讨论/辩论的任务 |
| 生产可靠性 | 高 | 中 |

### 二、核心 Agent 类型详解

#### ConversableAgent（基础类）
```python
from autogen import ConversableAgent

# 基础 Agent：可以发送和接收消息
agent = ConversableAgent(
    name="basic_agent",
    system_message="你是一个助手",
    llm_config={"config_list": config_list},  # LLM 配置
    human_input_mode="NEVER",  # 人类输入模式：ALWAYS/TERMINATE/NEVER
)
```

#### AssistantAgent（LLM 助手）
```python
from autogen import AssistantAgent

# LLM 驱动的助手，有系统提示词定义角色
coder = AssistantAgent(
    name="coder",
    system_message="你是一个资深 Python 开发者，擅长编写高质量代码。",
    llm_config={"config_list": config_list},
)

# 可以注册工具
coder.register_for_llm(
    name="search", description="搜索信息"
)(search_function)
```

#### UserProxyAgent（人类代理 + 执行者）
```python
from autogen import UserProxyAgent

# 人类的代理，可以执行代码和请求人工输入
user_proxy = UserProxyAgent(
    name="user_proxy",
    human_input_mode="TERMINATE",  # 仅在终止时请求人类输入
    code_execution_config={
        "work_dir": "coding",  # 代码执行的工作目录
        "use_docker": True,    # 使用 Docker 沙箱执行代码
    },
    llm_config=False,  # 不使用 LLM（纯代理）
)

# 双人对话：coder 写代码，user_proxy 执行代码
user_proxy.initiate_chat(
    coder,
    message="写一个 Python 函数计算斐波那契数列，并运行测试",
)
# 流程：
# 1. coder 写代码，发给 user_proxy
# 2. user_proxy 自动检测代码块，在 Docker 中执行
# 3. 执行结果（成功/报错）发回给 coder
# 4. 如果报错，coder 修改代码，再发给 user_proxy
# 5. 循环直到代码运行成功
```

#### 三种 human_input_mode
| 模式 | 说明 | 适用场景 |
|------|------|---------|
| `ALWAYS` | 每轮都请求人类输入 | 需要全程人工监督 |
| `TERMINATE` | 仅在 Agent 认为任务完成时请求人类输入 | 半自动，人类确认结果 |
| `NEVER` | 从不请求人类输入，完全自动 | 全自动任务 |

### 三、GroupChat 多 Agent 群聊

#### GroupChat 的工作原理
```python
from autogen import GroupChat, GroupChatManager, AssistantAgent, UserProxyAgent

# 定义多个专家 Agent
writer = AssistantAgent(
    name="writer",
    system_message="你是一个技术作家，擅长撰写技术文章。",
    llm_config={"config_list": config_list},
)

reviewer = AssistantAgent(
    name="reviewer",
    system_message="你是一个严格的审稿人，擅长发现文章中的问题。",
    llm_config={"config_list": config_list},
)

user_proxy = UserProxyAgent(
    name="user_proxy",
    human_input_mode="TERMINATE",
)

# 创建群聊
group_chat = GroupChat(
    agents=[user_proxy, writer, reviewer],
    messages=[],
    max_round=10,  # 最多 10 轮
    speaker_selection_method="auto",  # auto: LLM 选择；round_robin: 轮流
)

# 创建群聊管理器
manager = GroupChatManager(
    groupchat=group_chat,
    llm_config={"config_list": config_list},
)

# 启动群聊
user_proxy.initiate_chat(
    manager,
    message="写一篇关于 RAG 的技术文章，然后审稿人审查",
)
```

#### 两种发言模式
1. **round_robin（轮流发言）**：
   - Agent 按固定顺序轮流发言
   - 优点：流程可控，每个 Agent 都有机会发言
   - 缺点：不够灵活，可能不需要发言的 Agent 也必须发言
   - 适合：结构化的协作流程（如“写稿→审稿→修改→定稿”）

2. **auto / dynamic（动态选择）**：
   - GroupChatManager 用 LLM 根据对话历史选择“最该发言的 Agent”
   - 优点：灵活，只有相关的 Agent 才发言
   - 缺点：可能某个 Agent 一直不发言，或 LLM 选择不合理
   - 适合：灵活的讨论场景（如“专家会诊”、“头脑风暴”）

#### AgentChat 0.5+ 的团队原语
```python
# RoundRobinGroupChat：轮流发言
from autogen_agentchat.teams import RoundRobinGroupChat
team = RoundRobinGroupChat([writer, reviewer, user_proxy])

# SelectorGroupChat：LLM 选择下一个发言者
from autogen_agentchat.teams import SelectorGroupChat
team = SelectorGroupChat(
    [writer, reviewer, user_proxy],
    model_client=model_client,
)

# Swarm：蜂群模式，Agent 间可以移交
from autogen_agentchat.teams import Swarm
team = Swarm([agent_a, agent_b, agent_c])
```

### 四、代码执行机制

#### UserProxyAgent 的代码执行流程
```
AssistantAgent 发送消息（包含代码块）
    ↓
UserProxyAgent 接收消息
    ↓
检测消息中是否有代码块（```python ... ```）
    ↓
有代码块？
    ├── 是 → 在 Docker 沙箱中执行代码
    │       ↓
    │   获取执行结果（stdout/stderr/返回值）
    │       ↓
    │   将执行结果作为消息发回群聊
    │       ↓
    │   AssistantAgent 看到结果，决定下一步（修改代码/完成）
    │
    └── 否 → 不执行代码，正常处理消息
```

#### 代码执行配置
```python
user_proxy = UserProxyAgent(
    name="user_proxy",
    code_execution_config={
        "work_dir": "coding",           # 工作目录
        "use_docker": True,             # 使用 Docker 沙箱（推荐）
        "docker_image": "python:3.11",  # Docker 镜像
        "timeout": 300,                 # 执行超时（秒）
        "last_n_messages": 3,           # 只检测最近 N 条消息中的代码
    },
)
```

#### 代码执行的安全考虑
- **Docker 沙箱**：代码在隔离的 Docker 容器中执行，不会影响宿主机
- **工作目录隔离**：代码只能访问指定的工作目录，不能访问其他文件
- **超时限制**：防止无限循环或长时间运行的代码
- **网络隔离**：可以配置 Docker 容器的网络访问限制
- **人工确认**：高风险操作可以配置为需要人工确认后才执行

### 五、Microsoft Agent Framework（MAF）的演进

#### AutoGen → MAF 的演进时间线
- 2023 年：AutoGen 首次发布（微软研究院）
- 2024 年：AutoGen 0.2 版本，经典 API（ConversableAgent/AssistantAgent/UserProxyAgent/GroupChat）
- 2025 年：AutoGen 0.5 版本，重构为分层架构（Core/AgentChat/Extensions）
- 2026 年 2 月：Microsoft Agent Framework 达到 Release Candidate
- 2026 年 5 月（BUILD 2026）：宣布 Agent Harness、Hosted Agents、CodeAct 等新特性

#### MAF 的新编排模式
```python
# MAF 的四种编排模式

# 1. Sequential（顺序）：Agent 按顺序执行
from microsoft_agent_framework import SequentialWorkflow
workflow = SequentialWorkflow([agent_a, agent_b, agent_c])

# 2. Concurrent（并发）：Agent 并行执行
from microsoft_agent_framework import ConcurrentWorkflow
workflow = ConcurrentWorkflow([agent_a, agent_b, agent_c])

# 3. Handoff（移交）：Agent 间可以主动移交控制权
from microsoft_agent_framework import HandoffWorkflow
workflow = HandoffWorkflow(
    agents=[generalist, specialist_a, specialist_b],
    edges=[  # 声明有向边：谁可以移交给谁
        (generalist, specialist_a),
        (generalist, specialist_b),
        (specialist_a, generalist),
    ]
)
# 框架自动为每个 Agent 注入 handoff 工具
# Agent 可以在执行中调用 handoff_to_specialist_a() 移交控制权

# 4. Group Chat（群聊）：AutoGen 经典的群聊模式
from microsoft_agent_framework import GroupChatWorkflow
workflow = GroupChatWorkflow([agent_a, agent_b, agent_c])
```

#### Handoff vs Router 的区别
| 维度 | Router（路由） | Handoff（移交） |
|------|---------------|----------------|
| 决策时机 | 一开始就决定谁处理 | 处理过程中发现不对再移交 |
| 控制权 | Router 控制，Agent 不主动移交 | Agent 主动移交控制权 |
| 上下文 | 路由时上下文有限 | 移交时可以传递完整上下文 |
| 灵活性 | 低（路由规则固定） | 高（Agent 自主决定） |
| 适用场景 | 问题分类明确 | 复杂问题，可能需要多专家协作 |
| 类比 | 医院导诊台（一开始就分诊） | 医生会诊（处理中发现不对再转介） |

---

## 四、最小可运行代码示例

### 完整的软件开发多 Agent 团队（写代码→执行→调试→审查）

```python
import os
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager

# ========== 1. 配置 ==========
# AutoGen 走 OpenAI 兼容协议，key / 地址 / 模型名都从环境变量读取（任何兼容 provider 均可）：
#   export OPENAI_API_KEY=sk-xxx
#   export OPENAI_BASE_URL=https://...   # 可选，用 openai 官方可省略
#   export LLM_MODEL=doubao-pro-32k
config_list = [{
    "model": os.environ["LLM_MODEL"],
    "api_key": os.environ["OPENAI_API_KEY"],
    **({"base_url": os.environ["OPENAI_BASE_URL"]} if "OPENAI_BASE_URL" in os.environ else {}),
}]
llm_config = {"config_list": config_list, "temperature": 0.1}

# ========== 2. 定义 Agent 角色 ==========

# 程序员：写代码
coder = AssistantAgent(
    name="Coder",
    system_message="""你是一个资深 Python 开发者。
职责：
1. 根据需求编写高质量、可运行的 Python 代码
2. 代码要有清晰的注释和文档字符串
3. 包含测试用例
4. 如果代码执行报错，根据错误信息调试修复
5. 代码完成后，说"TERMINATE"结束讨论""",
    llm_config=llm_config,
)

# 代码审查员：审查代码质量
reviewer = AssistantAgent(
    name="CodeReviewer",
    system_message="""你是一个严格的代码审查员。
职责：
1. 审查代码的质量、安全性、性能
2. 检查是否有 bug、安全漏洞、性能问题
3. 提出具体的改进建议
4. 如果代码质量达标，说"代码审查通过"
5. 如果有问题，指出具体问题并建议修改""",
    llm_config=llm_config,
)

# 用户代理：执行代码 + 代表人类
user_proxy = UserProxyAgent(
    name="UserProxy",
    human_input_mode="TERMINATE",  # 结束时请求人类确认
    code_execution_config={
        "work_dir": "coding_workspace",
        "use_docker": True,
        "docker_image": "python:3.11",
        "timeout": 300,
    },
    llm_config=False,  # 纯代理，不用 LLM
)

# ========== 3. 创建群聊 ==========
group_chat = GroupChat(
    agents=[user_proxy, coder, reviewer],
    messages=[],
    max_round=15,
    speaker_selection_method="auto",  # LLM 动态选择发言者
)

manager = GroupChatManager(
    groupchat=group_chat,
    llm_config=llm_config,
)

# ========== 4. 启动任务 ==========
user_proxy.initiate_chat(
    manager,
    message="""需求：
1. 编写一个 Python 函数，实现快速排序算法
2. 包含完整的类型注解和文档字符串
3. 编写测试用例，验证各种边界情况（空数组、单元素、已排序、逆序、重复元素）
4. 运行测试，确保全部通过
5. 代码审查员审查代码质量""",
)

# 预期流程：
# 1. Coder 写代码（快速排序 + 测试），发到群里
# 2. UserProxy 检测到代码块，在 Docker 中执行
# 3. 执行结果（测试通过/报错）发回群里
# 4. 如果报错，Coder 根据错误信息调试，再发代码
# 5. 循环直到测试通过
# 6. CodeReviewer 审查代码质量，提出建议
# 7. Coder 根据建议修改代码
# 8. UserProxy 再次执行测试
# 9. 全部通过后，UserProxy 请求人类确认
# 10. 人类确认后，任务结束
```

### 多 Agent 辩论评审模式（Commander + Writer + Safeguard）

```python
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager

# config 沿用上节（env 三件套见上节说明）
config_list = [{
    "model": os.environ["LLM_MODEL"],
    "api_key": os.environ["OPENAI_API_KEY"],
    **({"base_url": os.environ["OPENAI_BASE_URL"]} if "OPENAI_BASE_URL" in os.environ else {}),
}]
llm_config = {"config_list": config_list, "temperature": 0.3}

# 指挥官：协调讨论，管理记忆，决定流程
commander = AssistantAgent(
    name="Commander",
    system_message="""你是团队指挥官。
职责：
1. 协调团队讨论流程，确保每个角色都发挥作用
2. 管理讨论记忆，确保上下文不丢失
3. 在 Writer 完成初稿后，邀请 Safeguard 审查
4. 在 Safeguard 提出问题后，邀请 Writer 修改
5. 当内容质量达标且安全合规时，总结最终结果并说"TERMINATE"
6. 不要自己写内容，只负责协调""",
    llm_config=llm_config,
)

# 写手：起草内容
writer = AssistantAgent(
    name="Writer",
    system_message="""你是资深技术作家。
职责：
1. 根据需求撰写高质量的技术内容
2. 内容要准确、清晰、有深度
3. 包含具体的代码示例和最佳实践
4. 根据 Safeguard 的审查意见修改内容
5. 修改后说明修改了哪些地方""",
    llm_config=llm_config,
)

# 安全员：审查安全性、准确性、合规性
safeguard = AssistantAgent(
    name="Safeguard",
    system_message="""你是安全与质量审查员。
职责：
1. 审查内容的技术准确性——是否有错误信息、过时信息
2. 审查内容的安全性——是否有安全漏洞、危险操作、敏感信息
3. 审查内容的合规性——是否有版权问题、隐私问题
4. 提出具体的修改建议，指出问题所在的位置
5. 如果内容质量达标，说"审查通过"
6. 要严格，不要放过任何问题""",
    llm_config=llm_config,
)

user_proxy = UserProxyAgent(
    name="User",
    human_input_mode="TERMINATE",
    llm_config=False,
)

# 群聊
group_chat = GroupChat(
    agents=[user_proxy, commander, writer, safeguard],
    messages=[],
    max_round=12,
    speaker_selection_method="auto",
)

manager = GroupChatManager(groupchat=group_chat, llm_config=llm_config)

# 启动
user_proxy.initiate_chat(
    manager,
    message="""撰写一篇关于"AI Agent 安全最佳实践"的技术文章。
要求：
1. 涵盖 Prompt 注入防护、权限控制、沙箱隔离
2. 包含具体的代码示例
3. 适合中级开发者阅读
4. 指挥官协调流程，写手起草，安全员审查""",
)

# 预期流程：
# 1. Commander 协调，邀请 Writer 起草
# 2. Writer 撰写初稿，发到群里
# 3. Commander 邀请 Safeguard 审查
# 4. Safeguard 严格审查，指出问题（技术错误、安全漏洞、合规问题）
# 5. Commander 邀请 Writer 根据审查意见修改
# 6. Writer 修改，说明修改了哪些地方
# 7. Commander 再次邀请 Safeguard 复审
# 8. Safeguard 确认审查通过
# 9. Commander 总结最终结果
# 10. User 确认，任务结束
```

---

## 五、易混概念对比表

| 维度 | AutoGen | LangGraph |
|------|---------|-----------|
| 定位 | 多智能体对话框架 | Agent 编排运行时 |
| 核心范式 | 对话式编程（群聊） | 状态图（节点+边） |
| 流程控制 | 隐式（Agent 自主） | 显式（图的边） |
| Agent 自主性 | 高 | 中（按图流转） |
| 代码执行 | 原生支持（UserProxyAgent） | 需要自己实现 |
| 人机交互 | 原生支持（UserProxyAgent） | 原生支持（Interrupt） |
| 持久化 | 弱（0.5+ 有改进） | 强（Checkpoint） |
| 可观测性 | 弱 | 强（LangSmith 集成） |
| 多 Agent 协作 | 强（群聊为核心） | 中（需要自己构建） |
| 生产可靠性 | 中 | 高 |
| 学习曲线 | 低（概念简单） | 中（状态图概念） |
| 适用场景 | 讨论式协作、软件开发、内容创作 | 流程明确的生产级 Agent |
| 推荐组合 | AutoGen 做讨论 + LangGraph 做流程控制 | |

| 维度 | AutoGen 0.2（经典） | AutoGen 0.5+ / MAF（新版） |
|------|---------------------|--------------------------|
| 架构 | 单层 | 三层（Core/AgentChat/Extensions） |
| 核心 API | ConversableAgent/AssistantAgent/UserProxyAgent | AssistantAgent（AgentChat）+ 事件驱动（Core） |
| 群聊 | GroupChat + GroupChatManager | RoundRobinGroupChat/SelectorGroupChat/Swarm |
| 编排模式 | 只有群聊 | Sequential/Concurrent/Handoff/Group Chat |
| 流式 | 基础 | 完善（所有模式支持流式） |
| 生产级 | 弱 | 中（持续改进） |
| 推荐 | 学习概念、简单原型 | 新项目直接用 MAF |

| 维度 | UserProxyAgent | AssistantAgent |
|------|---------------|---------------|
| 角色 | 人类代理 + 执行者 | LLM 助手 |
| LLM | 可选（默认不用） | 必须用 |
| 代码执行 | 原生支持 | 不支持（只写代码） |
| 人类输入 | 支持（ALWAYS/TERMINATE/NEVER） | 不支持 |
| 工具调用 | 支持 | 支持 |
| 典型用途 | 执行代码、请求人工输入 | 写代码、提供专业建议 |
| 类比 | 测试员 + 人类替身 | 专家顾问 |

| 发言模式 | 说明 | 优点 | 缺点 | 适用场景 |
|---------|------|------|------|---------|
| round_robin | 按固定顺序轮流 | 流程可控、每个 Agent 都发言 | 不够灵活 | 结构化协作（写稿→审稿→修改） |
| auto/dynamic | LLM 动态选择 | 灵活、只有相关 Agent 发言 | 可能选择不合理 | 灵活讨论（专家会诊、头脑风暴） |

| 编排模式 | 说明 | 适用场景 |
|---------|------|---------|
| Sequential | Agent 按顺序执行 | 流水线任务（起草→审查→定稿） |
| Concurrent | Agent 并行执行 | 独立子任务（同时搜索多个来源） |
| Handoff | Agent 间主动移交 | 复杂问题多专家协作（会诊） |
| Group Chat | 群聊讨论 | 需要讨论/辩论的任务 |

---

## 六、3个实战中的常见坑

### 坑 1：群聊陷入死循环——Agent 互相“踢皮球”，max_round 到了也没产出有效结果，Token 成本爆炸

**现象**：团队用 AutoGen GroupChat 构建多 Agent 协作系统，配置了 3-4 个 Agent（如程序员、测试员、审查员），设置 `max_round=10`。运行后发现：①Agent 之间互相“踢皮球”——程序员说“测试员你先测一下”，测试员说“程序员你代码还没写完”，审查员说“你们先讨论完我再审查”，没有实质进展；②Agent 重复说同样的话，或者在“好的”、“收到”、“同意”之间循环；③max_round 到了，任务没完成，只产出了一堆无意义的对话；④Token 成本很高——10 轮对话，每轮 4 个 Agent 都调用 LLM，成本是单 Agent 的 4 倍。团队以为是“Agent 提示词写得不好”，改了很多版提示词还是不行——根因是群聊的发言机制和 Agent 角色定义有问题。

#### 避坑
- **明确每个 Agent 的“发言触发条件”，不要让所有 Agent 都“随时可以发言”**：
  - 在系统提示词中明确：“只有当讨论内容涉及你的专业领域时，你才发言；否则保持沉默”
  - 例如：程序员只有在“需要写代码/修改代码”时发言；测试员只有在“代码已经写好，需要执行”时发言；审查员只有在“代码已经测试通过，需要审查”时发言
  - 这样可以避免“踢皮球”和无意义的发言

- **用 round_robin 模式替代 auto 模式，控制发言顺序**：
  - `speaker_selection_method="round_robin"`：Agent 按固定顺序轮流发言
  - 优点：流程可控，每个 Agent 都有明确的发言时机，不会“踢皮球”
  - 缺点：不够灵活，但对于结构化的协作流程（写代码→执行→审查）完全够用
  - 建议：先用 round_robin 跑通流程，再考虑是否需要 auto 模式

- **在系统提示词中明确“协作流程”，让 Agent 知道“什么时候该做什么”**：
  ```python
  system_message = """你是程序员。
  协作流程：
  1. 第一轮：你写代码，发给测试员
  2. 测试员执行代码，把结果发回
  3. 如果报错，你修改代码，再发给测试员（重复直到通过）
  4. 测试通过后，审查员审查代码
  5. 审查员提出问题后，你修改代码
  6. 全部通过后，说"TERMINATE"
  
  规则：
  - 只有在"需要写代码/修改代码"时才发言
  - 不要说"好的"、"收到"等无意义的话
  - 每次发言都要有实质内容（代码、分析、结论）
  """
  ```

- **设置“终止条件”，防止无限循环**：
  - `max_round`：最大轮数限制（必须设置，防止无限循环）
  - 在系统提示词中明确“任务完成后说 TERMINATE”
  - 可以配置 `is_termination_msg` 函数，自定义终止条件（如检测到“TERMINATE”关键词）
  - 监控每轮的输出，如果连续 2-3 轮没有实质进展，提前终止

- **减少 Agent 数量，能用 2 个就不用 4 个**：
  - Agent 越多，群聊越容易混乱，Token 成本越高
  - 简单任务：2 个 Agent（Assistant + UserProxy）就够了
  - 中等任务：3 个 Agent（如程序员 + 测试员 + 审查员）
  - 复杂任务：才考虑 4+ 个 Agent
  - 原则：能用更少 Agent 解决的，就不要加更多 Agent

- **用“指挥官”角色控制流程，而不是让所有 Agent 平等讨论**：
  - 增加一个 Commander Agent，负责协调讨论流程
  - Commander 决定“下一个谁发言”、“讨论是否可以进入下一阶段”
  - 其他 Agent 只在 Commander 邀请时发言
  - 这样可以避免“踢皮球”，提高协作效率
  - 这就是“Commander + Worker”模式，比纯平等群聊更可控

- **类比**：就像“开会”——
  - 无规则的会议 = 所有人随时可以发言，互相打断，踢皮球，开了 2 小时没结论（AutoGen 群聊死循环）
  - 有议程的会议 = 主持人按议程控制发言顺序，每个人知道什么时候该说什么，1 小时就有结论（round_robin + 明确流程）
  - 有主持人的会议 = 主持人决定谁发言、讨论是否深入，效率最高（Commander 模式）
  - AutoGen 群聊也是一样——需要“会议议程”（明确的协作流程）和“主持人”（Commander 或 round_robin），不能让 Agent “自由讨论”

### 坑 2：代码执行不安全——UserProxyAgent 直接在宿主机执行代码，恶意代码或 bug 可能删除文件、访问敏感信息、占用系统资源

**现象**：团队用 AutoGen 的 UserProxyAgent 执行 LLM 生成的代码，配置 `use_docker=False`（直接在宿主机执行），觉得“我们的 Agent 不会生成恶意代码”。结果是：①LLM 生成的代码有 bug，执行了 `rm -rf /tmp/*`，但因为工作目录配置错误，实际删除了用户主目录下的文件；②代码中有 `import os; os.environ["SECRET_KEY"]`，读取了环境变量中的敏感信息，然后在输出中泄露；③代码中有无限循环，占用了 100% CPU，导致系统卡死；④代码访问了网络，下载了未知来源的文件，存在安全风险。团队事后才意识到“LLM 生成的代码不一定安全”——根因是没有用 Docker 沙箱隔离代码执行环境。

#### 避坑
- **必须用 Docker 沙箱执行代码，绝对不要在宿主机直接执行**：
  ```python
  user_proxy = UserProxyAgent(
      name="user_proxy",
      code_execution_config={
          "work_dir": "coding",      # 工作目录（代码只能访问这个目录）
          "use_docker": True,         # 必须用 Docker
          "docker_image": "python:3.11-slim",  # 精简镜像，减少攻击面
          "timeout": 60,              # 执行超时（防止无限循环）
          "last_n_messages": 2,       # 只检测最近 2 条消息的代码
      },
  )
  ```
  - Docker 容器是隔离的——代码只能访问容器内的文件系统，不能访问宿主机
  - 工作目录挂载到容器——代码只能读写 `work_dir` 目录，不能访问其他目录
  - 即使代码有恶意操作（如 `rm -rf /`），也只会删除容器内的文件，不会影响宿主机

- **配置 Docker 容器的安全限制**：
  - **网络隔离**：可以配置 Docker 容器不访问网络，或只访问白名单端点
  - **资源限制**：配置 CPU、内存限制（`docker run --cpus=1 --memory=512m`），防止资源耗尽
  - **只读文件系统**：除了工作目录，其他文件系统只读
  - **非 root 用户**：容器内用非 root 用户运行，减少权限
  - **seccomp/AppArmor**：限制容器可以调用的系统调用

- **代码执行前的安全检查**：
  - 可以在 UserProxyAgent 中自定义代码执行前的钩子，检查代码是否包含危险模式
  - 危险模式：`rm -rf`、`os.system`、`subprocess`、`eval`、`exec`、网络访问、文件系统访问
  - 检测到危险模式时，请求人类确认后再执行
  - 不要完全依赖 LLM “不会生成恶意代码”——LLM 可能被 Prompt 注入，生成恶意代码

- **敏感信息隔离**：
  - 不要把 API Key、密码、Token 等敏感信息放在环境变量中（Docker 容器可能读取）
  - 用 Docker secrets 或挂载配置文件的方式传递敏感信息
  - 代码执行结果经过 PII 检测后再返回给对话（防止敏感信息泄露）

- **超时和资源限制是必须的**：
  - `timeout`：代码执行超时，防止无限循环（建议 30-60 秒）
  - Docker 资源限制：CPU、内存限制，防止资源耗尽攻击
  - 工作目录大小限制：防止代码生成大量文件占满磁盘

- **类比**：就像“实验室安全”——
  - 在办公桌上做化学实验（宿主机执行代码）= 危险，试剂洒了就污染整个办公室
  - 在通风橱里做实验（Docker 沙箱）= 安全，试剂洒了只在通风橱里，不会影响外面
  - 穿实验服、戴护目镜（安全检查、资源限制）= 额外的防护
  - AutoGen 代码执行也是一样——必须在“通风橱”（Docker 沙箱）里执行，不能在“办公桌”（宿主机）上直接执行

### 坑 3：把 AutoGen 当生产级框架用——缺少持久化、可观测性、权限控制，上线后问题不断，最后不得不迁移到 LangGraph

**现象**：团队用 AutoGen 构建了一个多 Agent 客服系统，觉得“AutoGen 群聊模式很适合客服场景（多个专家 Agent 协作回答用户问题）”。上线后问题不断：①用户对话中途服务器重启，对话历史丢失，用户抱怨“刚才说到一半就没了”（AutoGen 没有原生的持久化机制）；②出现问题时无法排查——不知道 Agent 为什么这么回答、调用了什么工具、花了多少 Token（AutoGen 的可观测性弱，没有 LangSmith 那样的追踪平台）；③Agent 调用了不该调用的工具（如客服 Agent 调用了退款工具），没有权限控制（AutoGen 的工具权限控制是全局的，不能按 Agent/用户细分）；④并发能力差——多个用户同时对话时，群聊状态混乱（AutoGen 的群聊是单线程的，不适合高并发）。团队花了很多时间补这些能力，最后发现“补的这些能力 LangGraph 原生就有”，不得不迁移到 LangGraph——根因是选型错误，AutoGen 适合原型验证和“讨论式”协作，不适合生产级高并发应用。

#### 避坑
- **明确 AutoGen 的定位——它是“多 Agent 对话框架”，不是“生产级 Agent 运行时”**：
  - AutoGen 的优势：多 Agent 对话、代码执行、人机交互、快速原型
  - AutoGen 的劣势：持久化、可观测性、权限控制、高并发、生产级运维
  - 选型时要根据场景选择——如果是生产级高并发应用，优先考虑 LangGraph；如果是原型验证、“讨论式”协作、代码执行场景，AutoGen 很合适

- **生产级场景的推荐架构：AutoGen + LangGraph 配合使用**：
  - **LangGraph 做外层编排**：管理用户会话、持久化状态、权限控制、可观测性、高并发
  - **AutoGen 做内层讨论**：当需要“多 Agent 讨论”时，LangGraph 调用 AutoGen 群聊作为一个“节点”
  - 这样既利用了 AutoGen 的多 Agent 对话能力，又利用了 LangGraph 的生产级能力
  - 架构：用户请求 → LangGraph（会话管理+持久化）→ 调用 AutoGen 群聊（多 Agent 讨论）→ 返回结果 → LangGraph（保存状态+追踪）

- **如果一定要用 AutoGen 做生产级，需要自己补这些能力**：
  - **持久化**：自己实现对话历史的数据库存储（如 Redis/PostgreSQL），服务器重启后恢复
  - **可观测性**：自己实现追踪（记录每个 Agent 的输入输出、工具调用、Token 用量、耗时），接入监控平台
  - **权限控制**：自己实现按 Agent/用户的工具权限控制，不要用全局的工具注册
  - **高并发**：自己实现会话隔离（每个用户会话独立的群聊实例），用异步/多进程处理并发
  - **错误处理**：自己实现重试、降级、超时、死循环检测
  - 补这些能力的成本很高——不如直接用 LangGraph

- **AutoGen 的最佳适用场景**：
  1. **原型验证**：快速验证多 Agent 协作的想法，几行代码就能跑起来
  2. **代码执行场景**：“写代码→执行→调试”闭环是 AutoGen 的杀手级应用
  3. **讨论式协作**：需要多个专家 Agent 讨论、辩论、评审的场景（如内容创作、技术评审）
  4. **人机交互场景**：需要人类在过程中参与（审批、纠错、补充信息）的场景
  5. **个人工具/内部工具**：用户量小、对生产级要求不高的场景

- **不适合用 AutoGen 的场景**：
  1. **高并发生产应用**：用户量大、需要 7x24 稳定运行
  2. **流程明确的任务**：不需要“讨论”，按固定流程执行即可（用 LangGraph 更合适）
  3. **严格的权限控制要求**：需要细粒度的工具权限、数据权限
  4. **复杂的状态管理**：需要持久化、故障恢复、时间旅行
  5. **需要详细可观测性**：需要追踪每个步骤、监控性能、量化质量

- **关注 AutoGen → Microsoft Agent Framework 的演进**：
  - 2026 年，AutoGen 正在向 Microsoft Agent Framework（MAF）演进
  - MAF 增加了更多生产级特性：流式、新编排模式（Handoff）、Agent Harness、CodeAct
  - 新项目建议直接用 MAF，而不是 AutoGen 0.2
  - 持续关注 MAF 的生产级能力（持久化、可观测性）是否成熟
  - 但目前（2026 年中），LangGraph 的生产级能力仍然比 MAF 更成熟

- **类比**：就像“交通工具选型”——
  - AutoGen = 卡丁车——好玩、灵活、上手快，适合游乐场（原型验证、个人工具），但不适合上高速公路（生产级高并发）
  - LangGraph = 轿车——舒适、安全、可靠，适合日常通勤和长途旅行（生产级应用），但灵活性不如卡丁车
  - 选卡丁车还是轿车，取决于“在哪里开”（场景）——在游乐场开卡丁车很开心，在高速公路上开卡丁车就很危险
  - AutoGen vs LangGraph 也是一样——根据场景选择，不要“一把锤子钉所有钉子”

---

## 七、进阶问题（引导往下挖）

### 问题 1：AutoGen 的“对话式编程”和 LangGraph 的“状态图编排”各有什么优劣势？在什么场景下应该用对话式，什么场景下应该用状态图？两者可以结合使用吗？

#### 引导思考
- **对话式编程（AutoGen）的本质**：
  - 把任务编排建模为“Agent 之间的对话”
  - Agent 是自主的——根据对话历史自主决定“说什么”、“什么时候说”
  - 流程是涌现的——不是预定义的，而是在交互过程中自然形成的
  - 上下文是共享的——所有 Agent 共享群聊历史

- **状态图编排（LangGraph）的本质**：
  - 把任务编排建模为“有向图”——节点是处理步骤，边是控制流
  - Agent 是受控的——按图的边流转，下一步做什么是确定的（或由条件边函数决定）
  - 流程是预定义的——开发者明确画出图的结构
  - 状态是显式的——用 TypedDict 定义，Reducer 管理合并

- **对话式编程的优势**：
  1. **灵活性高**：Agent 可以自主决定流程，不需要开发者预定义所有分支
  2. **适合“讨论式”任务**：需要多个专家讨论、辩论、评审的场景，对话式更自然
  3. **上手快**：概念简单（就是群聊），几行代码就能跑起来
  4. **人机交互自然**：人类可以像在群里发言一样参与讨论
  5. **代码执行闭环**：UserProxyAgent 的代码执行是原生支持的

- **对话式编程的劣势**：
  1. **不可预测**：流程是涌现的，可能出现死循环、踢皮球、无意义讨论
  2. **调试困难**：对话历史复杂，出问题时难以定位是哪个 Agent 的问题
  3. **Token 成本高**：每个 Agent 每轮都调用 LLM，多 Agent 多轮的成本是单 Agent 的 N 倍
  4. **生产级能力弱**：持久化、可观测性、权限控制、高并发都不如 LangGraph
  5. **质量不稳定**：Agent 的自主决策可能导致输出质量波动

- **状态图编排的优势**：
  1. **可预测**：流程是预定义的，每一步做什么是确定的
  2. **调试容易**：按节点追踪，出问题时可以定位到具体节点
  3. **生产级能力强**：持久化（Checkpoint）、可观测性（LangSmith）、权限控制、高并发都成熟
  4. **质量稳定**：流程固定，输出质量更可控
  5. **成本可控**：可以精确控制每一步的 LLM 调用，避免无意义的讨论

- **状态图编排的劣势**：
  1. **灵活性低**：需要开发者预定义所有分支，复杂场景下图会很复杂
  2. **不适合“讨论式”任务**：需要多个专家自由讨论的场景，状态图会很僵硬
  3. **上手慢**：需要理解状态图、Reducer、Checkpoint 等概念
  4. **人机交互需要额外配置**：Interrupt 机制不如群聊自然
  5. **代码执行需要自己实现**：没有 UserProxyAgent 那样的原生支持

- **场景选择决策框架**：
  ```
  用对话式还是状态图？
  ├── 任务需要多个 Agent 自由讨论/辩论吗？
  │   ├── 是 → 倾向于对话式（AutoGen）
  │   └── 否 → 继续判断
  ├── 任务流程明确吗？（每一步做什么是确定的）
  │   ├── 是 → 倾向于状态图（LangGraph）
  │   └── 否 → 继续判断
  ├── 需要代码执行闭环吗？（写代码→执行→调试）
  │   ├── 是 → 倾向于对话式（AutoGen）
  │   └── 否 → 继续判断
  ├── 是生产级高并发应用吗？
  │   ├── 是 → 倾向于状态图（LangGraph）
  │   └── 否 → 继续判断
  ├── 需要持久化/故障恢复吗？
  │   ├── 是 → 倾向于状态图（LangGraph）
  │   └── 否 → 两者都可以，选熟悉的
  └── 是原型验证/个人工具吗？
      ├── 是 → 对话式（AutoGen，上手快）
      └── 否 → 状态图（LangGraph，更可靠）
  ```

- **两者结合使用的架构**：
  ```
  ┌─────────────────────────────────────────────────────┐
  │              生产级应用（LangGraph 外层）             │
  │                                                     │
  │  用户请求                                           │
  │     ↓                                               │
  │  ┌───────────┐    ┌───────────┐    ┌───────────┐ │
  │  │  会话管理  │ →  │  权限检查  │ →  │  任务路由  │ │
  │  │ (Checkpoint)│   │           │   │           │ │
  │  └───────────┘    └───────────┘    └─────┬─────┘ │
  │                                            │       │
  │                              ┌─────────────┘       │
  │                              ↓                     │
  │              ┌──────────────────────────────┐      │
  │              │   AutoGen 群聊（内层节点）    │      │
  │              │                              │      │
  │              │  AgentA: "我来分析..."       │      │
  │              │  AgentB: "补充一下..."       │      │
  │              │  UserProxy: 执行代码...       │      │
  │              │  ...                          │      │
  │              │  （多 Agent 讨论/代码执行）   │      │
  │              └──────────────┬───────────────┘      │
  │                             │                       │
  │                             ↓                       │
  │              ┌──────────────────────────────┐      │
  │              │  结果处理 + 状态保存 + 追踪    │      │
  │              └──────────────────────────────┘      │
  │                             ↓                       │
  │                         返回用户                    │
  └─────────────────────────────────────────────────────┘
  ```

  **核心思路**：
  - LangGraph 做“外层”——管理用户会话、持久化状态、权限控制、可观测性、高并发、错误处理
  - AutoGen 做“内层”——当任务需要“多 Agent 讨论”或“代码执行闭环”时，LangGraph 调用 AutoGen 群聊作为一个“节点”
  - AutoGen 群聊的输出（讨论结果、代码执行结果）返回给 LangGraph，LangGraph 保存状态、记录追踪、返回给用户
  - 这样既利用了 AutoGen 的多 Agent 对话和代码执行能力，又利用了 LangGraph 的生产级能力

  **具体实现**：
  ```python
  from langgraph.graph import StateGraph, END
  from autogen import AssistantAgent, UserProxyAgent

  # LangGraph 节点：调用 AutoGen 群聊
  def autogen_discussion_node(state):
      # 初始化 AutoGen Agent
      coder = AssistantAgent(...)
      user_proxy = UserProxyAgent(...)
      
      # 启动群聊，获取结果
      result = user_proxy.initiate_chat(coder, message=state["task"])
      
      # 返回结果给 LangGraph
      return {"discussion_result": result.summary}

  # LangGraph 图
  graph = StateGraph(State)
  graph.add_node("autogen_discussion", autogen_discussion_node)
  graph.add_edge(START, "autogen_discussion")
  graph.add_edge("autogen_discussion", END)

  # 编译（带 Checkpoint，生产级持久化）
  app = graph.compile(checkpointer=postgres_saver)
  ```

- **类比**：就像“公司组织架构”——
  - 对话式（AutoGen）= 头脑风暴会议——大家自由讨论，灵活，可能产出创意，也可能跑题，适合创意阶段
  - 状态图（LangGraph）= 标准作业流程（SOP）——每一步做什么是确定的，可靠，可追溯，适合生产执行
  - 结合使用 = 公司的运作方式——创意阶段用头脑风暴（AutoGen），执行阶段用 SOP（LangGraph）
  - 比如：产品开发——先用头脑风暴（AutoGen）讨论需求和方案，再用 SOP（LangGraph）执行开发、测试、部署
  - 不是“二选一”，而是“在合适的阶段用合适的方式”

### 问题 2：AutoGen 正在向 Microsoft Agent Framework（MAF）演进，MAF 引入了 Handoff 等新编排模式。Handoff 和传统的 Router、Supervisor 有什么本质区别？Handoff 模式在什么场景下真正有价值？它的挑战是什么？

#### 引导思考
- **三种编排模式的对比**：

  **Router（路由）模式**：
  - 工作原理：一个 Router Agent 接收用户请求，根据请求内容选择一个 Specialist Agent，把请求转发给它，Specialist 端到端解决
  - 决策时机：一开始就决定谁处理
  - 控制权：Router 控制，Specialist 不主动移交
  - 上下文：路由时上下文有限（只有用户的初始请求）
  - 灵活性：低（路由规则固定，一旦路由就不换）
  - 类比：医院导诊台——一开始就分诊，分诊后就去对应科室，不会中途换科室

  **Supervisor（主管）模式**：
  - 工作原理：一个 Supervisor Agent 分解任务，分配给 Worker Agent，Worker 完成后把结果返回给 Supervisor，Supervisor 汇总结果
  - 决策时机：Supervisor 持续决策（分解、分配、汇总）
  - 控制权：Supervisor 集中控制，Worker 不主动移交
  - 上下文：Supervisor 有全局上下文，Worker 只有子任务上下文
  - 灵活性：中（Supervisor 可以调整分配，但 Worker 不主动移交）
  - 类比：餐厅主厨——接单后分解任务（配菜、炒菜、摆盘），分配给厨师，厨师完成后返回给主厨，主厨汇总出餐

  **Handoff（移交）模式**：
  - 工作原理：声明 Agent 之间的有向边（谁可以移交给谁），框架为每个 Agent 注入 handoff 工具。Agent 在执行过程中，如果发现“这个问题我不擅长，应该交给另一个专家”，就主动调用 handoff 工具，把控制权（连同完整上下文）移交给另一个 Agent
  - 决策时机：执行过程中动态决策（Agent 自主决定何时移交）
  - 控制权：Agent 主动移交，去中心化
  - 上下文：移交时可以传递完整上下文（包括已有的推理、中间结果）
  - 灵活性：高（Agent 可以在任何时候移交，甚至可以移交给多个 Agent）
  - 类比：医生会诊——全科医生看不了的病，转介给专科医生；专科医生看不了的，再转介给更资深的专家；转介时把病历（完整上下文）一起转过去

- **Handoff 的本质区别**：
  1. **去中心化 vs 集中控制**：
     - Router/Supervisor 是集中控制——有一个“中心”（Router/Supervisor）决定谁做什么
     - Handoff 是去中心化——Agent 自主决定何时移交，没有“中心”控制
  2. **执行中移交 vs 一开始路由**：
     - Router 是“一开始就决定”——路由后就不换了
     - Handoff 是“执行中发现不对再移交”——更灵活，可以处理“一开始判断错误”的情况
  3. **完整上下文传递**：
     - Router 路由时只有用户的初始请求，上下文有限
     - Handoff 移交时可以传递完整上下文（包括已有的推理、中间结果、工具调用记录）
  4. **Agent 的自主性**：
     - Router/Supervisor 模式下，Worker 是“被动执行”——被分配任务就做，不主动移交
     - Handoff 模式下，Agent 是“主动决策”——可以自主决定“我搞不定，交给别人”

- **Handoff 真正有价值的场景**：

  **场景 1：复杂问题，需要多专家协作，且一开始不知道该找哪个专家**：
  - 例如：用户问“我这个病该怎么治？”——可能需要内科、外科、影像科、病理科多个专家协作
  - Router 模式：一开始就分诊到某一个科室，但可能分诊错误（症状不典型）
  - Handoff 模式：全科医生先看，发现需要影像检查，移交给影像科；影像科发现需要病理分析，移交给病理科；病理科确诊后，移交给外科做手术
  - 每个专家都在自己的专业范围内工作，搞不定就移交给下一个专家

  **场景 2：任务执行中发现需要新的专业能力**：
  - 例如：开发一个软件——程序员写代码，发现需要数据库优化，移交给 DBA；DBA 优化后，发现需要安全审计，移交给安全专家
  - Router 模式：一开始就分配给程序员，但程序员可能不擅长数据库优化和安全审计
  - Handoff 模式：程序员在执行中发现需要其他专业能力，主动移交，上下文（代码、需求、已有的分析）一起传递

  **场景 3：问题边界模糊，需要“探索式”解决**：
  - 例如：研究一个新技术——需要搜索、阅读、实验、总结，可能需要多个专家（研究员、工程师、写作者）协作
  - Router 模式：一开始就决定“找研究员”，但研究员可能需要工程师帮忙做实验
  - Handoff 模式：研究员先做，发现需要做实验，移交给工程师；工程师做完实验，移交给写作者总结
  - 探索过程中自然涌现协作关系，而不是一开始就定死

  **场景 4：客服/技术支持，问题可能需要多部门协作**：
  - 例如：用户投诉“我的订单有问题”——可能需要客服、物流、财务、技术多个部门协作
  - Router 模式：一开始就分配给客服，但客服可能需要物流查包裹、财务退款、技术查系统
  - Handoff 模式：客服先处理，发现需要物流查包裹，移交给物流；物流发现需要退款，移交给财务；财务发现需要技术修复，移交给技术
  - 每个部门在自己的权限范围内操作，搞不定就移交给下一个部门

- **Handoff 的挑战**：

  **挑战 1：移交决策的准确性**：
  - Agent 如何判断“我搞不定，该移交给谁？”——这需要 Agent 有准确的自我认知和对其他 Agent 能力的了解
  - 如果 Agent 错误地认为“我能搞定”（过度自信），就不会移交，导致质量差
  - 如果 Agent 错误地认为“我搞不定”（过度自卑），就会频繁移交，导致效率低
  - 解决方案：在系统提示词中明确每个 Agent 的能力边界和“何时应该移交”；用 LLM 评估移交决策的质量

  **挑战 2：移交循环（死循环）**：
  - Agent A 移交给 Agent B，Agent B 又移交给 Agent A，形成循环
  - 或者 A→B→C→A，形成三角循环
  - 解决方案：设置最大移交次数；记录移交历史，检测循环；移交时必须传递“为什么移交”的理由，避免无意义的移交

  **挑战 3：上下文传递的完整性和一致性**：
  - 移交时需要传递完整上下文（对话历史、中间结果、工具调用记录），否则下一个 Agent 可能不理解“之前做了什么”
  - 但上下文太长会导致 Token 成本高，且可能包含无关信息
  - 解决方案：移交时自动总结上下文，只传递相关信息；用结构化的格式传递上下文（如 JSON），而不是纯文本

  **挑战 4：权限和安全**：
  - Agent A 移交给 Agent B 时，Agent B 获得了 Agent A 的上下文——可能包含敏感信息
  - Agent B 可能有 Agent A 没有的工具权限——移交后可能越权操作
  - 解决方案：移交时进行权限检查（Agent B 是否有权访问这些上下文/工具）；敏感信息脱敏后再传递；高风险操作需要人工确认

  **挑战 5：可观测性和调试**：
  - Handoff 是去中心化的，Agent 自主决定移交——出问题时难以追踪“为什么移交给这个 Agent”、“移交时传递了什么上下文”
  - 解决方案：记录每次移交的详细日志（时间、来源、目标、原因、传递的上下文）；用可视化工具展示移交路径（A→B→C）

  **挑战 6：与其他编排模式的混合**：
  - 实际应用中，可能需要混合使用 Handoff、Group Chat、Supervisor 等多种模式
  - 如何设计混合架构，避免混乱？
  - 解决方案：明确每种模式的适用场景，在合适的层级用合适的模式（如外层用 Supervisor，内层用 Handoff）

- **Handoff 的未来发展**：
  - **更智能的移交决策**：用专门的模型评估“是否应该移交”、“移交给谁”，而不是靠 Agent 的 LLM 自主判断
  - **移交时的上下文优化**：自动总结和筛选上下文，只传递相关信息，降低 Token 成本
  - **多 Agent 并行移交**：一个 Agent 可以同时移交给多个 Agent（扇出），多个 Agent 并行处理后再汇总
  - **移交的可解释性**：每次移交都有明确的原因和依据，人类可以理解和审计
  - **与人类协作的移交**：Agent 可以移交给人类（高风险操作需要人类处理），人类处理完再移交给 Agent

- **类比**：就像“工作中的'推活'”——
  - Router = 领导分配任务——领导一开始就决定谁做，做不好是领导分配错了
  - Supervisor = 项目经理协调——项目经理分解任务、分配、汇总，Worker 不主动推活
  - Handoff = 同事间主动协作——我做着做着发现“这个我不擅长，应该交给小王”，主动把活（连同我已有的工作成果）推给小王；小王做着做着发现“这个需要小李配合”，再推给小李
  - Handoff 的优势：灵活，每个人都在自己擅长的领域工作，搞不定就推给更擅长的人
  - Handoff 的挑战：可能“踢皮球”（互相推）、可能推错人、可能推来推去没进展
  - 好的 Handoff 机制 = 明确的能力边界 + 完整的上下文传递 + 防止循环的机制 + 可追踪的移交记录

- 延伸：后续知识点（生产级 Agent 架构设计）会深入讲解如何根据场景选择和组合不同的编排模式（Router/Supervisor/Handoff/Group Chat/Pipeline）

---

## 八、四关自测

### 复述关（3句话讲清）
1. AutoGen 是微软开源的多智能体框架，核心范式是“对话式编程”——把多个角色不同、上下文独立的 Agent 放进群聊，它们通过自然语言自主协商、辩论、移交来完成任务，而不是画死流程图。
2. 原生杀手级能力是“代码执行+人机交互+多 Agent 辩论”闭环：AssistantAgent 写代码→UserProxyAgent 在 Docker 里执行→报错就把错误发回调试，循环直到跑通；经典角色是 Coder/CodeReviewer/Commander/Writer/Safeguard。
3. 它正在向 Microsoft Agent Framework（MAF）演进，新项目建议直接用 MAF；生产级持久化/可观测性/高并发不如 LangGraph 成熟，适合原型验证和讨论式协作，生产复杂系统推荐 LangGraph 做外层、AutoGen 群聊做内层节点。

### 举例关（真实场景）
你想做一个“自动写代码并自测”的工具：定义一个 Coder Agent 负责写快排+测试，一个 CodeReviewer Agent 负责挑刺，一个 UserProxyAgent 负责在 Docker 沙箱里真正跑代码。任务一开始，Coder 把代码发到群里，UserProxy 自动检测代码块执行——测试报错了，错误信息发回群里，Coder 根据报错改代码再发，直到测试通过；然后 CodeReviewer 评审代码风格提出改进，Coder 再改，全部通过后 UserProxy 才请求你人工确认。整个过程就是一个“程序员-测试-评审”的虚拟团队在群里协作。

### 反例关（边界条件）
你用 AutoGen 群聊去做一个流程固定、要求可预测的生产客服系统——结果三个 Agent 在群里踢皮球，你一言我一语聊了十几轮还没出结果，token 烧了 10 倍，还经常死循环。流程明确、要持久化和高并发的场景就该用 LangGraph 状态图，而不是让 Agent 自由讨论。另一个坑是不给群聊设最大轮次——几个 Agent 互相客气“你来做吧”“不还是你来吧”，无限循环下去。最隐蔽的坑是让 AutoGen Agent 在没沙箱的环境里执行代码，UserProxyAgent 直接在你宿主机上跑生成的代码，等于把机器交给了模型。

### 教学关（给小白讲）
别的框架像流水线：原料从这头进，每一步加工好传到下一步，路线是提前画死的。AutoGen 像一个微信群聊：你拉了几个不同角色的人进来——一个会写代码的、一个会跑代码的、一个专门挑刺的。你在群里说一句“帮我写个快排并跑通”，他们几个就自己聊起来了：写代码的把代码发群里，跑代码的把结果发群里，报错了写代码的接着改，挑刺的还会提醒“你这里边界条件没处理”。好处是灵活、像真团队讨论；坏处是他们可能聊嗨了跑偏、踢皮球、聊太久。所以真正上生产，你会让一个靠谱的项目经理（LangGraph）管着他们，他们只在“需要内部讨论”时才开个小会。

---

## 资料来源

- 论文: [arXiv:2308.08155 - AutoGen: Multi-Agent Conversation Framework](https://arxiv.org/pdf/2308.08155v1.pdf)
- 官方博客: [Microsoft Research - AutoGen 发布博客](https://www.microsoft.com/en-us/research/blog/autogen-enabling-next-generation-large-language-model-applications/)
- 官方文档: [Microsoft Learn - Group Chat Orchestrations (MAF)](https://learn.microsoft.com/en-au/agent-framework/workflows/orchestrations/group-chat)
- 官方博客: [Microsoft DevBlogs - MAF at BUILD 2026](https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-at-build-2026-announce/)
- 官方博客: [Microsoft DevBlogs - MAF Reaches Release Candidate](https://devblogs.microsoft.com/foundry/microsoft-agent-framework-reaches-release-candidate/)
- 官方文档: [Microsoft Learn - Migration Guide: AutoGen to MAF](https://learn.microsoft.com/nl-nl/agent-framework/migration-guide/from-autogen/)
- 官方文档: [AutoGen - Group Chat (Core API)](http://microsoft.github.io/autogen/0.5.1/user-guide/core-user-guide/design-patterns/group-chat.html)
- 技术博客: [AI/TLDR - What Is AutoGen](https://ai-tldr.dev/learn/agent-frameworks/orchestration-frameworks/what-is-autogen/)
- 技术博客: [腾讯云 - AutoGen 多智能体实战](https://developer.cloud.tencent.com/article/2746744)
- 技术博客: [腾讯云 - AutoGen 解析与应用](https://cloud.tencent.com/developer/article/2728603)

> 来源核验 2026-11-25：全部外链逐一联网核验可访问，论文标题按 arXiv 原文校准；存疑数字保留原文标注。技术结论与官方文档不一致时以官方为准。
