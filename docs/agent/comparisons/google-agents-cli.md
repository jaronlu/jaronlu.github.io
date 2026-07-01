# agents-cli 调研与对比

> 调研日期：2026-07-01  
> 仓库：https://github.com/google/agents-cli  
> 状态：活跃维护中，最新版本 v0.6.1（2026-06-28）

---

## What：这是什么？

`agents-cli` 是 Google 官方推出的 **CLI + skills 套件**，目标不是替代 Claude Code、Codex 或 Antigravity CLI 这类 coding agent 本体，而是让这些 coding agent 变得更擅长在 Google Cloud 上创建、评估、测试和部署 AI agent。

核心思想是：**你继续用自己喜欢的 coding agent 写代码，但让 agents-cli 给它注入"Agent 工程能力"**，包括脚手架、ADK 编码模式、评估体系、部署管道、发布注册和可观测性。

从仓库定位看，它是 **Google Agent Platform（Agent Runtime + Gemini Enterprise）的上层编排工具**，底层依赖的是 Google ADK（Agent Development Kit）。

---

## Why：为什么值得关注？

### 1. Google 在押注"coding agent + 企业级 agent 生命周期"组合
这个项目出现在 2026-04，距今不到 3 个月，已经发布到 v0.6.1，迭代节奏非常快：
- v0.1.3：2026-05-06
- v0.2.0：2026-05-19
- v0.3.0：2026-06-01
- v0.4.0：2026-06-10
- v0.5.0：2026-06-15
- v0.5.1：2026-06-22
- v0.6.0：2026-06-26
- v0.6.1：2026-06-28

这意味着 Google 正在快速完善"coding agent 工作流 → 企业 agent 部署"的闭环。

### 2. 它不是又一个 agent 框架，而是 agent 框架的"工程化外挂"
市面上已经有 LangChain、LlamaIndex、CrewAI、AutoGen 等框架。agents-cli 的差异化在于：
- **不重新发明 agent 运行时**，而是基于 Google ADK
- **不重新发明 coding agent**，而是给 Claude Code / Codex / Antigravity 加 skills
- **专注企业级生命周期**：scaffold → build → eval → deploy → publish → observe

这种定位让它避免了和主流 agent 框架直接竞争，反而成为 Google Cloud 上的"最佳实践落地工具"。

