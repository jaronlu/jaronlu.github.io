## 一、结论前置

1. **Agent 不是突然出现的**：从 2022 年 ChatGPT 发布到 2026 年，Agent 经历了“引擎期→框架期→标准化期→爆发期”四个阶段，每一步都有明确的技术突破驱动。
2. **三个关键转折点**：2023 年 Function Calling（模型从“能说”变“能做”）、2024 年 MCP 协议（工具接入从“各自为战”变“开放标准”）、2025 年 Computer Use + 编程 Agent（Agent 从“实验品”变“生产力工具”）。
3. **2025 是 Agent 元年**：Manus 爆火、Cursor/Claude Code 普及、OpenAI Operator/ChatGPT Agent 发布，Agent 从工程实验走向真实商业场景。2026 年出现消费级 Agent 产品（媒体报道 Muse 登顶美国 App Store 免费榜，见时间线里的标注），Agent 开始进入大众市场。

---

## 二、通俗类比 + 专业定义

### 通俗类比

**Agent 的发展史 = 一个实习生的成长史**

| 阶段 | 时间 | 实习生状态 | 对应技术 |
|------|------|-----------|---------|
| 引擎期 | 2022.11 | 刚入职，只会聊天回答问题，不会动手干活 | ChatGPT |
| 框架期 | 2023 | 学会了用工具（查资料、发邮件），但经常乱来、不知道什么时候停 | LangChain / AutoGPT / Function Calling |
| 标准化期 | 2024 | 公司制定了工具使用标准（MCP），实习生能稳定接入各种系统，还出现了专门写代码的实习生（Devin） | MCP / LangGraph / Devin |
| 爆发期 | 2025-2026 | 实习生能独立操作电脑、浏览网页、写代码，成为正式员工；消费级产品出现，人人都能用 | Operator / Manus / Claude Code / Muse |

### 专业定义

**AI Agent 发展史**：以 LLM 为推理引擎的自主智能体，从 2022 年 ChatGPT 发布开始，经历工具调用能力获得、框架生态形成、协议标准统一、生产级应用爆发四个阶段的技术演进历程。核心驱动力是**模型能力提升**（推理、视觉、长上下文）和**基础设施完善**（工具协议、执行环境、安全护栏）的双轮驱动。

---

## 三、底层机制：四个阶段详解

### 第一阶段：引擎期（2022.11 — 2023.01）

**核心事件**：ChatGPT 发布

**时间线**：
- **2022.11.30**：OpenAI 发布 ChatGPT，基于 GPT-3.5，5 天用户破百万，2 个月破亿
- 这是一切的起点——人类第一次大规模体验到“能理解自然语言、能连贯对话”的 AI

**阶段特征**：
- 模型只能“说话”，不能“做事”
- 多轮对话，但无工具调用，无循环执行
- 应用形态：聊天机器人、文案生成、代码补全

**局限性**：
- 知识截止日期固定，无法获取实时信息
- 无法操作外部系统（发邮件、查数据库、操作文件）
- 无法完成多步骤复杂任务

---

### 第二阶段：框架期（2023.01 — 2023.12）

**核心突破**：模型获得工具调用能力，Agent Loop 概念形成

**时间线**：

| 时间 | 事件 | 意义 |
|------|------|------|
| 2023.01 | LangChain 发布 | 首个流行的 LLM 应用框架，提出 Chain 概念 |
| 2023.01 | ReAct 范式开始流行（论文 2022.10 上 arXiv，ICLR 2023 发表） | Reasoning + Acting 范式：先推理下一步做什么，再调用工具，观察结果后继续推理。成为 Agent Loop 的标准范式 |
| 2023.03 | AutoGPT 开源 | 首个自主 Agent 演示：模型自己规划、自己调工具、自己迭代。GitHub Star 破 15 万，但很快沉寂（缺乏停止条件和验证机制） |
| 2023.06 | OpenAI 发布 Function Calling | **里程碑**：模型从“能说”变“能做”，可以结构化地声明调用外部函数 |
| 2023.09 | 微软发布 AutoGen | 首个主流多 Agent 框架，支持多个 Agent 对话协作 |
| 2023.11 | OpenAI 发布 GPTs | 用户可自定义 ChatGPT（自定义指令+知识库+工具），Agent 概念开始大众化 |

**阶段特征**：
- 模型获得工具调用能力（Function Calling）
- Agent Loop（推理→行动→观察→循环）成为标准范式
- 开源框架爆发（LangChain、AutoGPT、AutoGen）
- 但工具接入碎片化（每个工具要写定制胶水代码）
- Agent 经常陷入死循环或跑偏，缺乏生产级可靠性

**AutoGPT 的教训**：
- 证明了 Agent 的瓶颈不在模型智力，而在外部控制系统
- 缺乏停止条件、验证机制、错误处理
- 但它是第一个让大众看到“Agent 能自主完成任务”的演示

---

### 第三阶段：标准化期（2024.01 — 2024.12）

**核心突破**：工具接入标准化（MCP），生产级框架成熟（LangGraph），垂直 Agent 出现（Devin）

**时间线**：

| 时间 | 事件 | 意义 |
|------|------|------|
| 2024.01 | LangGraph 发布（PyPI 首版 2024.01） | LangChain 团队推出的图编排框架，将多 Agent 编排重构为“有状态节点图”，比开放式对话循环更可控、更适合生产 |
| 2024.01 | CrewAI 走红（PyPI 首版 2023.11） | 角色驱动的多 Agent 框架，更易上手 |
| 2024.03 | Cognition 发布 Devin | **首个 AI 软件工程师**：能独立读代码库、写代码、调试、提交 PR。标价 $500/月，引发“程序员要失业”讨论 |
| 2024.09 | OpenAI 发布 o1 推理模型 | 模型学会“先思考再回答”，推理能力大幅提升，为复杂任务规划奠定基础 |
| 2024.10 | Anthropic 发布 Computer Use | 模型首次能直接操作计算机图形界面（看截图、点击、输入），为 2025 年的浏览器 Agent 铺路 |
| 2024.11 | Anthropic 开源 MCP 协议 | **里程碑**：Model Context Protocol，为 LLM 与外部工具/数据/服务建立标准化通信协议。“AI 界的 USB-C”，一次编写 MCP Server，所有 MCP 兼容的 Agent 都能用 |
| 2024.12 | Google 发布 Gemini 2.0 + Project Mariner | 浏览器 Agent 研究原型，能浏览网页并在浏览器中完成任务 |

**阶段特征**：
- MCP 协议终结工具集成碎片化（从“每个工具写胶水代码”到“一次编写，处处接入”）
- LangGraph 等生产级框架成熟（图编排比自由循环更可控）
- 垂直 Agent 出现（Devin 编程 Agent）
- 推理模型（o1）提升复杂任务规划能力
- Computer Use 让模型第一次能直接操作图形界面
- Agent 开始从“实验品”向“生产工具”过渡

**MCP 的意义**：
- 之前：每个 Agent 框架有自己的工具接入方式，工具开发者要为 LangChain 写一套、为 AutoGen 写一套、为 CrewAI 写一套
- 之后：写一个 MCP Server，所有支持 MCP 的 Agent（Claude、Cursor、ChatGPT、LangChain…）都能直接用
- 类比：USB-C 统一了充电接口，MCP 统一了 Agent 工具接口

---

### 第四阶段：爆发期（2025.01 — 至今）

**核心突破**：Computer Use（Agent 能操作图形界面）、编程 Agent 普及、消费级 Agent 出现、Agent 间通信标准形成

**时间线**：

| 时间 | 事件 | 意义 |
|------|------|------|
| 2025.01 | OpenAI 发布 Operator | **Computer-Using Agent**：结合 GPT-4o 视觉 + 强化学习，能直接操作电脑图形界面（点击、输入、浏览网页）。在 WebArena 基准上刷新纪录 |
| 2025.02 | Anthropic 发布 Claude Code | 在 Claude 3.7 Sonnet 发布文中“顺带”推出，无独立博客。后来成为编程 Agent 事实标杆，改变开发者工作流 |
| 2025.03 | Manus 发布并爆火 | 通用智能体，能自主完成“调研→分析→生成报告”等复杂任务。引发全球 Agent 热潮，国内大厂纷纷跟进 |
| 2025 | 编程 Agent 爆发 | Cursor、Claude Code、Gemini CLI、Windsurf 等编程 Agent 普及，开发者工作流被重塑。“Agent 写代码”从 Demo 变成日常 |
| 2025.07 | ChatGPT Agent 正式发布 | OpenAI 将 Agent 能力集成进 ChatGPT，用户可让 ChatGPT 操作自己的电脑、管理复杂任务 |
| 2025.09 | GPT-5-Codex 对开发者开放 API | 编程 Agent 从订阅制扩展到 API 调用，开发者可在自己的产品中嵌入 Agent 编码能力 |
| 2025.10 | Agent Skills 出现 | 可复用的专业技能（Markdown 编写），Agent 可以像“安装插件”一样获得特定领域的专业能力 |
| 2025.10.06 | OpenAI DevDay：Codex 正式 GA | Codex 从研究预览转为正式可用，Sam Altman 称 GPT-5-Codex 是“专为 Codex 和 Agent 编码训练的版本” |
| 2025.11 | GPT-5.1-Codex-Max 发布 | 支持项目级重构、深度调试、持续数小时的 Agent 循环，编程 Agent 从“写函数”进化到“做项目” |
| 2025.12 | GPT-5.2-Codex 发布 | 通过上下文压缩提升长时间工作表现，Agent 编码能力持续迭代 |
| 2026.02.05 | Claude Opus 4.6 与 GPT-5.3-Codex 同日发布 | Anthropic 与 OpenAI 精确到分钟同日发布，超级碗各投 700 万美元广告。Opus 4.6 首次支持 1M token 上下文（beta），编程和 Agent 任务持续时间大幅提升 |
| 2026.03.12 | **A2A Protocol v1.0 发布** | **里程碑**：Agent2Agent 协议发布生产就绪版，定义跨厂商、跨组织的 Agent 间通信标准（发现、协商、派活、回调）。“Agent 界的 HTTP”，8 家大厂组成技术指导委员会 |
| 2026.03.17 | 阿里发布企业级 Agent 平台“悟空” | 国内首个统一界面处理文档、表格、会议、研究的企业级智能体平台，可对接钉钉和企业应用系统 |
| 2026.04.02 | Cursor 3 发布 | IDE 从“编辑器里的 AI 助手”重构为“多 Agent 编排平台”，支持从手机/Slack/GitHub 发起并行 Agent，自研 Composer 2 编码模型 |
| 2026.05 | Google I/O 发布 Gemini 3.5 | 价格砍半、速度 4 倍，低延迟 Agent 场景能力增强，推出 Gemini Omni 多模态 |
| 2026.05 | 百度推出通用智能体 DuMate | 集成搜索、代码、调研、数据分析、应用搭建于同一入口 |
| 2026.05.19 | Claude Managed Agents 升级 | 推出 dreaming（后台持续思考）、outcomes（评分器自动打回重做，任务成功率提升最高 10%）、多 Agent 编排（主 Agent 并行委派子 Agent） |
| 2026.05 | 中国发布国家 Agent 框架 | Agent 领域首次有国家级技术规范 |
| 2026.06.18 | Claude Code 支持 Artifacts | 编程 Agent 可直接生成可交互的前端/应用产物，从“写代码文件”到“直接出成品” |
| 2026.07.06 | 腾讯发布混元 Hy3 | MoE 架构（295B 总参/21B 激活），256K 上下文，Agent 能力大幅提升，接入元宝、CodeBuddy、WorkBuddy |
| 2026.07.09 | OpenAI 发布 GPT-5.6 系列 | 三档模型：Sol（旗舰）、Terra（均衡办公）、Luna（极速低成本），Agent 场景分层定价 |
| 2026.07.24 | Anthropic 发布 Claude Opus 5 | 接近 Fable 5 前沿智能但价格减半，编程和知识工作评测达 SOTA |
| 2026.07.28 | MCP 最终规范添加 stateless core | MCP 协议升级，服务器无需在请求间保留会话状态，更适合云原生和 Serverless 部署 |
| 2026.08 | 据媒体报道：Cursor 被 SpaceX 收购，Stripe 收购 OpenRouter | AI 开发者工具层开始剧烈整合，Agent 基础设施成为巨头争夺焦点（交易金额未核实，不在此列出） |
| 2026.08.14 | Claude Code auto mode 成为默认 | Pro/Max/Team 计划默认开启全自动模式，编程 Agent 从“人工确认每步”进入“默认自主执行”时代 |
| 2026.08.20 | **A2A 加入 Linux Foundation Agentic AI Foundation** | **里程碑**：Google 的 A2A 与 Anthropic 的 MCP 同处中立治理架构下，两大协议从竞争走向共存。MCP 管“Agent 调工具”，A2A 管“Agent 找 Agent” |
| 2026.08 | EU AI Act 透明度义务生效 | Agent 领域首次有专门的监管法规要求 |
| 2026.09 | OpenAI 发布 GPT-6 Astra | OpenAI 当时的旗舰模型，首个在 Preparedness Framework 下达到 Critical 级网络安全能力的模型，计算机操作/编程/科研达前沿水平。2026.11.17 又发布 GPT-6.2 Astra 与 Sol |
| 2026.09.03 | GPT-6.1 Sol 发布 | 以接近 Astra 的能力应对高难度编程和专业工作，价格更低 |
| 2026.09.16 | OpenAI 总裁宣布“AGI 时代来了” | Greg Brockman 称 GPT-6 Astra 已能自主干满 24 小时，AGI 不是时间点而是一段光谱 |
| 2026.09.19 | Claude Code 支持 AGENTS.md 通用格式 | 从 CLAUDE.md 扩展到行业通用的 AGENTS.md，项目规则文件开始跨工具标准化 |
| 2026.09.28 | **Manus 2.0 发布 + Cue 推出** | Manus 重构为 Cascade Agent 架构（项目从小开始、逐步扩展）；Cue 让每个个人 Agent 拥有独立邮箱、电话和钱包——Agent 开始拥有“数字身份” |
| 2026.09.29-30 | OpenAI DevDay：发布 Dots | **全天候自主智能体**：由 GPT-6 Astra 驱动，不用逐步下指令、会主动接手工作。同时发布 Agents API 公测、ChatGPT Space 协作区 |
| 2026.09 | Meta 发布 Muse | **消费级 Agent 里程碑**：据蓝鲸新闻报道，登顶美国 App Store 免费榜。标志 Agent 从开发者工具进入大众消费市场（下载量、日活等数字未取得一手数据，不在此列出） |
| 2026.10.05 | 白宫《超级智能协议》签署（据央视新闻报道） | Anthropic、Google、Meta、英伟达、OpenAI、xAI 六巨头共同签署前沿责任联合承诺，Agent 安全治理进入国家层面 |

> 标注“据媒体报道”的条目（Cursor / OpenRouter 收购、Muse、白宫协议）只找到媒体转述链接，没有取得公司公告等一手来源；相关数字在核实前不列出。

**阶段特征**：
- Computer Use 让 Agent 拥有“视力和四肢”，能操作任何图形界面
- 编程 Agent 成为最成熟的 Agent 应用场景（Cursor/Claude Code/Codex 日活百万级），从“写函数”进化到“做项目”
- 通用 Agent（Manus、ChatGPT Agent、Dots）走向大众，Dots 标志“全天候自主 Agent”时代开启
- 消费级 Agent（Muse，据媒体报道）出现，Agent 开始进入 C 端市场
- **双协议格局形成**：MCP（Agent→工具）+ A2A（Agent→Agent），同处 Linux Foundation 中立治理
- Agent 开始拥有“数字身份”（Manus Cue 的邮箱/电话/钱包），从工具向“数字员工”进化
- 监管框架建立（EU AI Act、中国国家框架、白宫超级智能协议）
- 推理算力占比 2026 年预计达 70.5%，AI 算力需求从训练转向推理和 Agent 运行
- AI 开发者工具层剧烈整合（Cursor→SpaceX、OpenRouter→Stripe）

---

## 四、最小可运行代码

### 用 20 行代码实现一个最小 Agent Loop（2023 年的方式）

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

def web_search(query):
    return f"搜索结果：{query} 的相关信息..."

tools = [{"type": "function", "function": {"name": "web_search",
    "description": "搜索网络信息", "parameters": {"type": "object",
    "properties": {"query": {"type": "string"}}, "required": ["query"]}}}]

messages = [{"role": "user", "content": "今天深圳天气怎么样？"}]

# 这就是 2023 年 Function Calling 带来的 Agent Loop
while True:
    resp = client.chat.completions.create(model=MODEL, messages=messages, tools=tools)
    msg = resp.choices[0].message
    if msg.tool_calls:
        messages.append(msg)
        for tc in msg.tool_calls:
            result = web_search(**json.loads(tc.function.arguments))
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})
    else:
        print(msg.content)
        break
```

### 用 MCP 接入工具（2024 年的方式，标准化）

```python
# 不需要为每个工具写定制代码，只需连接 MCP Server
# 需 pip install mcp
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client   # stdio_client 不在 mcp 顶层命名空间里

async def main():
    # 连接一个已有的 MCP Server（通过命令启动，如文件系统、数据库、GitHub）
    server_params = StdioServerParameters(command="npx", args=["-y", "<某个 MCP Server 的包名>"])
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()  # 自动获取所有工具定义
            for t in tools.tools:
                print(t.name, "-", t.description)
            # 之后由 LLM 决定调用哪个工具，再 await session.call_tool(name, arguments)

asyncio.run(main())  # stdio 客户端只能在 async 函数里用，不能在模块顶层直接 await
```

### 用 LangGraph 编排生产级 Agent（2024 年后的方式，可控）

```python
from langgraph.graph import StateGraph, END
# 定义状态、节点、条件边，形成有向图
# 比自由循环更可控，支持断点续跑、人工审批、并行执行
# 这是 2024 年后生产级 Agent 的标准架构
```

---

## 五、易混对比表

| 阶段 | 代表产品/技术 | 核心能力 | 工具接入方式 | 可靠性 | 典型应用 |
|------|-------------|---------|------------|--------|---------|
| 引擎期 2022 | ChatGPT | 文本生成、对话 | 无 | 高（单轮可预测） | 聊天、文案、代码补全 |
| 框架期 2023 | LangChain / AutoGPT | 工具调用、循环执行 | 定制胶水代码 | 低（死循环、跑偏） | Demo、实验项目 |
| 标准化期 2024 | MCP / LangGraph / Devin | 标准化工具接入、图编排 | MCP 协议（标准） | 中（可控但需配置） | 编程助手、企业内部工具 |
| 爆发期 2025-26 | Operator / Manus / Muse | 图形界面操作、自主任务 | MCP + Computer Use | 中高（有护栏但仍可能出错） | 编程、办公助理、消费级应用 |

| 概念               | 出现时间    | 解决的问题        | 现在状态        |
| ---------------- | ------- | ------------ | ----------- |
| Chain（LangChain） | 2023.01 | 串联多个 LLM 调用  | 已被 Graph 取代 |
| Agent Loop       | 2023.03 | 模型自主循环执行     | 仍是核心机制      |
| Function Calling | 2023.06 | 模型结构化调用工具    | 所有模型标配      |
| ReAct 范式         | 2022.10（论文上 arXiv） | 推理+行动交替      | 标准推理范式      |
| MCP 协议           | 2024.11 | 工具接入标准化      | 事实标准，持续演进（2026.07 stateless core） |
| Computer Use     | 2024.10（Anthropic 首发）；2025.01 Operator 把它带向浏览器 | Agent 操作图形界面 | 快速普及中       |
| Agent Skills     | 2025.10 | 可复用专业技能      | 新兴方向        |
| A2A 协议           | 2026.03 | Agent 间通信标准化    | v1.0 生产就绪，2026.08 加入 Linux Foundation |
| 全天候自主 Agent    | 2026.09 | Agent 主动接手工作、24h 运行 | Dots / Manus 2.0 引领，刚起步 |
| Agent 数字身份      | 2026.09 | Agent 拥有独立邮箱/电话/钱包 | Manus Cue 首创，新兴方向 |

---

## 六、3 个实战坑

### 坑 1：追新追过头，每个新框架都要学一遍

**现象**：2023 年学 LangChain，2024 年学 CrewAI，2025 年又要学 OpenAI Agents SDK、LangGraph…每个新框架都花时间学，结果每个都只懂皮毛，项目代码频繁重写。

**避坑**：
- 抓住不变的核心：**Agent Loop + 工具调用 + 状态管理**，这些是所有框架的共同基础
- 框架只是“壳”，换框架不换核心逻辑。理解了 Agent Loop 本质，任何新框架 1 小时就能上手
- 生产项目选成熟框架（LangGraph），不要追最新的实验性框架
- 关注协议标准（MCP）比关注框架更重要——协议是长期的，框架是短期的

### 坑 2：以为 2025 年的 Agent 能完全替代人，结果踩坑

**现象**：看了 Manus、Devin 的演示就以为 Agent 能完全自主工作，把重要任务全交给 Agent，结果 Agent 跑偏了、漏步骤了、甚至做错了，造成损失。

**避坑**：
- 当前（2026 年）Agent 的定位是**“副驾驶”**，不是“自动驾驶”。关键步骤必须有人工审核
- 高风险操作（付款、发邮件、删数据）必须加 Human-in-the-Loop 审批
- 给 Agent 设置明确的边界和约束（只能操作指定目录、只能调指定工具、最多 N 步）
- 重要任务先让 Agent 做草稿，人审核后再执行
- 记住：Agent 会“一本正经地胡说八道”，它的自信不等于正确

### 坑 3：忽视历史，以为 Agent 是 2025 年才有的新概念

**现象**：以为 Agent 是 2025 年 Manus 爆火后才出现的新概念，对 2023-2024 年的技术演进不了解，导致重复造轮子、犯前人已经犯过的错（如 AutoGPT 的死循环问题）。

**避坑**：
- 了解历史能避免重复踩坑：AutoGPT 在 2023 年就证明了“无约束的自由循环不可靠”，所以 2024 年后 LangGraph 用图编排替代自由循环
- 了解历史能理解技术选型的原因：为什么 MCP 重要？因为 2023 年每个框架各自为战，工具接入太痛苦
- 了解历史能判断趋势：从“聊天→工具→标准→生产力→消费级”的演进路径，可以推断下一步是“Agent OS”（Agent 成为操作系统的核心交互方式）
- 关键历史文档值得读：ReAct 论文（2022.10 提交，2023 传播）、MCP 规范、LangGraph 设计文档

---

## 七、进阶问题（引导往下挖）

### 问题 1：Agent 的下一个阶段是什么？“Agent OS” 会实现吗？

**引导思考**：
- 当前趋势：Agent 正在从“应用”变成“基础设施”——MCP 是工具标准、A2A 是 Agent 间通信标准、Agent Skills 是技能市场
- “Agent OS” 的含义：Agent 不再是一个 App，而是操作系统的核心交互层——你不用打开各个 App，直接跟 Agent 说“帮我做 X”，Agent 自动调用各个 App 的能力完成
- 媒体报道的 Meta Muse 爆火是一个信号：用户开始接受“用自然语言驱动 Agent 完成任务”的交互方式，而不是“打开 App 点按钮”
- 但挑战巨大：权限管理（Agent 能操作哪些 App？）、安全（Agent 做错事谁负责？）、隐私（Agent 能看到多少数据？）、标准化（所有 App 都要支持 MCP 吗？）
- 延伸：微软的 Copilot+ PC、苹果的 Apple Intelligence、Google 的 Gemini Nano 都在往“系统级 Agent”方向走，谁能成为“Agent 时代的 Windows”？

### 问题 2：2023 年 AutoGPT 失败了，2025 年的 Agent 为什么能成功？区别在哪？

**引导思考**：
- AutoGPT（2023）的问题：①模型能力不够（GPT-3.5 推理弱，经常跑偏）②无停止条件（死循环）③无验证机制（做错了不知道）④工具接入粗糙（每个工具要自己写）⑤无安全护栏（可能执行危险操作）
- 2025 年的 Agent 为什么能成：①模型能力大幅提升（GPT-4o/Claude 3.5 推理强、有视觉）②框架成熟（LangGraph 图编排可控，有停止条件和断点续跑）③协议标准（MCP 让工具接入标准化）④Computer Use（Agent 能操作真实界面，不只是调 API）⑤安全护栏（Human-in-the-Loop、权限控制、步数限制）⑥垂直场景突破（编程 Agent 有明确的成功标准：代码能跑、测试通过）
- 关键区别：**AutoGPT 是“通用自由循环”，2025 年的 Agent 是“有约束的循环”**——约束来自框架（图编排）、协议（MCP）、护栏（步数/权限/审批）、场景（垂直领域有明确成功标准）
- 教训：不是“Agent 概念不行”，而是“2023 年的基础设施不够”。当模型、框架、协议、护栏都成熟了，同一个概念就能落地
- 延伸：这对技术选型的启示是——不要因为早期 Demo 失败就否定一个方向，要判断是“概念问题”还是“基础设施问题”。基础设施会随时间成熟，概念问题则不会

---

## 八、四关自测

### 复述关（3句话讲清）
1. Agent 从 2022 年 ChatGPT 起走过四个阶段：引擎期（只会聊）→框架期（会调工具但爱乱跑）→标准化期（MCP 统一接口、LangGraph 可控编排）→爆发期（Computer Use + 编程 Agent + 消费级产品）。
2. 三个里程碑转折点是 2023 年 Function Calling（模型从能说变能做）、2024 年 MCP（工具接入从定制胶水变开放标准）、2025 年 Computer Use/编程 Agent（从实验品变生产力工具）。
3. 2025 是 Agent 元年，2026 年出现消费级 Agent 产品（据媒体报道 Muse 登顶 App Store），Agent 开始进入大众市场；AutoGPT 当年失败不是概念错，而是模型、框架、护栏等基础设施没成熟。

### 举例关（真实场景）
2023 年你想做个“自动订机票”Agent，得为携程、航司、支付各写一套胶水代码，模型还会在搜索和支付之间死循环；2024 年后只要接一个 MCP Server 就能调用这些工具，再用 LangGraph 画好“查票→比价→人工确认→支付”的图，加个步数上限，Agent 就能稳定跑通——这就是标准化期带来的本质变化。

### 反例关（边界条件）
看到 Manus、Devin 的演示就误以为 2026 年 Agent 能完全替代人，把付款、删数据、发对外邮件这类高风险操作全自动交给它——这是最典型的踩坑。当前 Agent 定位是“副驾驶”不是“自动驾驶”，关键步骤必须 Human-in-the-Loop 审批，否则它会一本正经地把错事做完。

### 教学关（给小白讲）
把 AI 想象成一个实习生的成长：2022 年刚入职只会陪聊；2023 年学会了用工具但经常乱来、不知道啥时候停；2024 年公司定了工具使用标准（就像统一充电口的 USB-C），他能稳定接各种系统了；2025 年起他会操作电脑、会写代码，成了正式员工，连普通人手机上都能用。Agent 不是一夜冒出来的，是这个实习生一年年练出来的。

---

## 资料来源

- 技术博客: [腾讯云 - AI Agent 四年四级跳：从聊天框到生产系统](https://developer.cloud.tencent.com/article/2753409)
- 技术博客: [DEV Community - From ChatGPT to AI Agents: 2022-2026](https://dev.to/mrbond6107/from-chatgpt-to-ai-agents-what-actually-changed-between-2022-and-2026-1dmc)
- 技术博客: [InfoQ - 一文看懂 AI Agent 四年发展史与底层逻辑](https://xie.infoq.cn/article/0278953294fd4763ea2a8e01f)
- 技术博客: [腾讯云 - 复盘 AI Agent 的完整进化线：从 LLM 到 Agent OS](https://developer.cloud.tencent.cn/article/2654884)
- 技术博客: [shailzajolly.github.io - From Generative AI to Agentic Systems](https://shailzajolly.github.io/blog/2026/from-genai-to-agentic-ai/)
- 行业报告: [epoch-arc.com - AI Agents: From Chat to Action](https://epoch-arc.com/arcs/ai-agents/)
- 行业报告: [AiTimeline - AI Agents History Timeline (1950–2026)](https://aitimeline.in/ai-agents-history-timeline-1265/)
- 权威媒体: [蓝鲸新闻 - Muse 狂飙，龙虾退潮](http://m.toutiao.com/group/7692665701538054671/)
- 行业报告: [中国工业互联网研究院 - AI Agent 智能体技术发展报告](https://www.china-aii.com/u/cms/www/202601/AI%20Agent%E6%99%BA%E8%83%BD%E4%BD%93%E6%8A%80%E6%9C%AF%E5%8F%91%E5%B1%95%E6%8A%A5%E5%91%8A.pdf)
- 权威媒体: [科创板日报 - 推理支出 2026 年首超训练](http://m.toutiao.com/group/7692829080043766272/)
- 官方博客: [A2A Protocol v1.0 发布](https://a2a-protocol.org/latest/blog/2026/03/12/a2a-protocol-ships-v10-production-ready-standard-for-agent-to-agent-communication/)
- 技术博客: [FlowHunt - A2A 加入 Linux Foundation 与 MCP 同治理](https://www.flowhunt.io/blog/agentic-ai-foundation-a2a-mcp-standards/)
- 技术博客: [CSDN - MCP 给了 AI 手，A2A 给了 AI 同事](https://blog.csdn.net/weixin_52326703/article/details/163326436)
- 官方博客: [Anthropic - Claude Opus 4.6](https://www.anthropic.com/news/claude-opus-4-6)
- 官方博客: [Anthropic - Claude Opus 5](https://www.anthropic.com/news/claude-opus-5)
- 权威媒体: [36氪 - OpenAI DevDay 甩出 Dots 和 GPT-6.1 Sol](https://36kr.com/p/4005455982974851)
- 权威媒体: [36氪 - OpenAI总裁：AGI时代来了，GPT-6已能自主干活24小时](https://36kr.com/p/3985931460492296)
- 权威媒体: [36氪 - Claude Code全面开放，接入AGENTS.md](https://m.36kr.com/p/3990050742107142)
- 技术博客: [AI/TLDR - Manus 2.0 and Cue](https://ai-tldr.dev/releases/tool/)
- 权威媒体: [钛媒体 - Gemini 3.5 发布](https://www.tmtpost.com/7994400.html)
- 权威媒体: [新华网 - OpenAI推出GPT-5.6系列模型](http://www.xinhuanet.com/20260710/74a4edded29942f8b0f02ac483a7a76f/c.html)
- 官方发布: [OpenAI - GPT-6 Astra](https://openai.com/zh-Hans-CN/research/index/)（研究频道索引页，不是单篇文章）
- 官方博客: [OpenAI - Introducing Operator（Computer-Using Agent）](https://openai.com/index/introducing-operator/)
- 官方博客: [Anthropic - Developing a computer use model](https://www.anthropic.com/news/developing-computer-use)
- 官方发布: [LangGraph - PyPI 发布记录（首版 2024.01）](https://pypi.org/project/langgraph/)
- 官方发布: [AutoGen - PyPI 发布记录（首版 2023.08）](https://pypi.org/project/pyautogen/)
- 官方发布: [CrewAI - PyPI 发布记录（首版 2023.11）](https://pypi.org/project/crewai/)
- 论文: [Yao et al., *ReAct: Synergizing Reasoning and Acting in Language Models*, ICLR 2023](https://arxiv.org/abs/2210.03629)
- 技术博客: [AI Beat - Cursor 3 多Agent编排](https://ai-beat.github.io/tags/agents/)
- 权威媒体: [央视新闻 - 中美AI“拐点”·白宫超级智能协议](http://m.toutiao.com/group/7693031906124038692/)

> 来源核验 2026-11-25：全部外链逐一联网核验可访问，论文标题按 arXiv 原文校准；存疑数字保留原文标注。技术结论与官方文档不一致时以官方为准。
>
> 2026-11-27 复核：更正 ReAct、AutoGen、CrewAI、LangGraph、Manus 的发布时间，补上 Computer Use 首发（2024.10）；Muse、Cursor / OpenRouter 收购、白宫协议三条只找到媒体转述链接，已标注“据媒体报道”并去掉未核实的数字。
