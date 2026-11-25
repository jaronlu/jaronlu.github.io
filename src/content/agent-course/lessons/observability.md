## 一、结论前置

1. **Agent 可观测性的核心挑战是“非确定性”——相同输入可能产生不同的工具序列、检索文档和响应，传统软件调试方法（断点、单步执行）完全失效，必须用“追踪（Tracing）”记录完整的决策过程**。传统软件是确定性的——相同输入必然产生相同输出，调试时可以用断点、单步执行、查看变量；Agent 是非确定性的——LLM 的推理、工具选择、检索结果每次都可能不同，同一个 bug 可能无法复现。因此 Agent 可观测性的核心是**追踪**——记录从用户输入到最终响应的完整执行树（每一步的思考、工具调用、参数、结果、延迟、token），事后可以回放和分析。追踪是 Agent 可观测性的“第一公民”，指标和日志都是辅助。

2. **Agent 可观测性的三大支柱是：追踪（Tracing）+ 指标（Metrics）+ 评估（Evaluation），三者形成“发现问题→定位问题→量化改进”的闭环**。①**追踪**：记录完整执行树，回答“Agent 做了什么、为什么这么做”，用于调试和定位问题；基于 OpenTelemetry 标准，用 Trace ID（会话标识）和 Span ID（操作标识）构建层次化执行树；②**指标**：量化整体性能，回答“Agent 表现如何”，关键指标包括成功率、平均步数、P50/P95/P99 延迟、每任务成本、错误率、工具调用分布、用户反馈（点赞/点踩）；③**评估**：量化输出质量，回答“Agent 回答得好不好”，包括 LLM-as-a-Judge（用另一个 LLM 自动评分）、人工标注、基于规则的检查。三者配合：指标发现异常（如成功率下降）→ 追踪定位问题（如某个工具频繁失败）→ 评估验证修复效果（如修复后质量分数提升）。

3. **生产级 Agent 可观测性的标准工具栈是：LangSmith（LangChain 生态首选）或 Langfuse（开源/自托管首选）+ OpenTelemetry（行业标准）+ Prometheus/Grafana（基础设施监控）**。LangSmith 是 LangChain 官方平台，提供全栈追踪、调试、评估、监控，与 LangChain/LangGraph 深度集成，还有 AI 助手 Polly 帮助理解大型 trace；Langfuse 是开源领导者，自托管和云版本功能一致，2025 年 6 月开源了 LLM-as-a-Judge 评估、注解队列、Prompt 实验等商业模块，适合数据驻留要求高的企业；OpenTelemetry 正在成为 AI 可观测性的默认标准，主要厂商都在 converging，语义约定提供了描述 LLM 操作的通用词汇；Prometheus/Grafana 用于基础设施层面的监控（CPU、内存、API 错误率）。选型原则：**用 LangChain/LangGraph 选 LangSmith，需要自托管选 Langfuse，跨框架/跨语言选 OpenTelemetry 兼容方案**。

---

## 二、通俗类比 + 专业定义

### 通俗类比

#### Agent 可观测性 = 餐厅的“明厨亮灶”监控系统

- **传统软件调试 = 闭源厨房 + 固定菜谱**：
  - 传统软件像闭源厨房，菜谱是固定的（确定性逻辑）
  - 出了问题可以按菜谱一步步查（断点、单步执行）
  - 相同的食材（输入）必然做出相同的菜（输出），bug 可以复现

- **Agent 调试 = 开放式厨房 + 厨师即兴创作**：
  - Agent 像开放式厨房，厨师（LLM）每次都即兴创作（非确定性）
  - 相同的食材（输入），厨师可能做不同的菜（不同的工具选择、推理路径）
  - 出了问题不能按固定菜谱查——因为没有固定菜谱
  - 需要“明厨亮灶”——全程录像，事后回放看厨师做了什么、为什么这么做

- **追踪（Tracing）= 厨房全程录像**：
  - 录像记录从顾客点菜（用户输入）到上菜（最终响应）的全过程
  - 包括：厨师思考（LLM 推理）、切菜（工具调用）、尝味道（检索结果）、调味（参数调整）
  - 每个动作都有时间戳、耗时、用料（token 用量）
  - 出了问题可以回放录像，看是哪一步出了问题
  - 这是 Agent 可观测性的核心——没有录像就不知道发生了什么

- **指标（Metrics）= 餐厅运营数据看板**：
  - 实时显示：平均出餐时间（延迟）、顾客满意度（用户反馈）、食材成本（token 成本）、退菜率（错误率）、每桌平均做菜步骤数（Agent 步数）
  - 可以发现趋势：最近退菜率升高了？出餐时间变长了？
  - 指标告诉你“有没有问题”，但不告诉你“问题在哪里”

- **评估（Evaluation）= 美食评论家打分**：
  - 每道菜做好后，美食评论家（另一个 LLM 或人工）打分：味道（回答质量）、卖相（格式）、营养（准确性）
  - 可以自动评分（LLM-as-a-Judge），也可以人工品尝（人工标注）
  - 评估告诉你“菜做得好不好”，而不只是“有没有做出来”

- **三者配合 = 发现问题→定位问题→改进**：
  - 指标发现：最近退菜率从 5% 升到 15%（有问题）
  - 追踪定位：回放录像发现，厨师最近经常用错调料（某个工具调用参数错误）
  - 评估验证：修复后，美食评论家打分从 7 分升到 9 分（改进有效）

- **LangSmith/Langfuse = 专业的餐厅监控系统**：
  - 提供录像回放（追踪可视化）、数据看板（指标）、评论家打分（评估）
  - 还有 AI 助手帮你看录像（Polly）：“这 100 段录像里，有 15 段是因为调料用错了”
  - 注解队列：让资深厨师（专家）审查特定录像，标注问题
  - 生产到开发：把真实问题转化为培训材料（数据集），改进厨师培训

### 专业定义

| 概念 | 定义 |
|------|------|
| **Observability（可观测性）** | 通过系统的外部输出（日志、指标、追踪）推断系统内部状态的能力。对于 Agent，可观测性意味着能够理解 Agent 的决策过程、工具调用、推理路径和输出质量。 |
| **Tracing（追踪）** | 记录一次完整请求的执行路径，包括所有子操作（LLM 调用、工具调用、检索步骤）及其耗时、输入输出、元数据。是 Agent 可观测性的核心，提供决策过程的完整上下文。 |
| **Trace（追踪链）** | 一次完整会话的标识，包含多个 Span。用 Trace ID 唯一标识，从用户输入开始，到最终响应结束。 |
| **Span（跨度）** | 追踪链中的单个操作，用 Span ID 唯一标识。每个 Span 记录操作名称、开始/结束时间、输入输出、元数据（token 用量、模型名称、工具参数等）。Span 之间有父子关系，构成层次化执行树。 |
| **Metrics（指标）** | 量化系统性能的数值数据，如成功率、延迟、成本、错误率。通常用时间序列存储，支持聚合、告警和趋势分析。 |
| **Logging（日志）** | 记录系统中发生的离散事件，通常是文本格式。比追踪更细粒度，但缺乏上下文关联。 |
| **Evaluation（评估）** | 量化 Agent 输出质量的过程，包括 LLM-as-a-Judge（自动评分）、人工标注、基于规则的检查。评估回答“回答得好不好”，而不只是“有没有回答”。 |
| **LLM-as-a-Judge** | 用另一个 LLM（通常是更强的模型）自动评估 Agent 输出质量的方法。可以按自定义标准打分，适合大规模自动化评估。 |
| **Annotation Queue（注解队列）** | 让领域专家审查、标注、纠正特定 trace 的工作流。用于高质量评估和构建训练/评估数据集。 |
| **OpenTelemetry（OTel）** | 云原生可观测性的行业标准，提供统一的 API、SDK 和数据格式用于追踪、指标和日志。AI 语义约定（Semantic Conventions for GenAI）提供了描述 LLM 操作的通用词汇。 |
| **Agent Graph Visualization（Agent 图可视化）** | 将 Agent 的执行过程可视化为有向图，展示节点（步骤）和边（数据流），帮助理解复杂 Agent 工作流的决策路径和瓶颈。 |
| **Online Eval（在线评估）** | 在生产环境中实时运行评估，对每个生产 trace 自动评分，及时发现质量下降和回归。 |
| **Regression Detection（回归检测）** | 自动检测 Agent 性能或质量的下降（回归），在用户发现之前告警。通常基于评估分数和指标的趋势分析。 |
| **Token Usage Tracking（Token 用量追踪）** | 记录每次 LLM 调用的输入/输出 token 数，并转换为成本。是成本可观测性的基础，支持按用户、会话、功能、模型维度的成本分析。 |
| **Production-to-Development Workflow（生产到开发工作流）** | 将生产环境中发现的问题（失败 trace、低质量输出）转化为开发环境中的评估数据集和改进任务，形成“发现问题→复现→修复→验证”的闭环。 |

---

## 三、底层机制

### 一、Agent 可观测性的特殊性

#### 传统软件 vs Agent 的可观测性差异
| 维度 | 传统软件 | Agent |
|------|---------|-------|
| 确定性 | 确定性（相同输入→相同输出） | 非确定性（相同输入→可能不同输出） |
| 调试方法 | 断点、单步执行、查看变量 | 追踪回放、执行树分析 |
| Bug 复现 | 通常可以复现 | 经常无法复现（非确定性） |
| 执行路径 | 固定（代码逻辑决定） | 动态（LLM 推理决定，每次可能不同） |
| 可观测性核心 | 日志 + 指标 | 追踪（第一公民）+ 指标 + 评估 |
| 质量度量 | 功能测试（通过/失败） | 评估（质量分数，连续值） |
| 错误类型 | 明确（异常、错误码） | 模糊（输出质量差、答非所问、幻觉） |

#### 为什么追踪是 Agent 可观测性的核心？
- Agent 的执行路径是动态的——每次可能调用不同的工具、检索不同的文档、走不同的推理路径
- 没有追踪，你只知道“输入是什么、输出是什么”，但不知道“中间发生了什么”
- 出了问题（如输出错误、延迟过高、成本异常），没有追踪就无法定位是哪一步出了问题
- 追踪记录完整的执行树，事后可以回放、分析、调试

### 二、追踪（Tracing）的核心机制

#### 基于 OpenTelemetry 的追踪模型
```
Trace（一次完整会话，Trace ID）
├── Span 1: 用户输入接收（root span）
│   ├── Span 2: LLM 推理（第 1 次调用）
│   │   ├── 输入: messages
│   │   ├── 输出: tool_calls
│   │   ├── 模型: gpt-4o
│   │   ├── token: 输入 500, 输出 100
│   │   └── 延迟: 1.2s
│   ├── Span 3: 工具调用 - search
│   │   ├── 参数: {"query": "AI 新闻"}
│   │   ├── 结果: 5 条结果
│   │   └── 延迟: 0.8s
│   ├── Span 4: LLM 推理（第 2 次调用）
│   │   ├── 输入: messages + 工具结果
│   │   ├── 输出: 最终答案
│   │   ├── token: 输入 1500, 输出 500
│   │   └── 延迟: 2.5s
│   └── Span 5: 响应生成
└── 总延迟: 4.5s
    总成本: $0.023
```

#### 每个 Span 应该记录的关键信息
| 字段 | 说明 | 示例 |
|------|------|------|
| name | 操作名称 | “llm.call”、“tool.search”、“retrieval” |
| trace_id | 追踪链 ID | “abc123...” |
| span_id | 当前 Span ID | “def456...” |
| parent_span_id | 父 Span ID | “abc123...” |
| start_time / end_time | 开始/结束时间 | 时间戳 |
| duration | 耗时 | 1.2s |
| input | 输入内容 | messages、工具参数 |
| output | 输出内容 | LLM 响应、工具结果 |
| model | 模型名称 | “gpt-4o” |
| token_usage | token 用量 | 输入 500, 输出 100 |
| cost | 成本 | $0.0023 |
| status | 状态 | “success”、“error” |
| error | 错误信息 | 异常类型和消息 |
| metadata | 自定义元数据 | 用户 ID、会话 ID、功能标识 |

#### Agent 特有的 Span 类型
1. **LLM 调用 Span**：记录每次 LLM API 调用，包括完整的 messages、模型参数、响应、token 用量
2. **工具调用 Span**：记录每次工具调用，包括工具名称、参数、结果、耗时
3. **检索 Span**：记录 RAG 检索步骤，包括查询、检索到的文档、相似度分数
4. **Agent 步骤 Span**：记录 ReAct 循环的每一步（思考→行动→观察）
5. **节点 Span**（LangGraph）：记录图中每个节点的执行
6. **评估 Span**：记录对输出的评估结果（LLM-as-a-Judge 分数）

### 三、关键指标（Metrics）体系

#### Agent 生产级监控的核心指标

| 类别 | 指标 | 说明 | 目标值/告警阈值 |
|------|------|------|---------------|
| **质量** | 任务成功率 | 成功完成任务的比例 | > 90%，< 80% 告警 |
| | 评估平均分 | LLM-as-a-Judge 或人工评分 | > 7/10，下降 > 1 分告警 |
| | 用户点赞率 | 用户反馈中点赞的比例 | > 80% |
| | 幻觉率 | 输出中包含虚假信息的比例 | < 5% |
| **性能** | P50 延迟 | 50% 请求的响应时间 | < 3s |
| | P95 延迟 | 95% 请求的响应时间 | < 10s |
| | P99 延迟 | 99% 请求的响应时间 | < 30s |
| | 首字延迟（TTFT） | 流式输出的第一个 token 时间 | < 500ms |
| | 平均步数 | 完成任务的平均 Agent 循环步数 | < 10 步 |
| **成本** | 每任务平均成本 | 完成一个任务的平均 LLM 成本 | 按业务设定 |
| | Token 消耗趋势 | 每日/每周 token 消耗量 | 异常增长告警 |
| | 模型成本分布 | 各模型的成本占比 | 监控贵模型使用比例 |
| | 缓存命中率 | Prompt Cache 命中比例 | > 50% |
| **可靠性** | 错误率 | 请求失败的比例 | < 2%，> 5% 告警 |
| | 工具错误率 | 工具调用失败的比例 | < 5% |
| | 重试率 | 需要重试的请求比例 | < 10% |
| | 死循环率 | 触发最大步数限制的比例 | < 3% |
| | 提前停止率 | 用户中途停止生成的比例 | < 15% |
| **使用** | 工具调用分布 | 各工具的调用次数和占比 | 监控工具使用模式 |
| | 会话长度分布 | 每会话的平均轮次 | 了解用户行为 |
| | 并发用户数 | 同时在线的用户数 | 容量规划 |
| | 功能使用分布 | 各功能的使用比例 | 产品决策 |

#### 指标的分层存储
- **实时指标**（Prometheus）：最近 1-7 天的高粒度数据，用于实时监控和告警
- **历史指标**（数据仓库）：长期聚合数据，用于趋势分析和容量规划
- **Trace 关联指标**：指标异常时，可以下钻到具体 trace 定位问题

### 四、评估（Evaluation）体系

#### 评估的三个层次
```
第 1 层：在线评估（Online Eval）
- 对每个生产 trace 自动运行评估
- 实时监控质量，及时发现回归
- 适合：简单的规则检查、LLM-as-a-Judge 快速评分

第 2 层：离线评估（Offline Eval）
- 在固定的评估数据集上运行评估
- 每次代码/Prompt/模型变更后运行
- 适合：全面的质量评估、A/B 测试、回归检测

第 3 层：人工评估（Human Eval）
- 领域专家审查和标注特定 trace
- 高质量、高成本、低频率
- 适合：关键场景的质量把关、构建评估标准
```

#### LLM-as-a-Judge 的实现
```python
async def evaluate_output(question: str, answer: str, context: str = None) -> dict:
    """用 LLM 评估输出质量"""
    eval_prompt = f"""请评估以下 AI 回答的质量，按 1-10 分打分。

评估标准：
1. 准确性（0-3 分）：回答是否事实正确，有无幻觉
2. 相关性（0-3 分）：回答是否切题，有无答非所问
3. 完整性（0-2 分）：回答是否完整覆盖问题
4. 格式（0-2 分）：回答格式是否清晰、易读

问题：{question}
回答：{answer}
上下文：{context or "无"}

请输出 JSON 格式：
{{"total_score": 0-10, "accuracy": 0-3, "relevance": 0-3, "completeness": 0-2, "format": 0-2, "reason": "评分理由"}}"""

    response = await client.chat.completions.create(
        model="gpt-4o",  # 用更强的模型做评估
        messages=[{"role": "user", "content": eval_prompt}],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
```

#### 评估与追踪的集成
- 每个 trace 可以附加评估结果（作为 Span 或 metadata）
- 可以按评估分数筛选 trace（如只看评分 < 5 的失败案例）
- 评估分数可以作为指标监控（如平均评估分数趋势）

### 五、主流可观测性工具对比

| 工具 | 类型 | 优势 | 劣势 | 适用场景 |
|------|------|------|------|---------|
| **LangSmith** | 商业（有免费层） | LangChain 生态深度集成、Polly AI 助手、全栈功能 | 非 LangChain 项目集成较复杂、数据在云端 | 使用 LangChain/LangGraph 的团队 |
| **Langfuse** | 开源（可自托管） | 自托管/云功能一致、开源、2025年开源商业模块 | 生态比 LangSmith 小、部分高级功能需配置 | 数据驻留要求高、需要自托管 |
| **Arize Phoenix** | 开源 | ML 级别可观测性、强大的评估功能 | Agent 特定功能较少 | 同时做 ML 和 LLM 的团队 |
| **OpenTelemetry** | 标准 | 行业标准、跨语言跨框架、厂商中立 | 需要自己搭建后端、AI 语义约定还在演进 | 跨框架/跨语言、需要标准化 |
| **Helicone** | 商业 | 简单易用、成本分析强 | 评估功能较弱 | 简单的 LLM API 监控 |
| **Braintrust** | 商业 | 评估实验强、Prompt 管理 | 追踪功能相对简单 | 以评估和实验为核心 |

#### LangSmith vs Langfuse 详细对比
| 维度 | LangSmith | Langfuse |
|------|-----------|----------|
| 开源 | 否（SDK 开源，平台闭源） | 是（MIT 协议，自托管功能一致） |
| 定价 | 按 trace 量收费，有免费层 | 开源免费，云版本按使用量收费 |
| LangChain 集成 | 原生（Callback） | 通过 CallbackHandler |
| 评估功能 | 强（在线评估、数据集、实验） | 强（LLM-as-a-Judge、注解队列、Prompt 实验） |
| AI 助手 | Polly（帮助理解 trace） | 无（或较弱） |
| 自托管 | 不支持 | 支持（Docker/K8s） |
| 数据驻留 | 数据在 LangChain 云端 | 可以完全自托管 |
| 社区 | 大（LangChain 生态） | 快速增长 |

#### 选型决策树
```
是否使用 LangChain/LangGraph？
├── 是 → 是否需要自托管？
│   ├── 否 → LangSmith（生态最顺）
│   └── 是 → Langfuse（自托管 + LangChain 集成）
└── 否 → 是否需要自托管？
    ├── 否 → LangSmith 或 Langfuse（都支持通用 SDK）
    └── 是 → Langfuse（开源首选）
是否需要跨语言/跨框架标准化？
└── 是 → OpenTelemetry 兼容方案（Langfuse 支持 OTel，LangSmith 也支持）
```

### 六、Agent 调试方法论

#### Agent 调试的标准流程
```
1. 发现问题
   ├── 指标告警（成功率下降、延迟升高、成本异常）
   ├── 用户反馈（投诉、点踩）
   └── 评估发现（质量分数下降）

2. 定位问题
   ├── 筛选相关 trace（按用户、会话、时间、错误类型）
   ├── 查看执行树（哪一步出了问题？）
   ├── 分析根因（工具错误？Prompt 问题？模型幻觉？检索不相关？）
   └── 用 AI 助手（Polly）快速理解大型 trace

3. 复现问题
   ├── 将问题 trace 保存为评估数据集
   ├── 在开发环境中复现（相同输入、相同配置）
   └── 确认问题可复现（非确定性问题可能需要多次运行）

4. 修复问题
   ├── 修改 Prompt / 工具描述 / 模型参数
   ├── 修复工具 Bug
   ├── 优化检索（增加文档、调整分块、重排序）
   └── 增加错误处理 / 降级逻辑

5. 验证修复
   ├── 在评估数据集上运行评估
   ├── 对比修复前后的质量分数
   ├── A/B 测试（小流量验证）
   └── 确认没有引入新问题（回归检测）

6. 部署监控
   ├── 全量部署修复
   ├── 持续监控指标和评估分数
   └── 将问题和解决方案记录到知识库
```

#### 常见 Agent 问题及调试方法
| 问题现象 | 可能原因 | 调试方法 |
|---------|---------|---------|
| 输出答非所问 | Prompt 不清晰、工具结果不相关 | 查看 LLM 输入（messages），检查检索结果相关性 |
| 工具调用参数错误 | 工具描述不清晰、Schema 设计差 | 查看工具调用 Span 的参数，优化工具描述和 Schema |
| 频繁调用错误工具 | 工具名称/描述混淆、工具太多 | 查看工具选择 Span，优化工具命名和描述，减少工具数量 |
| 死循环/步数过多 | 退出条件不明确、工具持续失败 | 查看执行树，检测重复动作，优化 Prompt 中的退出条件 |
| 延迟过高 | 某个工具慢、LLM 调用次数多 | 查看 Span 耗时分布，优化慢工具，减少不必要的 LLM 调用 |
| 成本过高 | 用了贵模型、上下文太长、重试多 | 查看 token 用量和模型分布，优化模型路由和上下文管理 |
| 幻觉/虚假信息 | 检索不相关、模型编造 | 查看检索 Span 的文档，增加引用和事实核查 |
| 工具调用失败 | 工具 Bug、参数错误、网络问题 | 查看工具 Span 的错误信息，修复工具或增加重试/降级 |

---

## 四、最小可运行代码示例

### OpenTelemetry 风格的 Agent 追踪装饰器

```python
import time
import json
import uuid
from functools import wraps
from typing import Any, Callable

class Span:
    """追踪 Span：记录单个操作的完整信息"""
    def __init__(self, name: str, trace_id: str = None, parent_span_id: str = None):
        self.name = name
        self.trace_id = trace_id or str(uuid.uuid4())
        self.span_id = str(uuid.uuid4())
        self.parent_span_id = parent_span_id
        self.start_time = time.time()
        self.end_time = None
        self.duration = None
        self.input = None
        self.output = None
        self.metadata = {}
        self.status = "running"
        self.error = None
        self.children = []

    def set_input(self, input_data: Any):
        self.input = input_data

    def set_output(self, output_data: Any):
        self.output = output_data

    def set_metadata(self, key: str, value: Any):
        self.metadata[key] = value

    def finish(self, status: str = "success", error: Exception = None):
        self.end_time = time.time()
        self.duration = self.end_time - self.start_time
        self.status = status
        if error:
            self.error = {"type": type(error).__name__, "message": str(error)}

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "trace_id": self.trace_id,
            "span_id": self.span_id,
            "parent_span_id": self.parent_span_id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration": self.duration,
            "input": str(self.input)[:1000] if self.input else None,  # 截断
            "output": str(self.output)[:1000] if self.output else None,
            "metadata": self.metadata,
            "status": self.status,
            "error": self.error,
            "children": [c.to_dict() for c in self.children],
        }


class Tracer:
    """追踪器：管理 Trace 和 Span，支持导出"""
    def __init__(self, service_name: str = "agent"):
        self.service_name = service_name
        self._current_trace = None
        self._span_stack = []
        self.exported_traces = []

    def start_trace(self, name: str, metadata: dict = None) -> Span:
        """开始一个新的 Trace"""
        span = Span(name)
        if metadata:
            span.metadata.update(metadata)
        self._current_trace = span
        self._span_stack = [span]
        return span

    def start_span(self, name: str, input_data: Any = None) -> Span:
        """在当前 Trace 中开始一个子 Span"""
        parent = self._span_stack[-1] if self._span_stack else self._current_trace
        span = Span(name, trace_id=self._current_trace.trace_id, parent_span_id=parent.span_id)
        if input_data:
            span.set_input(input_data)
        parent.children.append(span)
        self._span_stack.append(span)
        return span

    def end_span(self, span: Span, output_data: Any = None, status: str = "success", error: Exception = None):
        """结束一个 Span"""
        if output_data:
            span.set_output(output_data)
        span.finish(status=status, error=error)
        if self._span_stack and self._span_stack[-1].span_id == span.span_id:
            self._span_stack.pop()

    def end_trace(self, span: Span, output_data: Any = None):
        """结束 Trace 并导出"""
        if output_data:
            span.set_output(output_data)
        span.finish()
        self.exported_traces.append(span.to_dict())
        self._current_trace = None
        self._span_stack = []
        return span.to_dict()

    def trace_decorator(self, name: str = None):
        """装饰器：自动追踪函数调用"""
        def decorator(func: Callable):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                span_name = name or func.__name__
                span = self.start_span(span_name, input_data={"args": str(args), "kwargs": str(kwargs)})
                try:
                    result = await func(*args, **kwargs)
                    self.end_span(span, output_data=result)
                    return result
                except Exception as e:
                    self.end_span(span, status="error", error=e)
                    raise
            return async_wrapper
        return decorator


# 全局追踪器实例
tracer = Tracer(service_name="my-agent")


# 使用示例
async def llm_call(messages, model="gpt-4o"):
    """带追踪的 LLM 调用"""
    span = tracer.start_span("llm.call", input_data=messages)
    span.set_metadata("model", model)
    try:
        response = await client.chat.completions.create(model=model, messages=messages)
        token_usage = response.usage
        span.set_metadata("input_tokens", token_usage.prompt_tokens)
        span.set_metadata("output_tokens", token_usage.completion_tokens)
        span.set_metadata("cost", calculate_cost(model, token_usage))
        result = response.choices[0].message.content
        tracer.end_span(span, output_data=result)
        return result
    except Exception as e:
        tracer.end_span(span, status="error", error=e)
        raise


async def run_agent(user_input: str):
    """带完整追踪的 Agent 循环"""
    trace = tracer.start_trace("agent.run", metadata={"user_input": user_input})

    try:
        messages = [{"role": "user", "content": user_input}]

        for step in range(10):  # 最大 10 步
            step_span = tracer.start_span(f"agent.step.{step}", input_data=messages)

            # LLM 推理
            response = await llm_call(messages)
            messages.append({"role": "assistant", "content": response})

            # 如果需要工具调用
            if needs_tool_call(response):
                tool_span = tracer.start_span("tool.search", input_data=get_tool_params(response))
                try:
                    tool_result = await search_tool(get_tool_params(response))
                    tracer.end_span(tool_span, output_data=tool_result)
                    messages.append({"role": "tool", "content": tool_result})
                except Exception as e:
                    tracer.end_span(tool_span, status="error", error=e)
                    messages.append({"role": "tool", "content": f"工具错误: {e}"})

                tracer.end_span(step_span, output_data="tool_call")
                continue

            # 完成
            tracer.end_span(step_span, output_data=response)
            break

        result = messages[-1]["content"]
        trace_dict = tracer.end_trace(trace, output_data=result)

        # 导出 trace（实际项目中发送到 Langfuse/LangSmith/OTel 后端）
        print(f"Trace 导出: {json.dumps(trace_dict, indent=2, ensure_ascii=False)[:500]}...")
        return result

    except Exception as e:
        tracer.end_trace(trace)
        trace.error = {"type": type(e).__name__, "message": str(e)}
        raise
```

### 指标收集与告警（Prometheus 风格）

```python
from collections import defaultdict
import time

class AgentMetrics:
    """Agent 指标收集器"""
    def __init__(self):
        self.counters = defaultdict(int)      # 计数器
        self.histograms = defaultdict(list)   # 直方图（延迟分布）
        self.gauges = {}                       # 仪表盘（当前值）

    def increment(self, name: str, value: int = 1, labels: dict = None):
        """增加计数器"""
        key = f"{name}:{self._labels_str(labels)}"
        self.counters[key] += value

    def observe(self, name: str, value: float, labels: dict = None):
        """记录观测值（如延迟）"""
        key = f"{name}:{self._labels_str(labels)}"
        self.histograms[key].append(value)
        # 只保留最近 10000 个数据点
        if len(self.histograms[key]) > 10000:
            self.histograms[key] = self.histograms[key][-10000:]

    def set_gauge(self, name: str, value: float, labels: dict = None):
        """设置仪表盘值"""
        key = f"{name}:{self._labels_str(labels)}"
        self.gauges[key] = value

    def _labels_str(self, labels: dict = None) -> str:
        if not labels:
            return ""
        return ",".join(f"{k}={v}" for k, v in sorted(labels.items()))

    def get_percentile(self, name: str, percentile: float, labels: dict = None) -> float:
        """获取百分位数（如 P95）"""
        key = f"{name}:{self._labels_str(labels)}"
        values = sorted(self.histograms.get(key, []))
        if not values:
            return 0
        index = int(len(values) * percentile / 100)
        return values[min(index, len(values) - 1)]

    def get_summary(self) -> dict:
        """获取指标摘要"""
        summary = {
            "counters": dict(self.counters),
            "gauges": dict(self.gauges),
            "latency": {
                "p50": self.get_percentile("latency", 50),
                "p95": self.get_percentile("latency", 95),
                "p99": self.get_percentile("latency", 99),
            }
        }
        return summary


class AlertManager:
    """告警管理器"""
    def __init__(self, metrics: AgentMetrics):
        self.metrics = metrics
        self.alerts = []
        self.rules = [
            {"name": "高错误率", "condition": lambda m: m.counters.get("error:total", 0) / max(m.counters.get("request:total", 1), 1) > 0.05, "severity": "critical"},
            {"name": "高 P95 延迟", "condition": lambda m: m.get_percentile("latency", 95) > 10, "severity": "warning"},
            {"name": "低成功率", "condition": lambda m: m.counters.get("success:total", 0) / max(m.counters.get("request:total", 1), 1) < 0.9, "severity": "critical"},
        ]

    def check_alerts(self):
        """检查告警规则"""
        for rule in self.rules:
            if rule["condition"](self.metrics):
                alert = {
                    "name": rule["name"],
                    "severity": rule["severity"],
                    "time": time.time(),
                    "metrics_snapshot": self.metrics.get_summary(),
                }
                self.alerts.append(alert)
                print(f"[告警 {rule['severity']}] {rule['name']}")
                # 实际项目中发送到 Slack/飞书/邮件/PagerDuty


# 使用示例
metrics = AgentMetrics()
alert_manager = AlertManager(metrics)

async def monitored_agent_call(user_input: str):
    """带指标监控的 Agent 调用"""
    start_time = time.time()
    metrics.increment("request:total")

    try:
        result = await run_agent(user_input)
        metrics.increment("success:total")
        return result
    except Exception as e:
        metrics.increment("error:total")
        metrics.increment(f"error:{type(e).__name__}")
        raise
    finally:
        latency = time.time() - start_time
        metrics.observe("latency", latency)
        metrics.set_gauge("concurrent_users", get_concurrent_users())

        # 定期检查告警（每 100 次请求检查一次）
        if metrics.counters.get("request:total", 0) % 100 == 0:
            alert_manager.check_alerts()
```

---

## 五、易混概念对比表

| 维度 | 追踪（Tracing） | 指标（Metrics） | 日志（Logging） |
|------|----------------|----------------|----------------|
| 回答的问题 | “发生了什么、为什么” | “整体表现如何” | “具体事件是什么” |
| 粒度 | 完整执行树（每一步） | 聚合数值 | 离散事件 |
| 上下文 | 丰富（输入输出、元数据） | 有限（标签） | 中等（消息文本） |
| 存储成本 | 高（完整 trace 大） | 低（数值小） | 中 |
| 查询方式 | 按 Trace ID、用户、时间 | 时间序列聚合 | 关键词搜索 |
| 适用场景 | 调试、定位问题、根因分析 | 监控、告警、趋势分析 | 审计、事件排查 |
| Agent 中的地位 | 核心（第一公民） | 重要 | 辅助 |

| 维度 | 在线评估（Online Eval） | 离线评估（Offline Eval） | 人工评估（Human Eval） |
|------|----------------------|----------------------|---------------------|
| 运行时机 | 生产环境实时 | 开发/CI 环境 | 按需 |
| 数据来源 | 生产 trace | 固定评估数据集 | 特定 trace |
| 评估方式 | LLM-as-a-Judge、规则检查 | 全面评估、A/B 测试 | 专家审查、标注 |
| 成本 | 低（自动化） | 中（自动化+计算资源） | 高（人工时间） |
| 延迟 | 实时（秒级） | 分钟到小时 | 天到周 |
| 质量 | 中（LLM 评分有偏差） | 高（全面验证） | 最高（专家判断） |
| 适用场景 | 实时质量监控、回归检测 | 变更验证、模型对比 | 关键场景把关、标准制定 |

| 维度 | LangSmith | Langfuse | OpenTelemetry |
|------|-----------|----------|--------------|
| 类型 | 商业平台 | 开源平台 | 标准/协议 |
| 自托管 | 不支持 | 支持 | 取决于后端 |
| LangChain 集成 | 原生 | Callback | OTel 兼容 |
| 评估功能 | 强 | 强 | 需自己实现 |
| AI 助手 | Polly | 无 | 无 |
| 数据格式 | 专有 | 兼容 OTel | 标准 |
| 社区 | 大（LangChain 生态） | 快速增长 | 最大（云原生标准） |
| 适用场景 | LangChain 项目 | 需要自托管/开源 | 跨框架/跨语言标准化 |

| 指标类别 | 关键指标 | 告警阈值示例 |
|---------|---------|------------|
| 质量 | 任务成功率 | < 80% |
| | 评估平均分 | 下降 > 1 分 |
| | 用户点赞率 | < 70% |
| | 幻觉率 | > 10% |
| 性能 | P50 延迟 | > 5s |
| | P95 延迟 | > 15s |
| | P99 延迟 | > 30s |
| | 平均步数 | > 15 步 |
| 成本 | 每任务成本 | 增长 > 50% |
| | Token 消耗 | 异常增长 |
| | 缓存命中率 | < 30% |
| 可靠性 | 错误率 | > 5% |
| | 工具错误率 | > 10% |
| | 死循环率 | > 5% |
| | 重试率 | > 20% |

---

## 六、3个实战中的常见坑

### 坑 1：只记录 LLM 调用的输入输出，不记录工具调用和检索步骤，trace 不完整，出了问题无法定位是“模型想错了”还是“工具返回错了”

**现象**：团队实现了基础的 LLM 调用追踪，记录了每次 LLM 调用的 messages 和响应。但 Agent 出了问题（如输出错误信息），调试时发现：trace 里只有 LLM 的输入输出，看不到工具调用了什么、参数是什么、返回了什么、检索到了哪些文档。无法判断是“LLM 推理错了（选错工具/参数填错）”还是“工具返回错了（工具 Bug/检索不相关）”。结果是调试只能靠猜，效率极低。

#### 避坑
- **追踪必须覆盖 Agent 的完整执行树，不只是 LLM 调用**：
  - LLM 调用 Span：messages、模型、参数、响应、token、延迟
  - 工具调用 Span：工具名称、参数、结果、延迟、错误
  - 检索 Span：查询、检索到的文档（ID+摘要+相似度）、延迟
  - Agent 步骤 Span：每一步的思考、行动、观察
  - 节点 Span（LangGraph）：图中每个节点的输入输出

- **工具调用的输入输出必须完整记录**：
  ```python
  # ❌ 不完整：只记录工具名称，不记录参数和结果
  span = tracer.start_span("tool.search")
  result = search(query)
  span.finish()

  # ✅ 完整：记录参数、结果、延迟、错误
  span = tracer.start_span("tool.search", input_data={"query": query})
  try:
      result = search(query)
      span.set_metadata("result_count", len(result))
      span.set_output(result)  # 完整结果（或截断后）
      span.finish(status="success")
  except Exception as e:
      span.finish(status="error", error=e)
      raise
  ```

- **检索步骤必须记录检索到的文档**：
  - RAG 场景中，检索到的文档直接影响 LLM 的回答
  - 必须记录：查询、检索到的文档 ID、文档摘要、相似度分数、排名
  - 这样可以判断“回答错误是因为检索到了不相关的文档”还是“LLM 忽略了相关文档”

- **Agent 的思考过程也要记录**：
  - ReAct 模式中，LLM 的“思考”（Thought）是决策的关键
  - 记录每一步的思考内容，可以理解 Agent 为什么做某个决策
  - 对于“Agent 为什么调用这个工具”这类问题，思考过程是最直接的答案

- **用框架原生的追踪集成，不要自己手写**：
  - LangChain：用 LangSmith Callback 或 Langfuse CallbackHandler，自动记录所有步骤
  - OpenAI Agents SDK：用 Langfuse 的 OpenAI Agents 集成
  - 原生实现：用 OpenTelemetry SDK，按 GenAI 语义约定埋点
  - 自己手写追踪容易遗漏步骤，而且维护成本高

- **trace 要有足够的上下文关联**：
  - 每个 trace 关联用户 ID、会话 ID、功能标识
  - 可以按用户、会话、功能筛选 trace
  - 出了问题可以快速找到相关用户的所有 trace，分析模式

- **类比**：就像“看病历”——
  - ❌ 不完整的病历：只记录“病人吃了什么药”（LLM 输入输出），不记录“医生为什么开这个药、检查结果是什么、病人反应如何”（工具调用、检索、思考过程）
  - 出了问题（病人病情恶化），无法判断是“医生诊断错了”还是“检查结果错了”还是“药有问题”
  - ✅ 完整的病历：记录症状（用户输入）、医生诊断（LLM 思考）、检查项目和结果（工具调用/检索）、开的药（LLM 输出）、病人反应（用户反馈）
  - 出了问题可以一步步回溯，找到根因
  - Agent 追踪也是一样，完整的执行树是调试的基础

### 坑 2：只监控基础设施指标（CPU、内存、API 错误率），不监控 Agent 特有指标（成功率、步数、质量分数、幻觉率），“系统没宕机但 Agent 回答得很差”发现不了

**现象**：团队搭建了完善的基础设施监控（Prometheus + Grafana），监控 CPU、内存、磁盘、网络、API 错误率、P99 延迟。系统运行稳定，所有指标都在正常范围内。但用户反馈越来越多——“Agent 经常答非所问”、“有时候会编造信息”、“有时候会陷入循环”。团队查监控发现所有基础设施指标都正常，无法解释用户反馈。原因是：基础设施指标只能反映“系统有没有宕机”，不能反映“Agent 回答得好不好”。Agent 的质量问题（幻觉、答非所问、死循环）不会导致 API 错误或 CPU 飙升，但会严重影响用户体验。

#### 避坑
- **必须监控 Agent 特有指标，不能只看基础设施**：

  **质量指标**（最重要）：
  - 任务成功率：成功完成任务的比例（不是“API 调用成功”，而是“用户问题得到满意回答”）
  - 评估平均分：LLM-as-a-Judge 或人工评分的平均值
  - 用户点赞/点踩率：用户直接反馈
  - 幻觉率：输出中包含虚假信息的比例（用事实核查评估）
  - 答非所问率：回答与问题不相关的比例

  **行为指标**（Agent 特有）：
  - 平均步数：完成任务的平均 Agent 循环步数（步数过多可能是死循环或效率低）
  - 工具调用分布：各工具的调用次数和占比（发现异常的工具使用模式）
  - 死循环率：触发最大步数限制的比例
  - 提前停止率：用户中途停止生成的比例（过高说明回答质量差或太慢）
  - 重试率：需要重试的比例（过高说明工具或模型不稳定）

  **成本指标**：
  - 每任务平均成本：完成一个任务的平均 LLM 成本
  - Token 消耗趋势：每日/每周 token 消耗量
  - 模型成本分布：各模型的成本占比（监控贵模型使用比例）
  - 缓存命中率：Prompt Cache 命中比例

- **建立“质量-性能-成本”三维监控看板**：
  - 质量维度：成功率、评估分数、用户反馈、幻觉率
  - 性能维度：P50/P95/P99 延迟、平均步数、TTFT
  - 成本维度：每任务成本、Token 消耗、缓存命中率
  - 三个维度同时监控，才能全面了解 Agent 的健康状况

- **设置 Agent 特有的告警规则**：
  - 质量告警：成功率 < 80%、评估分数下降 > 1 分、用户点踩率 > 30%
  - 行为告警：平均步数 > 15、死循环率 > 5%、提前停止率 > 30%
  - 成本告警：每任务成本增长 > 50%、Token 消耗异常增长
  - 这些告警比“CPU > 80%”更能反映 Agent 的真实问题

- **在线评估（Online Eval）是质量监控的关键**：
  - 对每个生产 trace 自动运行 LLM-as-a-Judge 评估
  - 实时监控评估分数趋势，及时发现质量下降
  - 可以按功能、用户群、模型版本细分评估分数
  - 在线评估是“自动化的质量监控”，比等用户反馈快得多

- **回归检测（Regression Detection）**：
  - 每次部署新版本（Prompt 变更、模型升级、代码修改）后，对比新旧版本的评估分数
  - 如果新版本的评估分数显著下降，自动告警或回滚
  - 可以用 A/B 测试（小流量验证）降低风险
  - 回归检测确保“修改不会让 Agent 变得更差”

- **类比**：就像“餐厅评价”——
  - 基础设施指标 = 餐厅的水电煤、厨房设备是否正常（“冰箱没坏、灶台没堵”）
  - Agent 特有指标 = 菜品质量、顾客满意度、退菜率、每桌平均做菜时间
  - 只监控水电煤，发现不了“菜做得难吃、顾客投诉多”——因为水电煤正常不代表菜好吃
  - 必须同时监控菜品质量（评估分数）、顾客满意度（用户反馈）、退菜率（错误率）、做菜时间（延迟）
  - 餐厅老板真正关心的是“顾客满不满意、赚不赚钱”，而不是“水电煤正不正常”
  - Agent 监控也是一样，基础设施指标是基础，但 Agent 特有指标才是真正反映用户体验和业务价值的

### 坑 3：trace 数据量太大，存储成本高、查询慢，团队要么不记录完整 trace，要么记录了但查不动，“可观测性”变成“可观测但不可用”

**现象**：团队实现了完整的 Agent 追踪，记录了所有 LLM 调用、工具调用、检索步骤的完整输入输出。运行一个月后发现：①trace 数据量巨大（每天几十 GB，因为 LLM 的输入输出可能很长），存储成本很高；②查询慢（按用户筛选 trace 需要扫描大量数据，一次查询几分钟）；③trace 可视化工具加载慢（大型 trace 有几百个 Span，前端渲染卡顿）。结果是：团队要么开始删减 trace 内容（只记录摘要，不记录完整输入输出），要么记录了但很少查（因为查太慢）。“可观测性”变成了“可观测但不可用”——数据有，但用不起来。

#### 避坑
- **合理设计 trace 存储策略，不是“全量永久保存”**：

  **分层存储**：
  - 热数据（最近 1-7 天）：完整 trace，存在高性能存储（Elasticsearch、ClickHouse），支持快速查询
  - 温数据（7-30 天）：完整 trace，存在对象存储（S3）+ 索引，查询稍慢但成本低
  - 冷数据（30 天以上）：只保留聚合指标和关键 trace（失败的、低质量的、用户投诉的），删除普通 trace 的详细内容
  - 这样可以大幅降低存储成本，同时保留最近的完整 trace 用于调试

  **采样策略**：
  - 成功的 trace：采样保存（如 10%），用于统计分析
  - 失败的 trace：100% 保存，用于调试
  - 低质量的 trace（评估分数低）：100% 保存，用于改进
  - 用户投诉的 trace：100% 保存，用于问题排查
  - 高价值用户的 trace：100% 保存
  - 采样可以大幅减少数据量，同时保留重要的 trace

  **内容截断**：
  - LLM 输入输出：超过一定长度（如 10000 字符）后截断，保留开头和结尾
  - 工具结果：大结果（如搜索返回 100 条）只保留前 N 条和摘要
  - 检索文档：只记录文档 ID 和摘要，不记录完整文档内容
  - 截断可以大幅减少每个 trace 的大小，同时保留调试所需的关键信息

- **优化 trace 查询性能**：
  - 建立合适的索引：按 trace_id、user_id、session_id、时间、状态、评估分数建索引
  - 使用列式存储（ClickHouse）：适合大规模 trace 的聚合查询和分析
  - 预聚合：定期（每小时/每天）预计算指标（成功率、平均延迟、成本分布），查询时直接用预聚合结果
  - 分页查询：trace 列表查询必须分页，不要一次返回几千条

- **优化 trace 可视化性能**：
  - 大型 trace（几百个 Span）默认只显示概要（执行树的顶层节点），用户点击展开才加载子节点
  - 虚拟滚动：只渲染可视区域的 Span，不要一次性渲染所有
  - 时间轴视图：用时间轴展示 Span，比树形结构更直观，性能更好
  - 筛选和搜索：支持按名称、状态、耗时筛选 Span，快速定位问题节点

- **用专业的可观测性平台，不要自己造轮子**：
  - LangSmith / Langfuse 已经解决了存储、查询、可视化的性能问题
  - 它们有成熟的分层存储、采样、索引、预聚合机制
  - 自己搭建 trace 存储和查询系统，成本高、维护难、性能差
  - 除非有特殊需求（如完全自托管 + 定制化），否则优先用专业平台

- **成本监控本身也要可观测**：
  - 监控 trace 存储成本、查询性能、数据量增长趋势
  - 设置存储成本告警（如月成本超过预算）
  - 定期审查存储策略，根据实际使用情况调整（如发现很少查 30 天前的 trace，就缩短热数据保留期）

- **类比**：就像“监控录像存储”——
  - 全量永久保存所有监控录像（完整 trace）：成本极高，而且大部分录像没人看
  - 正确做法：
    - 最近 7 天的录像（热数据）：完整保存，存在高性能硬盘，随时可调取
    - 7-30 天的录像（温数据）：存在便宜的存储，调取稍慢
    - 30 天以上的普通录像：删除，只保留重要事件的录像（失败、事故、投诉）
    - 重要区域的录像（高价值用户、关键功能）：保存更久
  - 这样既保留了需要的录像，又控制了成本
  - 查询时：按时间、地点（用户/功能）、事件类型（失败/异常）索引，快速定位
  - Agent trace 存储也是一样，需要合理的分层存储、采样、索引策略，才能既可用又经济

---

## 七、进阶问题（引导往下挖）

### 问题 1：Agent 是非确定性的，同一个 bug 可能无法复现，如何用可观测性数据来“复现”和“调试”非确定性问题？

#### 引导思考
- **非确定性问题的挑战**：
  - 传统软件调试：复现 bug → 加断点 → 单步执行 → 定位根因 → 修复 → 验证
  - Agent 调试：bug 可能无法复现（相同输入，下次运行可能走不同的路径），断点和单步执行不适用
  - 这是 Agent 调试最大的挑战——“你看到的问题，下次可能看不到了”

- **用追踪数据“复现”非确定性问题的方法**：

  1. **Trace 回放（Trace Replay）**：
     - 保存问题发生时的完整 trace（包括所有 LLM 调用的输入输出、工具调用、检索结果）
     - 回放时，用 trace 中记录的 LLM 输出替代实际 LLM 调用（“冻结”LLM 的非确定性）
     - 这样可以精确复现当时的执行路径，调试工具调用、状态管理、流程控制等问题
     - LangSmith 和 Langfuse 都支持 trace 回放功能

  2. **确定性模式（Deterministic Mode）**：
     - 调试时，将 LLM 的 `temperature` 设为 0（最低随机性），并固定 `seed`
     - 这样相同输入会产生相同输出（大部分情况下），便于复现
     - 注意：temperature=0 不保证 100% 确定（模型服务端可能有其他随机性），但大幅提高复现率
     - 配合固定的工具 mock（不调用真实工具，用固定的工具返回），可以实现几乎完全确定的复现

  3. **问题 trace 转化为评估数据集**：
     - 将发现问题的 trace 保存为评估数据集的一个案例
     - 每次修改 Prompt/模型/代码后，在这个数据集上运行，验证问题是否修复
     - 即使问题无法在生产中复现，在评估数据集中可以稳定复现（因为输入固定）
     - 这是“生产到开发”工作流的核心——把生产问题转化为可复现的测试用例

  4. **多次运行统计分析**：
     - 非确定性问题不是“每次都发生”，而是“有一定概率发生”
     - 对相同输入运行多次（如 20 次），统计问题发生的概率
     - 分析发生问题的 trace 和没发生问题的 trace 的差异，找到触发条件
     - 例如：发现“当检索结果中包含某类文档时，Agent 更容易产生幻觉”——这就是触发条件

  5. **根因分析（Root Cause Analysis）**：
     - 用 AI 助手（如 LangSmith 的 Polly）自动分析大量 trace，找出问题的共同模式
     - 例如：“这 100 个失败 trace 中，有 80 个是因为搜索工具返回了空结果，Agent 不知道怎么处理”
     - AI 助手可以快速从大量 trace 中发现模式，比人工分析高效得多
     - 找到共同模式后，就可以针对性修复（如增加“搜索无结果时的处理逻辑”）

- **调试非确定性问题的工作流**：
  ```
  1. 发现问题（指标告警/用户反馈/评估发现）
       ↓
  2. 保存问题 trace（完整记录当时的执行路径）
       ↓
  3. 分析 trace（查看执行树，定位可能的问题步骤）
       ↓
  4. 转化为评估用例（将问题输入保存为评估数据集）
       ↓
  5. 复现验证（在开发环境多次运行，确认问题可复现）
       ↓
  6. 假设根因（基于 trace 分析，假设问题原因）
       ↓
  7. 修复（修改 Prompt/工具/代码/模型参数）
       ↓
  8. 验证（在评估数据集上运行，确认问题修复且无回归）
       ↓
  9. 部署（小流量 A/B 测试 → 全量部署）
       ↓
  10. 监控（持续监控指标和评估分数，确认问题不再发生）
  ```

- **关键心态转变**：
  - 传统调试：“我要复现这个 bug，然后一步步看哪里错了”
  - Agent 调试：“我要记录 bug 发生时的完整上下文，然后分析 trace 找到模式，用评估数据集验证修复”
  - 从“复现-调试”转变为“记录-分析-验证”
  - 追踪数据是 Agent 调试的“时间机器”——即使问题无法复现，trace 记录了当时发生的一切

- **类比**：就像“飞机事故调查”——
  - 飞机事故是非确定性的（相同的飞机、航线、天气，下次可能不会出事）
  - 事故调查不是“再飞一次看看会不会出事”（无法复现），而是“分析黑匣子记录的完整飞行数据”（trace 回放）
  - 黑匣子记录了飞行过程中的所有参数（高度、速度、引擎状态、飞行员操作），就像 trace 记录了 Agent 的所有步骤
  - 调查员通过分析黑匣子数据，找到事故的触发条件和根因（如“当引擎在特定高度遇到特定气流时，会发生失速”）
  - 然后修改飞行手册或飞机设计（修复），在模拟器中验证（评估数据集），最后投入使用（部署）
  - Agent 调试也是一样，trace 就是 Agent 的“黑匣子”，通过分析 trace 找到非确定性问题的根因

### 问题 2：可观测性工具（LangSmith/Langfuse）本身会增加延迟和成本，在生产环境中如何平衡“可观测性”和“性能/成本”？有没有“轻量级可观测性”的最佳实践？

#### 引导思考
- **可观测性的成本**：
  - 延迟成本：每个 Span 的创建、记录、导出会增加几毫秒到几十毫秒的延迟
  - 计算成本：trace 序列化、评估运行（LLM-as-a-Judge）需要额外的计算资源
  - 存储成本：trace 数据量大，存储成本高（特别是完整记录 LLM 输入输出）
  - 网络成本：trace 数据发送到可观测性平台需要网络带宽
  - 对于高吞吐量的 Agent 服务，这些成本可能不可忽视

- **平衡可观测性和性能/成本的策略**：

  1. **采样（Sampling）——最重要的成本控制手段**：
     - 头部采样（Head-based Sampling）：在 trace 开始时决定是否采样，如 10% 的请求记录完整 trace
     - 尾部采样（Tail-based Sampling）：在 trace 结束时决定是否保留，如只保留失败的、慢的、低质量的 trace
     - 尾部采样更智能——重要的 trace（失败、异常）100% 保留，普通 trace 采样保留
     - 推荐策略：失败/错误 trace 100% 保留，成功 trace 采样 10-20%，高价值用户 100% 保留

  2. **分层记录（Tiered Recording）**：
     - 完整 trace：记录所有 Span 的完整输入输出（用于调试，只对采样的请求）
     - 精简 trace：只记录 Span 名称、耗时、状态、token 用量，不记录输入输出（用于指标统计，对所有请求）
     - 指标-only：只记录聚合指标，不记录单个 trace（用于监控，对所有请求）
     - 大部分请求用“精简 trace”或“指标-only”，少部分（采样的、失败的）用“完整 trace”
     - 这样可以在控制成本的同时，保留调试所需的详细数据

  3. **异步导出（Async Export）**：
     - trace 数据不要同步发送到可观测性平台（会阻塞请求）
     - 先写入本地缓冲区（内存或磁盘队列），异步批量发送
     - 这样 trace 记录对请求延迟的影响降到最低（< 1ms）
     - OpenTelemetry SDK 默认就是异步导出的

  4. **批量评估（Batch Evaluation）**：
     - 在线评估（每个 trace 实时运行 LLM-as-a-Judge）成本高、延迟高
     - 改为批量评估：每小时/每天对采样的 trace 运行评估
     - 或者：只对高风险/高价值的 trace 运行在线评估，普通 trace 用轻量级规则检查
     - 评估成本可以降低 90% 以上

  5. **内容截断和压缩**：
     - LLM 输入输出超过一定长度后截断（如保留前 2000 + 后 500 字符）
     - 工具结果大时只保留摘要和前 N 条
     - trace 数据压缩后存储（如 gzip）
     - 可以减少 50-80% 的存储成本

  6. **智能评估触发**：
     - 不是所有 trace 都需要 LLM-as-a-Judge 评估
     - 只对“可疑”的 trace 运行评估：如用户点踩的、提前停止的、步数过多的、工具错误多的
     - 用轻量级规则先筛选，再用 LLM 深度评估
     - 可以大幅减少评估的 LLM 调用次数

- **轻量级可观测性的参考架构**：
  ```
  请求入口
      ↓
  ┌─────────────────────────────────────────┐
  │ 第 1 层：指标-only（所有请求，零额外延迟）│
  │ - 计数器：请求数、成功数、错误数          │
  │ - 直方图：延迟分布                         │
  │ - 仪表盘：token 用量、成本估算             │
  │ - 实现：内存计数器 + 定期上报 Prometheus   │
  │ - 延迟影响：< 0.1ms                        │
  └────────────────────┬────────────────────┘
                       ↓ 采样 20%
  ┌─────────────────────────────────────────┐
  │ 第 2 层：精简 trace（采样请求，低延迟）    │
  │ - Span 名称、耗时、状态、token 用量        │
  │ - 不记录输入输出（或只记录摘要）           │
  │ - 实现：OTel SDK + 异步批量导出            │
  │ - 延迟影响：< 1ms                          │
  └────────────────────┬────────────────────┘
                       ↓ 异常/失败/高价值 100%
  ┌─────────────────────────────────────────┐
  │ 第 3 层：完整 trace（重要请求，可接受延迟） │
  │ - 完整的输入输出、工具参数、检索文档        │
  │ - LLM 思考过程、完整执行树                 │
  │ - 实现：LangSmith/Langfuse 完整追踪        │
  │ - 延迟影响：5-20ms（异步导出，不阻塞请求）  │
  └────────────────────┬────────────────────┘
                       ↓ 可疑 trace
  ┌─────────────────────────────────────────┐
  │ 第 4 层：深度评估（可疑 trace，高成本）     │
  │ - LLM-as-a-Judge 质量评分                  │
  │ - 人工标注（注解队列）                      │
  │ - 根因分析（AI 助手）                      │
  │ - 实现：异步批量运行，不影响请求延迟        │
  │ - 成本：每次评估 $0.001-0.01               │
  └─────────────────────────────────────────┘
  ```

- **成本估算示例**：
  - 假设每天 100 万次 Agent 请求：
    - 指标-only：100 万次，成本几乎为 0（内存计数器）
    - 精简 trace：采样 20% = 20 万次，每次存储 ~1KB，每天 200MB，月成本 ~$10
    - 完整 trace：异常/失败 5% + 高价值 5% = 10 万次，每次存储 ~10KB，每天 1GB，月成本 ~$50
    - 深度评估：可疑 trace 1% = 1 万次，每次 $0.005，每天 $50，月成本 ~$1500
    - 总计：月成本 ~$1600，平均每次请求 $0.00005（可忽略）
  - 如果全量完整 trace + 全量在线评估：月成本可能 $50000+（是轻量级方案的 30 倍）
  - 轻量级可观测性可以在控制成本的同时，保留 90% 以上的调试能力

- **关键原则**：
  - **可观测性是投资，不是成本**：好的可观测性可以快速发现和修复问题，减少故障损失，长期来看是省钱的
  - **但要聪明地投资**：不是所有请求都需要完整 trace 和深度评估，按重要性分层投入
  - **延迟影响必须最小化**：trace 记录不能显著增加用户请求的延迟（目标 < 1% 延迟增加）
  - **异步是关键**：trace 导出、评估运行都应该异步，不阻塞用户请求
  - **定期审查**：监控可观测性本身的成本和延迟，定期优化采样率和存储策略

- **类比**：就像“城市监控系统”——
  - 全量高清录像 + 实时人脸识别（全量完整 trace + 在线评估）：成本极高，大部分录像没人看
  - 轻量级监控：
    - 所有路口都有计数器（车流量、事故数）——指标-only，零成本
    - 主要路口有低清晰度录像（精简 trace）——采样，低成本
    - 事故现场、重要场所高清录像（完整 trace）——100% 保留，用于调查
    - 可疑人员/车辆才人脸识别（深度评估）——只对可疑目标，高成本但有针对性
  - 这样既保证了“出事能查到”，又控制了成本
  - 城市不会因为“要安全”就在每个角落装高清摄像头 + 实时人脸识别——成本太高，而且大部分是浪费
  - Agent 可观测性也是一样，按重要性分层投入，聪明地平衡可观测性和成本

- 延伸：后续知识点（生产级 Agent 架构设计、评估与生产）会深入讲解生产级 Agent 的可观测性架构和成本优化

---

## 八、四关自测

### 复述关（3句话讲清）
1. Agent 可观测性的核心难题是“非确定性”——相同输入可能走出不同工具序列和回答，传统断点调试完全失效，必须靠追踪（Tracing）记录完整执行树，事后回放分析。
2. 三大支柱形成闭环：追踪记录“Agent 做了什么”（调试定位）、指标量化“整体表现如何”（成功率/延迟/成本/错误率）、评估回答“回答得好不好”（LLM-as-a-Judge+人工标注）。
3. 生产工具栈首选 LangSmith（LangChain 生态）或 Langfuse（开源自托管），标准是 OpenTelemetry；成本控制靠分层采样——失败 trace 100% 保留，成功 trace 采样 10-20%，避免全量记录拖垮成本。

### 举例关（真实场景）
用户投诉“Agent 昨天把我订单查错了”。你不能靠断点复现（今天问同样问题 Agent 可能走另一条路），而是去 Langfuse 找到那次会话的 trace：一看执行树就发现——第 2 步搜索工具返回了空结果，Agent 没有处理空结果、直接拿空数据进了下一步推理，导致最终编造了一个订单号。修复方法：在 Prompt 里加一条“搜索结果为空时换个关键词再试一次，不要编造”，然后把这个问题 trace 存成评估用例，以后每次改 Prompt 都跑一遍验证。

### 反例关（边界条件）
你给所有请求都开了完整 trace + 实时 LLM-as-a-Judge 评估，结果 trace 存储和 Judge 的 token 费用一个月 5 万刀，比 Agent 本身的推理成本还高 3 倍——这就是不分层的代价。正确做法是分层：所有请求只记录指标（成功率/延迟/token，零成本），20% 请求记精简 trace，失败/高价值请求 100% 记完整 trace，可疑 trace 才跑 LLM 评估。另一个坑是同步阻塞地发 trace——每个请求多等 50ms 才导出 trace，P99 延迟直接涨了 10%；trace 必须异步批量导出。

### 教学关（给小白讲）
普通软件像闹钟：你按同一个时间它每天同一个响法，不响了你拆开看齿轮在哪卡住就行。Agent 像一个调皮的实习生：你今天让他去查资料，他可能先搜网页再翻文档；明天同样的问题他可能直接翻文档——同样的活他每次干法都不一样，你想盯着他出错的那一刻抓现行根本抓不到。怎么办？给他胸前别个行车记录仪（Trace），把他每一步想了啥、调了啥工具、结果是啥全录下来。出了事你不用重放他干活（你也复现不出来），直接调录像看他当时卡在哪。同时办公室墙上挂个大仪表盘（Metrics）显示他今天成功率多少、花了多少钱、有没有超时；再有个老员工（LLM-as-a-Judge）抽查他的活干得好不好。

---

## 资料来源

- 官方文档: [Langfuse - AI Agent Observability, Tracing & Evaluation](https://langfuse.com/blog/2024-07-ai-agent-observability-with-langfuse)
- 技术博客: [LangChain - Debugging Deep Agents with LangSmith](https://www.langchain.com/blog/debugging-deep-agents-with-langsmith)
- 官方文档: [LangChain - AI Agent Observability: Tracing, Testing, and Improving](https://www.langchain.com/resources/agent-observability)
- 技术博客: [LangChain - End-to-End OpenTelemetry Support in LangSmith](https://blog.langchain.dev/end-to-end-opentelemetry-langsmith/)
- 官方文档: [Langfuse - Observability & Application Tracing](https://langfuse.com/docs/observability/overview)
- 官方文档: [Langfuse - Trace the OpenAI Agents SDK](https://langfuse.com/integrations/frameworks/openai-agents)
- 技术博客: [腾讯云 - 可观测性在Agent应用的挑战与实践](https://cloud.tencent.com.cn/developer/article/2597944)
- 技术博客: [Zylos AI - Agent Observability and Debugging](https://zylos.ai/research/2026-05-29-agent-observability-debugging/)
- 技术博客: [Maxim - Top 5 Leading Agent Observability Tools in 2025](https://www.getmaxim.ai/articles/top-5-leading-agent-observability-tools-in-2025/)
- 技术博客: [LangChain - LLM Observability Tools to Monitor & Eval Agents](https://www.langchain.com/articles/llm-observability-tools)