### 3. 社区关注度高，但贡献渠道有限
- Stars：4341（截至 2026-07-01）
- Forks：465
- Issues：22+ 个 open issues，包括安全问题和功能请求
- 贡献方式：仅接受 [issue 反馈](https://github.com/google/agents-cli/blob/main/CONTRIBUTING.md)，**暂不接受 PR**；社区讨论活跃，但代码改动由 Google 内部团队主导

### 4. 安全与治理是关注重点
项目已经出现了安全相关 issue（#50，path traversal in remote-template scaffolding），说明：
- 社区开始认真审视其攻击面
- 项目处于 Pre-GA 阶段，安全模型还在演化

---

## 仓库指标

| 指标 | 数值 |
|------|------|
| 创建时间 | 2026-04-08 |
| 主要语言 | Python |
| Stars | 4341（截至 2026-07-01） |
| Forks | 465（截至 2026-07-01） |
| 最新发布 | v0.6.1（2026-06-28） |
| 可见 issue | 22+ open |
| PR | 不接受外部 PR |
| 贡献方式 | 仅 issue 反馈 |
| 许可证 | Apache License 2.0 |
| 维护状态 | 活跃，非归档 |

---

## 源码结构

```
src/google/agents/cli/
├── data/
├── deploy/
├── dev/
├── eval/
├── info/
├── infra/
├── publish/
├── run/
├── scaffold/
│   └── utils/
│       └── template.py   # 1941 行，模板处理核心
├── setup/
├── _agent_runtime_a2a.py
├── _click.py
├── _experiments.py
├── _output.py
├── _project.py
├── _runner.py
├── _skills_check.py
├── _tools.py
├── _trust.py
├── auth.py
└── main.py
```

代码结构清晰，按功能域拆分：
- `scaffold`：项目创建和模板处理
- `eval`：评估数据集生成、grading、对比、分析、优化
- `deploy`：部署到 Cloud Run / GKE / Agent Runtime
- `infra`：基础设施 provisioning（Terraform）
- `publish`：Gemini Enterprise 注册
- `run`：本地运行 agent

---

## 核心 Skills

agents-cli 的核心不是二进制 CLI，而是 **7 个 skills**，这些 skills 会被注入到 coding agent 中：

| Skill | 职责 |
|-------|------|
| `google-agents-cli-workflow` | 开发生命周期、代码 Preservation 规则、模型选择 |
| `google-agents-cli-adk-code` | ADK Python API — agents、tools、orchestration、callbacks、state |
| `google-agents-cli-scaffold` | 项目脚手架 — create、enhance、upgrade |
| `google-agents-cli-eval` | 评估方法论 — metrics、datasets、LLM-as-judge、adaptive rubrics |
| `google-agents-cli-deploy` | 部署 — Agent Runtime、Cloud Run、GKE、CI/CD、secrets |
| `google-agents-cli-publish` | Gemini Enterprise 注册 |
| `google-agents-cli-observability` | 可观测性 — Cloud Trace、logging、third-party integrations |

---

## How：怎么用？

### 用法概述

agents-cli 的使用分成两层：

1. **CLI 直接使用**：在终端执行 `agents-cli <command>`，适合手动快速操作。
2. **注入 coding agent**：通过 `uvx google-agents-cli setup` 或 `npx skills add google/agents-cli`，把 skills 交给 Claude Code / Codex / Antigravity，让 coding agent 自动按企业级生命周期执行 scaffold、build、eval、deploy、observe。

典型生命周期是：

```
spec → scaffold → build → eval → deploy → publish → observe
```

其中本地开发阶段不需要 Google Cloud；只有 deploy、publish、可观测性后端才需要 GCP 项目。

---

### 案例1：全新项目，从零创建一个可部署的 agent

场景：你有一个文本压缩需求，想快速生成一个可运行、可评估、可部署到 Cloud Run 的 agent 项目。

```bash
# 安装 CLI + skills
uvx google-agents-cli setup

# 创建项目，使用 ADK 原型模板
agents-cli create caveman-agent --prototype --yes
cd caveman-agent

# 安装依赖
agents-cli install
```

结果：
- 生成包含 `app/agent.py`、测试、eval 数据集和 `agents-cli-manifest.yaml` 的项目骨架
- 你可以直接让 coding agent 修改 `app/agent.py` 里的 system prompt 和工具逻辑

官方教程：https://google.github.io/agents-cli/guide/quickstart-tutorial/

---

### 案例2：在现有 ADK 项目上补全部署能力

场景：你已经有一个手工创建的 ADK Python 项目，不想重建，但希望用 agents-cli 补齐 deploy / CI / 可观测性。

```bash
# 在现有项目根目录执行
agents-cli scaffold enhance --deployment-target cloud_run

# 部署
agents-cli deploy
```

不需要重写现有 agent 代码。这个能力让 agents-cli 可以"半侵入式"接入现有项目。

---

### 案例3：评估、对比、自动优化 prompt

场景：你已经有一个 agent，想通过结构化 eval 验证质量，并在失败时自动 tuning prompt。

```bash
# 生成 traces：对 eval dataset 跑一轮推理
agents-cli eval generate

# grading：对 traces 做自动评分
agents-cli eval grade

# 如果有多个结果文件，做回归对比
agents-cli eval compare run-a.json run-b.json

# 分析失败模式
agents-cli eval analyze

# 根据 eval 结果自动优化 prompt
agents-cli eval optimize
```

eval 还支持：
- `agents-cli eval dataset synthesize`：合成多轮对话场景
- `agents-cli eval metric list`：查看可用 metrics

---

### 案例4：部署到 Google Cloud 不同目标

| 目标 | 典型配置 | 说明 |
|------|----------|------|
| Cloud Run | `agents-cli scaffold enhance --deployment-target cloud_run` | Serverless，适合快速对外暴露 |
| GKE | `agents-cli scaffold enhance --deployment-target gke` | Kubernetes，适合高可控性 |
| Agent Runtime | `agents-cli scaffold enhance --deployment-target agent_runtime` | Google 托管推理服务，与 Gemini Enterprise 原生集成 |
| Agent Runtime + ADK | `agents-cli publish gemini-enterprise` | 注册到 Gemini Enterprise，由平台按 ADK 接口调用 |

注意事项：
- Agent Runtime 的 deploy 用 API，不用 Terraform；`infra single-project` 在 deploy 之后运行会创建重复 Reasoning Engine 实例
- v0.5.0 起 deploy 使用 CLI 自身的 Python 版本构建，依赖兼容性可能出问题
- 当前 deploy 不支持显式指定 Python 版本

---

### 案例5：可观测性与生产运维

默认行为：
- Cloud Trace 在部署后即自动启用，无需额外配置
- 可在 Google Cloud Console 的 Trace Explorer 中查看每个 LLM call 和 tool execution 的 span

增强配置：
```bash
# 配置可观测基础设施
agents-cli infra single-project
```

**顺序很重要**：`infra single-project` 应该在 `deploy` 之前运行，否则 Terraform 看不到已创建的 Reasoning Engine 资源，会再建一个重复实例。

---

### 案例6：作为 coding agent 的 skills 使用（推荐用法）

```bash
# 把 skills 注入 coding agent
uvx google-agents-cli setup
```

然后在 Claude Code / Codex / Antigravity 里直接说：
- "Use agents-cli to build a caveman-style agent that compresses verbose text into terse, technical grunts."
- "Write evals for the caveman agent and run them."
- "Deploy this to Cloud Run."
- "Set up observability for my agent."

coding agent 会自动激活对应 skill，这种用法把 agents-cli 从"又一个 CLI 工具"变成"coding agent 的企业级记忆库"。

---

## 横向对比

### vs LangChain / LlamaIndex / CrewAI / AutoGen

| 维度 | agents-cli | LangChain / LlamaIndex / CrewAI / AutoGen |
|------|-----------|---------------------------------------------|
| 定位 | 企业 agent **生命周期**工具（scaffold → eval → deploy） | 通用 **agent 框架**（编排、RAG、multi-agent） |
| 运行时 | Google ADK（官方绑定） | 各自自研 runtime |
| Coding agent 集成 | 官方 skills，面向 Claude Code / Codex / Antigravity | 无官方 coding-agent skills 集成 |
| 部署目标 | Cloud Run / GKE / Agent Runtime / Gemini Enterprise | 框架无关，需自行对接云平台 |
| 内置 eval 流水线 | 有（generate → grade → compare → optimize） | 部分框架有 eval 模块，无统一企业发布 gate |
| 成熟度 | Pre-GA，v0.6.1，2 个月 10+ 次 release | 成熟，社区生态大 |

**结论**：agents-cli 和 LangChain 等不是同层竞争——前者是「Google Cloud 上的 agent DevOps」，后者是「写 agent 逻辑的框架」。如果你已经在用 ADK + Claude Code/Codex，agents-cli 是目前最原生的企业化工具链；如果你需要多云或框架无关，继续用 LangChain/LlamaIndex 更合适。

### vs 直接使用 ADK
ADK 是 agent 框架，提供 Python API。agents-cli 在 ADK 之上增加了：
- 项目脚手架和模板
- 评估数据集管理和 grading
- 部署基础设施 provisioning
- Gemini Enterprise 发布
- 可观测性配置

相当于从"能写 agent"升级到"能规模化交付生产 agent"。

### vs 手动使用 gcloud / terraform
agents-cli 封装了 Google Cloud 的复杂 CLI 和服务，适合不想记忆大量 gcloud 命令的团队。代价是抽象泄漏时调试更困难。

---

## 如何判断是否适合你

### 适合
- 使用 Claude Code / Codex / Antigravity 作为主力 coding agent
- 目标部署在 Google Cloud（Cloud Run / GKE / Agent Runtime）
- 需要企业级 eval、部署、可观测性
- 团队希望统一 agent 开发生命周期标准

### 不适合
- 需要多云部署
- 主要使用 Java/TypeScript/Go 编写 agent（目前仅支持 Python）
- 希望向项目提交 PR 参与代码贡献（目前仅接受 issues）
- 对 Pre-GA 产品的稳定性要求高

---

## 结论：值不值得现在投入？

### 建议现在 PoC 的人
- 团队主力是 **Claude Code / Codex / Cursor**，且 agent 目标部署在 **Google Cloud**
- 已经在用或计划用 **ADK + Gemini Enterprise / Agent Runtime**，缺的是 eval、deploy、可观测性的标准化流程
- 愿意接受 Pre-GA 产品，PoC 预算可控（Cloud Run / Vertex 按量计费，小规模试用成本不高）

### 建议再等等的人
- **非 GCP 栈**（AWS / Azure / 自建 K8s）——部署链路强绑定 Google Cloud
- **非 Python 技术栈**——目前仅支持 ADK Python
- **生产环境稳定性要求高**——Pre-GA + 2 个月 10+ 次 release，API 和 deploy 行为仍在变
- **希望社区驱动修 bug**——不接受 PR，issue 响应节奏不可控

### 最大风险

1. **Vendor lock-in 加深**：scaffold 生成的 manifest、Terraform、CI 模板都指向 Google 生态，迁移成本高
2. **Pre-GA 安全面**：remote template path traversal 说明脚手架攻击面还在被社区挖掘，生产环境慎用 `--agent <remote>` 类远程模板
3. **抽象泄漏**：`infra` / `deploy` 顺序搞错会创建重复 Reasoning Engine；出问题时要同时懂 agents-cli、ADK、gcloud 三层
4. **与 coding agent 自带能力重叠**：Cursor skills、MCP、各平台 cloud deploy 扩展也在做类似事——agents-cli 的护城河是 **Google 官方 + ADK 原生 + eval 流水线**，如果这三点对你不重要，价值会打折

**一句话判断**：已经在 Google agent 生态里的人，现在就该装 skills 跑 PoC；其他人当信息雷达跟踪即可，等 GA 或出现第三方深度评测再决策。

---

## 相关链接

- 官方文档：https://google.github.io/agents-cli/
- 快速教程：https://google.github.io/agents-cli/guide/quickstart-tutorial/
- ADK：https://adk.dev
- Antigravity CLI：https://antigravity.google/
- Claude Code：https://docs.anthropic.com/en/docs/claude-code
- Codex：https://github.com/openai/codex
- Google Agent Platform：https://cloud.google.com/agent-builder
- Gemini Enterprise Agent Platform：https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale
