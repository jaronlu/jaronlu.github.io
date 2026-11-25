## 一、结论前置

1. **Pipeline（流水线模式）是多智能体系统中最简单的架构——多个 Agent 按预定义的线性顺序排列，前一个 Agent 的输出是后一个 Agent 的输入，像工厂流水线一样依次传递、逐步转换**。没有动态路由、没有并行、没有分支——Agent 1 跑完跑 Agent 2，Agent 2 跑完跑 Agent 3，一条直线走到底。也称为 Sequential Orchestration（顺序编排）、Prompt Chaining（提示词链）、Linear Delegation（线性委托）。
2. **Pipeline 模式的核心是“固定顺序 + 数据单向流动”**。每个 Agent 只专注一个环节（如“研究员只查资料、写手只写稿、编辑只审校”），拿到上一步的输出后做自己的转换，然后把结果传给下一步。顺序是预先定义好的，不会动态改变——这既是它的优点（简单、可预测、易调试），也是它的局限（不灵活、无法处理分支和并行）。
3. **Pipeline 适合“步骤明确、有严格先后依赖”的任务**，如：转录→摘要→行动项提取、原始数据→清洗→分析→报告、草稿→评审→润色、研究→实现→测试。如果任务需要动态决策（“根据情况选择不同路径”）、需要并行（“同时查多个数据源”）、需要循环（“反复修改直到满意”），就不适合纯 Pipeline，应该用 Supervisor、Router 或 LangGraph 等更灵活的架构。

---

## 二、通俗类比 + 专业定义

### 通俗类比

#### Pipeline 模式 = 工厂流水线

- **流水线工人（Agent）**：
  - 每个工人只做一个环节（第一个工人只装轮子，第二个只喷漆，第三个只质检）
  - 拿到上一个工人传过来的半成品，做自己的加工
  - 加工完后传给下一个工人
  - 不关心前后环节在做什么，只做好自己的事

- **流水线传送带（数据流）**：
  - 产品（数据）在传送带上从左到右流动
  - 每个工人在自己的工位对产品做加工
  - 产品经过所有工位后，变成最终成品

#### 为什么这种模式有效？
- 每个工人只专注一个环节，熟练度高、质量好（专业分工）
- 流程固定，可预测、易管理（确定性）
- 出问题容易定位（哪个工位出的错一目了然）
- 可以独立优化每个环节（改进某个工位的工艺，不影响其他工位）

#### 对比其他模式
- Pipeline = 工厂流水线（固定顺序，单向流动）
- Supervisor = 餐厅主厨（持续协调，动态分配）
- Router = 医院分诊台（一次性分类，端到端解决）

### 专业定义

| 概念 | 定义 |
|------|------|
| **Pipeline Pattern（流水线模式）** | 一种多智能体编排模式，多个 Agent 按预定义的线性顺序排列，前一个 Agent 的输出作为后一个 Agent 的输入，数据单向流动，逐步转换。也称为 Sequential Orchestration（顺序编排）、Prompt Chaining（提示词链）、Linear Delegation（线性委托）。 |
| **Stage（阶段/工位）** | Pipeline 中的一个处理步骤，通常对应一个 Agent。每个 Stage 有明确的输入格式、处理逻辑和输出格式。Stage 之间通过数据传递连接。 |
| **Data Flow（数据流）** | 数据在 Pipeline 中从左到右单向流动的过程。前一个 Stage 的输出是后一个 Stage 的输入。数据可以是原始文本、结构化数据、中间结果等。 |
| **Sequential Orchestration（顺序编排）** | Pipeline 模式的另一种称呼，强调 Agent 按顺序依次执行，每个 Agent 处理前一个 Agent 的输出。 |
| **Prompt Chaining（提示词链）** | Pipeline 模式在 LLM 应用中的具体实现，将多个提示词（Prompt）串联，前一个提示词的输出作为后一个提示词的输入，逐步完成复杂任务。 |
| **Handoff（交接）** | Pipeline 中前一个 Agent 将输出传递给后一个 Agent 的过程。良好的 Handoff 需要明确的输出格式和输入契约，确保数据在 Agent 之间无损传递。 |
| **Output Contract（输出契约）** | 每个 Agent 输出的格式规范（如 JSON Schema、字段定义）。明确的输出契约确保下游 Agent 能正确解析和使用上游的输出。 |

---

## 三、底层机制

### 一、Pipeline 模式的完整流程

```
输入
  ↓
┌──────────┐
│ Agent 1  │  阶段1：处理输入，产出中间结果1
│ (研究员)  │  例：搜索资料、整理信息
└────┬─────┘
     ↓ 中间结果1
┌──────────┐
│ Agent 2  │  阶段2：处理中间结果1，产出中间结果2
│ (写手)    │  例：根据资料写文章
└────┬─────┘
     ↓ 中间结果2
┌──────────┐
│ Agent 3  │  阶段3：处理中间结果2，产出最终结果
│ (编辑)    │  例：审校文章、修正错误
└────┬─────┘
     ↓
  最终输出
```

#### 关键特征
1. **固定顺序**：Agent 1 → Agent 2 → Agent 3，顺序预先定义，不会动态改变
2. **单向流动**：数据从左到右流动，不会回流（没有循环）
3. **输出即输入**：前一个 Agent 的输出是后一个 Agent 的输入
4. **无动态路由**：不需要决定“下一步该谁”，因为顺序是固定的
5. **无并行**：Agent 依次执行，不是同时执行

### 二、Pipeline 的三种节点类型

在实际的 Pipeline 中，不一定每个阶段都是 LLM Agent，通常混合三种节点：

| 节点类型 | 说明 | 示例 | 成本 |
|---------|------|------|------|
| **Model Node（模型节点）** | 调用 LLM 进行推理/生成 | 查询改写、内容生成、分类 | 高（LLM 调用） |
| **Deterministic Node（确定性节点）** | 不调用 LLM，执行确定性逻辑 | 向量检索、数据清洗、格式转换、API 调用 | 低（无 LLM 调用） |
| **Agent Node（智能体节点）** | 完整的 Agent，有自己的工具调用循环 | 研究 Agent（搜索+阅读+总结）、编码 Agent（写代码+测试+修复） | 最高（多次 LLM + 工具调用） |

#### 典型 Pipeline 示例（RAG 流水线）
```
用户查询
  ↓
[Model Node] 查询改写（LLM 优化查询，提升检索效果）
  ↓
[Deterministic Node] 向量检索（从知识库检索相关文档，无 LLM）
  ↓
[Agent Node] 答案生成（LLM 基于检索内容回答，可调用工具补充信息）
  ↓
最终答案
```

### 三、Pipeline 的数据传递方式

#### 方式 1：全量传递（最简单）

```python
# 前一个 Agent 的完整输出直接传给后一个 Agent
result1 = agent1.run(input)
result2 = agent2.run(result1)  # 直接传完整输出
result3 = agent3.run(result2)
```

- 优点：简单，不需要额外处理
- 缺点：如果前一个输出很长，后一个的上下文会被撑爆；可能包含后一个不需要的信息
- 适用：输出较短、每个 Agent 都需要完整上下文的场景

#### 方式 2：结构化传递（推荐）

```python
# 每个 Agent 输出结构化结果，下游只取需要的字段
class ResearchOutput(BaseModel):
    summary: str        # 200字摘要（下游需要）
    full_report: str    # 完整报告（下游可能不需要）
    sources: list[str]  # 来源列表

research_result = research_agent.run(query)
# 只把 summary 传给写手，不传 full_report（节省上下文）
article = writer_agent.run(research_result.summary)
```

- 优点：上下文精简，只传递必要信息；格式明确，不易出错
- 缺点：需要定义输出格式（JSON Schema）
- 适用：生产级系统，输出较长的场景

#### 方式 3：共享状态（LangGraph 风格）

```python
# 所有 Agent 读写一个共享的 State 对象
class PipelineState(TypedDict):
    query: str
    research_result: str
    article: str
    final_article: str

def research_node(state):
    result = research_agent.run(state["query"])
    return {"research_result": result}  # 写入共享状态

def writer_node(state):
    article = writer_agent.run(state["research_result"])  # 读取共享状态
    return {"article": article}
```

- 优点：灵活，每个 Agent 可以读写多个字段；支持复杂的数据流
- 缺点：需要管理状态，可能出现字段冲突
- 适用：复杂 Pipeline，需要多个中间结果的场景

### 四、Pipeline 的扩展：分支与并行

纯 Pipeline 是线性的，但实际应用中经常需要扩展：

#### 扩展 1：条件分支（Conditional Branch）

```
输入
  ↓
[分类器] 判断类型
  ↓
  ├─ 类型A → [Agent A 路径] → 汇总
  └─ 类型B → [Agent B 路径] → 汇总
```

- 根据中间结果选择不同的处理路径
- 实现：在 Pipeline 中插入条件判断节点（这已经接近 Router 模式了）
- 注意：一旦有了分支，就不再是“纯 Pipeline”了

#### 扩展 2：并行扇出与汇总（Map-Reduce）

```
输入
  ↓
[拆分] 分解为 N 个子任务
  ↓
并行执行：
  ├─ [Agent 1] → 结果1
  ├─ [Agent 2] → 结果2
  └─ [Agent 3] → 结果3
  ↓
[汇总] 合并所有结果
  ↓
最终输出
```

- 一个步骤拆分为多个并行子任务，然后汇总
- 适用：可并行的独立子任务（如同时查多个数据源）
- 注意：这也不再是“纯 Pipeline”，而是 Pipeline + 并行的混合

#### 扩展 3：循环（Loop）

```
输入
  ↓
[Agent] 生成草稿
  ↓
[评审] 检查质量
  ↓
  ├─ 合格 → 输出
  └─ 不合格 → [修改] → 回到评审（循环）
```

- 某个阶段反复执行直到满足条件
- 适用：需要反复优化的任务（如写代码→测试→修复，直到通过测试）
- 注意：纯 Pipeline 没有循环，需要用 LangGraph 等支持循环的框架

**重要提醒**：一旦 Pipeline 需要分支、并行或循环，就应该考虑用更灵活的架构（如 LangGraph、Supervisor），而不是强行用纯 Pipeline 实现。

### 五、Pipeline vs 其他模式

| 维度 | Pipeline（流水线） | Supervisor（主管） | Router（路由） |
|------|------------------|------------------|--------------|
| 顺序 | 固定线性顺序 | 动态决定 | 一次性路由 |
| 数据流 | 单向流动 | 集中汇总 | 端到端 |
| 动态决策 | 无 | 有（分解/分配/验证） | 有（分类） |
| 并行 | 无（纯 Pipeline） | 有（可并行分配） | 可选（并行扇出） |
| 循环 | 无（纯 Pipeline） | 有（可重试） | 无 |
| 复杂度 | 最低 | 最高 | 低 |
| 灵活性 | 最低 | 最高 | 中 |
| 适用场景 | 步骤固定的流程 | 复杂任务 | 任务分类明确 |
| 类比 | 工厂流水线 | 餐厅主厨 | 医院分诊台 |

---

## 四、最小可运行代码示例

### 最简 Pipeline（手写）

```python
import os
from openai import OpenAI

# 用自己的 provider 跑通本示例（任何 OpenAI 兼容接口均可）：
#   export OPENAI_API_KEY=sk-xxx        # 你的 key
#   export OPENAI_BASE_URL=https://...  # 接口地址（用 openai 官方可省略）
#   export LLM_MODEL=doubao-pro-32k     # 模型名，按你的 provider 填
client = OpenAI()  # 自动读取 OPENAI_API_KEY / OPENAI_BASE_URL
MODEL = os.environ["LLM_MODEL"]

# 三个专业 Agent（每个只做一个环节）
def researcher(query: str) -> str:
    """阶段1：研究员——搜索和整理信息"""
    prompt = f"你是一个研究员。请搜索并整理以下主题的关键信息（300字以内）：{query}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def writer(information: str) -> str:
    """阶段2：写手——根据信息写文章"""
    prompt = f"你是一个撰稿人。请根据以下信息写一篇 500 字的文章：\n{information}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def editor(article: str) -> str:
    """阶段3：编辑——审校文章"""
    prompt = f"你是一个编辑。请审校以下文章，修正错误并改进表达（保持500字左右）：\n{article}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

# Pipeline：按顺序执行
def run_pipeline(query: str) -> str:
    print(f"[Pipeline] 开始，输入：{query}")

    # 阶段1：研究
    print("[Pipeline] 阶段1/3：研究员工作中...")
    info = researcher(query)
    print(f"[Pipeline] 阶段1完成，输出长度：{len(info)} 字")

    # 阶段2：写作（前一个的输出是后一个的输入）
    print("[Pipeline] 阶段2/3：写手工作中...")
    article = writer(info)
    print(f"[Pipeline] 阶段2完成，输出长度：{len(article)} 字")

    # 阶段3：编辑
    print("[Pipeline] 阶段3/3：编辑工作中...")
    final = editor(article)
    print(f"[Pipeline] 阶段3完成，输出长度：{len(final)} 字")

    print("[Pipeline] 全部完成")
    return final

# 使用
result = run_pipeline("人工智能的发展历史和未来趋势")
print(f"\n最终文章：\n{result}")
```

### 通用 Pipeline 框架（可配置阶段）

```python
from openai import OpenAI
from typing import Callable, List
# client/MODEL 沿用上节（env 三件套见上节说明）
client = OpenAI()

class Pipeline:
    """通用 Pipeline 框架：可配置阶段、错误处理、日志"""

    def __init__(self, stages: List[Callable], name: str = "pipeline"):
        self.stages = stages  # 阶段列表，每个阶段是一个函数 (input) -> output
        self.name = name

    def run(self, input_data, verbose: bool = True) -> any:
        """按顺序执行所有阶段"""
        current = input_data
        for i, stage in enumerate(self.stages):
            if verbose:
                print(f"[{self.name}] 阶段 {i+1}/{len(self.stages)}: {stage.__name__}")

            try:
                current = stage(current)  # 前一个的输出是后一个的输入
            except Exception as e:
                print(f"[{self.name}] 阶段 {stage.__name__} 出错: {e}")
                raise  # Pipeline 中任何阶段出错，整个 Pipeline 失败

            if verbose:
                output_len = len(str(current)) if isinstance(current, str) else "N/A"
                print(f"[{self.name}] 阶段 {i+1} 完成，输出长度: {output_len}")

        return current

# 定义阶段
def stage_research(query: str) -> str:
    prompt = f"你是研究员。请整理以下主题的关键信息（300字）：{query}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def stage_write(info: str) -> str:
    prompt = f"你是撰稿人。请根据以下信息写一篇500字文章：\n{info}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def stage_edit(article: str) -> str:
    prompt = f"你是编辑。请审校以下文章：\n{article}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

# 构建并运行 Pipeline
pipeline = Pipeline(
    stages=[stage_research, stage_write, stage_edit],
    name="文章生成流水线"
)
result = pipeline.run("人工智能的发展历史")
print(f"\n最终结果：\n{result}")
```

### 用 LangChain LCEL 构建 Pipeline（声明式）

```python
# ChatOpenAI 自动读取 OPENAI_API_KEY / OPENAI_BASE_URL（沿用上节 env 三件套）
import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

# LCEL（LangChain Expression Language）：用 | 操作符串联
# prompt | model | parser 就像 Unix 管道：数据从左到右流动

# 阶段1：研究
research_prompt = ChatPromptTemplate.from_template(
    "你是研究员。请整理以下主题的关键信息（300字）：{topic}"
)
research_chain = research_prompt | ChatOpenAI(model=os.environ["LLM_MODEL"]) | StrOutputParser()

# 阶段2：写作（输入是阶段1的输出）
write_prompt = ChatPromptTemplate.from_template(
    "你是撰稿人。请根据以下信息写一篇500字文章：\n{info}"
)
write_chain = write_prompt | ChatOpenAI(model=os.environ["LLM_MODEL"]) | StrOutputParser()

# 阶段3：编辑
edit_prompt = ChatPromptTemplate.from_template(
    "你是编辑。请审校以下文章：\n{article}"
)
edit_chain = edit_prompt | ChatOpenAI(model=os.environ["LLM_MODEL"]) | StrOutputParser()

# 串联三个阶段为完整 Pipeline
# 注意：LCEL 中用字典传递中间结果
from langchain_core.runnables import RunnablePassthrough

full_pipeline = (
    # 阶段1：研究，输出到 info 字段
    {"info": research_chain, "topic": RunnablePassthrough()}
    # 阶段2：写作，输入 info，输出到 article 字段
    | {"article": write_chain, "info": lambda x: x["info"]}
    # 阶段3：编辑，输入 article，输出最终结果
    | edit_chain
)

# 运行
result = full_pipeline.invoke("人工智能的发展历史")
print(f"最终文章：\n{result}")
```

---

## 五、易混概念对比表

| 维度 | Pipeline（流水线） | Supervisor（主管） | Router（路由） |
|------|------------------|------------------|--------------|
| 顺序 | 固定线性 | 动态决定 | 一次性路由 |
| 数据流 | 单向流动 | 集中汇总 | 端到端 |
| 动态决策 | 无 | 有 | 有（分类） |
| 并行 | 无（纯） | 有 | 可选 |
| 循环 | 无（纯） | 有 | 无 |
| 复杂度 | 最低 | 最高 | 低 |
| 灵活性 | 最低 | 最高 | 中 |
| 调试难度 | 最低 | 中高 | 低 |
| 适用场景 | 步骤固定 | 复杂任务 | 分类明确 |
| 类比 | 工厂流水线 | 餐厅主厨 | 医院分诊台 |

| 节点类型 | 说明 | LLM 调用 | 成本 | 示例 |
|---------|------|---------|------|------|
| Model Node | 调用 LLM 推理/生成 | 是 | 高 | 查询改写、内容生成 |
| Deterministic Node | 确定性逻辑，无 LLM | 否 | 低 | 向量检索、数据清洗 |
| Agent Node | 完整 Agent，有工具循环 | 多次 | 最高 | 研究 Agent、编码 Agent |

| 数据传递方式 | 方法 | 优点 | 缺点 | 适用场景 |
|------------|------|------|------|---------|
| 全量传递 | 完整输出直接传 | 简单 | 上下文浪费 | 短输出 |
| 结构化传递 | 只传需要的字段 | 上下文精简 | 需定义格式 | 生产级 |
| 共享状态 | 读写 State 对象 | 灵活 | 状态管理复杂 | 复杂 Pipeline |

| Pipeline 模式优势 | 说明 |
|-----------------|------|
| 简单 | 架构最简单，容易理解和实现 |
| 可预测 | 顺序固定，行为可预测 |
| 易调试 | 问题定位到具体阶段 |
| 专业分工 | 每个 Agent 专注一个环节 |
| 独立优化 | 每个阶段可独立优化，不影响其他 |
| 低延迟（相对） | 没有协调开销，顺序执行 |

| Pipeline 模式挑战 | 说明 |
|-----------------|------|
| 不灵活 | 固定顺序，无法动态调整 |
| 无并行 | 依次执行，总延迟=各阶段之和 |
| 无循环 | 无法反复修改直到满意 |
| 错误传播 | 前一个阶段出错，后面全部受影响 |
| 上下文累积 | 中间结果可能很长，撑爆下游上下文 |
| 无法处理分支 | 不能根据情况选择不同路径 |

---

## 六、3个实战中的常见坑

### 坑 1：Pipeline 中某个阶段的输出格式不符合下游预期，导致下游解析失败或“答非所问”

**现象**：研究员 Agent 输出了一段自由文本（“根据我的研究，人工智能的发展经历了三个阶段...”），但写手 Agent 期望的是结构化的 JSON（`{"key_points": [...], "sources": [...]}`）。结果写手 Agent 无法正确解析研究结果，写出来的文章缺少关键信息，或者把研究结果的元数据（如“根据我的研究”）也写进了文章。

#### 避坑
- **定义明确的输出契约（Output Contract）**：每个 Agent 的输出格式用 JSON Schema 明确定义，下游 Agent 按照这个格式解析。用结构化输出（Structured Output）强制 LLM 输出符合 Schema 的结果
  ```python
  class ResearchOutput(BaseModel):
      key_points: list[str]  # 关键论点列表
      summary: str           # 200字摘要
      sources: list[str]     # 来源列表
  # 用 with_structured_output 强制输出格式
  structured_llm = llm.with_structured_output(ResearchOutput)
  ```
- **下游 Agent 的输入也要验证**：在 Pipeline 的每个交接点，验证输出是否符合预期格式。不符合则报错或重试，而不是把错误数据传给下游
- **用共享状态（State）管理中间结果**：每个 Agent 把结果写入 State 的对应字段，下游从 State 读取。字段名和类型明确，不容易传错
- **给每个 Agent 明确的输入说明**：在 Agent 的 system prompt 中说明“你将收到什么格式的输入”，而不是让 Agent 自己猜
- **端到端测试**：用真实输入跑完整 Pipeline，检查每个阶段的输出格式是否正确，最终结果是否符合预期
- **类比**：就像工厂流水线——每个工位的半成品必须符合标准尺寸和规格，下一个工位才能正确加工。如果上一个工位产出的零件尺寸不对，下一个工位就装不上。输出契约就是“零件的标准规格”

### 坑 2：Pipeline 的中间结果越来越长，下游 Agent 的上下文被撑爆，最终结果质量下降

**现象**：研究员输出了 2000 字的研究报告，写手基于这 2000 字写了 3000 字的文章，编辑拿到 3000 字的文章后，上下文已经快满了，审校时只关注了文章的后半部分，前半部分的错误没有被修正。或者更严重——上下文溢出，直接报错。

#### 避坑
- **每个阶段输出摘要，不是全文**：研究员输出 `summary`（200字）+ `full_report`（2000字），写手只读取 `summary`，`full_report` 存在共享存储中，需要深入时才读取。这样下游的上下文不会被撑爆
- **逐步压缩（Progressive Summarization）**：每经过一个阶段，就对中间结果进行压缩/摘要，只保留关键信息。Pipeline 越长，压缩越重要
- **限制每个阶段的输出长度**：在 Agent 的 prompt 中明确限制输出长度（如“输出不超过 500 字”），避免某个阶段输出过长
- **用长上下文模型做下游 Agent**：越靠后的 Agent 需要处理的中间结果越多，用长上下文模型（如 GPT-4o 128K、Claude 3.5 200K）
- **Pipeline 不要太长**：如果 Pipeline 超过 5-6 个阶段，考虑拆分为多个 Pipeline，或者用 Supervisor 模式（Supervisor 可以动态管理上下文，只把必要信息传给 Worker）
- **关键信息提取，不是全文传递**：下游 Agent 通常不需要上游的完整输出，只需要关键信息。在交接时提取关键信息（如“研究结论是 X，依据是 Y 和 Z”），而不是传递完整的研究过程
- **类比**：就像接力赛——每个跑手不需要携带所有前面跑手的物品，只需要携带接力棒（关键信息）。如果每个跑手都把自己的背包传给下一个，最后一个跑手会被压垮。中间结果就是“背包”，摘要就是“接力棒”

### 坑 3：强行用 Pipeline 处理需要动态决策/并行/循环的任务，导致架构僵硬、无法满足需求

**现象**：用户需要一个“智能客服”系统，能够根据用户问题类型（价格/技术/产品）选择不同的处理流程，复杂问题需要多个 Agent 协作，简单问题直接回答。团队强行用 Pipeline 实现：`[分类] → [价格处理] → [技术处理] → [产品处理] → [汇总]`。结果是：①每个用户问题都要走完所有阶段（即使是简单问题），延迟高；②无法根据分类跳过不需要的阶段；③复杂问题需要的并行处理无法实现。整个系统僵硬且低效。

#### 避坑
- **先分析任务特征，再选择架构**：
  - 步骤固定、有严格先后依赖 → Pipeline
  - 需要动态决策、多 Agent 协作 → Supervisor
  - 任务类型明确、每个类型能独立搞定 → Router
  - 需要循环（反复修改） → LangGraph（支持循环）
  - 需要并行 → Map-Reduce 或 Supervisor（并行分配）
- **不要“一把锤子敲所有钉子”**：Pipeline 是最简单的架构，但不是万能的。如果任务需要动态决策、并行、循环，就应该用更合适的架构，而不是强行用 Pipeline
- **混合架构**：很多实际系统是混合的——第一层用 Router 分类，简单类别走 Pipeline（固定流程），复杂类别走 Supervisor（动态协调）。根据任务特征选择最合适的子架构
- **用 LangGraph 替代纯 Pipeline**：LangGraph 支持线性流程（Pipeline）、条件分支、并行、循环，是更灵活的选择。如果不确定任务是否需要扩展，直接用 LangGraph，未来需要分支/并行/循环时可以轻松扩展
- **Pipeline 的适用边界要明确**：
  - ✅ 适合：转录→摘要→行动项、数据清洗→分析→报告、草稿→评审→润色
  - ❌ 不适合：需要根据情况选择不同路径（分支）、需要同时处理多个子任务（并行）、需要反复修改直到满意（循环）、需要动态分配任务（协调）
- **类比**：就像交通工具——Pipeline 是火车（固定轨道，单向行驶，不能随意变道）。如果你的目的地在轨道上，火车是最高效的；但如果需要去没有轨道的地方，就应该用汽车（Router/Supervisor/LangGraph）。不要因为火车简单就强行用火车去所有地方

---

## 七、进阶问题（引导往下挖）

### 问题 1：Pipeline 模式虽然简单，但“固定顺序”在实际应用中经常不够用——如何在保持 Pipeline 简单性的同时，增加灵活性？

#### 引导思考
- **Pipeline 的核心矛盾**：简单性（固定顺序）vs 灵活性（动态调整）。纯 Pipeline 最简单但最不灵活，纯 Supervisor 最灵活但最复杂。实际应用中需要在两者之间找到平衡
- **方法 1：Pipeline + 条件分支（有限灵活性）**
  - 在 Pipeline 的某个阶段插入条件判断，根据中间结果选择不同的子 Pipeline
  - 例如：`[分类] → 如果是简单问题 → [直接回答]；如果是复杂问题 → [研究→写作→编辑]`
  - 这是“Router + Pipeline”的混合：Router 选择走哪条 Pipeline，每条 Pipeline 内部是固定顺序
  - 优点：保持了 Pipeline 的简单性（每条路径都是固定顺序），又增加了灵活性（可以选择不同路径）
  - 实现：LangGraph 的 conditional_edges
- **方法 2：Pipeline + 并行扇出（局部并行）**
  - Pipeline 的某个阶段可以拆分为多个并行子任务，然后汇总
  - 例如：`[研究] → 同时查 [数据库A] [数据库B] [数据库C] → [汇总] → [写作] → [编辑]`
  - 这是“Map-Reduce + Pipeline”的混合：Pipeline 的某个阶段内部是 Map-Reduce
  - 优点：保持了整体的顺序性，又在局部增加了并行（加速）
  - 实现：LangGraph 的 Send（并行扇出）
- **方法 3：Pipeline + 循环（局部循环）**
  - Pipeline 的某个阶段可以反复执行直到满足条件
  - 例如：`[写代码] → [测试] → 如果不通过 → [修复] → 回到 [测试]；如果通过 → 继续`
  - 这是“Pipeline + 循环”的混合：Pipeline 的某个阶段内部有循环
  - 优点：保持了整体的顺序性，又在局部增加了迭代优化能力
  - 实现：LangGraph 的循环边
- **方法 4：可配置 Pipeline（参数化）**
  - Pipeline 的阶段和顺序可以通过配置动态调整，而不是硬编码
  - 例如：通过 YAML 配置文件定义 Pipeline 的阶段列表，运行时根据配置构建 Pipeline
  - 优点：不需要改代码就能调整 Pipeline，适合需要频繁调整流程的场景
  - 实现：Pipeline 框架的配置化设计
- **方法 5：直接用 LangGraph（最灵活）**
  - LangGraph 本质上是“有状态的图”，支持线性、分支、并行、循环、人机交互
  - 如果不确定未来是否需要扩展，直接用 LangGraph，从线性流程开始，需要时轻松扩展
  - 学习成本比纯 Pipeline 高，但比 Supervisor 低，是“灵活性和简单性的平衡点”
- **选择原则**：
  - 100% 确定任务是固定顺序 → 纯 Pipeline
  - 基本固定，但可能有少数分支 → Pipeline + 条件分支
  - 基本固定，但某些阶段可并行 → Pipeline + 并行扇出
  - 不确定未来需求 → 直接用 LangGraph
  - 需要大量动态协调 → Supervisor
- **类比**：就像乐高积木——纯 Pipeline 是“固定造型的乐高套装”（简单但不能改），LangGraph 是“自由拼搭的乐高积木”（可以拼任何造型，但需要自己设计）。如果你确定要拼的造型，固定套装最高效；如果不确定，自由积木更灵活。大多数实际应用介于两者之间——用自由积木（LangGraph）拼一个接近固定的造型，需要时可以调整
- 延伸：后续知识点（Agentic Workflow 编排、LangChain/LangGraph）会深入讲解如何用 LangGraph 构建灵活的工作流

### 问题 2：Pipeline 模式的“每个 Agent 只做一个环节”和“端到端 Agent”（一个 Agent 做所有事）相比，哪种更好？

#### 引导思考
- **Pipeline（多 Agent 分工）的优势**：
  - 专业分工：每个 Agent 专注一个环节，质量更高（“专家比通才强”）
  - 上下文精简：每个 Agent 只需要处理自己环节的信息，不会被其他环节的信息干扰
  - 可独立优化：某个环节质量差，可以单独优化该环节的 Agent（改 prompt、换模型、加工具），不影响其他环节
  - 可解释性：每个环节的输出可见，容易定位问题（“是研究环节没做好，还是写作环节没做好？”）
  - 可复用：某个环节的 Agent 可以在其他 Pipeline 中复用（如“研究员 Agent”可以用于文章生成、报告生成、问答等多个 Pipeline）
- **Pipeline（多 Agent 分工）的劣势**：
  - 信息损失：每个交接点可能丢失信息（前一个 Agent 的输出可能不包含后一个需要的所有信息）
  - 错误传播：前一个环节出错，后面全部受影响（“垃圾进，垃圾出”）
  - 延迟高：总延迟 = 各环节延迟之和（依次执行）
  - 协调成本：需要定义每个环节的输入输出格式、交接逻辑
  - 上下文割裂：每个 Agent 只有局部上下文，可能缺乏全局理解（如写手不知道研究的完整过程，只能基于摘要写作）
- **端到端 Agent（一个 Agent 做所有事）的优势**：
  - 全局理解：一个 Agent 拥有完整的上下文，理解任务的全局目标和所有细节
  - 无信息损失：不需要在 Agent 之间传递信息，不会因为交接而丢失信息
  - 延迟低：只需要一个 Agent 循环（虽然循环内部可能多轮，但没有多 Agent 协调开销）
  - 实现简单：只需要一个 Agent，不需要定义多 Agent 的交接逻辑
  - 灵活：Agent 可以动态决定先做什么后做什么，不需要固定顺序
- **端到端 Agent（一个 Agent 做所有事）的劣势**：
  - 上下文压力：一个 Agent 需要处理所有环节的信息，上下文容易被撑爆
  - 注意力分散：Agent 同时关注多个环节，可能每个环节都做得不够深入（“通才不如专家”）
  - 难调试：出问题不知道是哪个环节出的错（所有环节混在一起）
  - 难优化：想优化某个环节，可能会影响其他环节（改 prompt 牵一发而动全身）
  - 不可复用：整个 Agent 是为特定任务设计的，难以拆分为可复用的组件
- **实际选择**：
  - **简单任务（1-2 步就能完成）** → 端到端 Agent（Pipeline 的协调成本大于收益）
  - **中等复杂任务（3-5 步，步骤明确）** → Pipeline（专业分工的收益大于协调成本）
  - **复杂任务（需要动态决策、多 Agent 协作）** → Supervisor（Pipeline 的固定顺序不够用）
  - **超长任务（>5 步，或单步输出很长）** → 混合（Pipeline 的某些环节用端到端 Agent，或用 Supervisor 动态管理）
- **趋势：混合架构**
  - 不是非此即彼，而是“Pipeline 框架 + 端到端子 Agent”
  - Pipeline 的每个阶段内部是一个端到端 Agent（有自己的工具循环，能动态决定该阶段内的步骤）
  - 例如：`[研究 Agent（端到端：搜索→阅读→总结，自己决定搜几次、读几篇）] → [写作 Agent（端到端：写稿→自审→修改，自己决定改几次）] → [编辑 Agent（端到端：审校→修正，自己决定修正哪些）]`
  - 这样既保持了 Pipeline 的专业分工和顺序性，又让每个阶段内部有灵活性（端到端 Agent 可以动态决定该阶段内的具体步骤）
- **类比**：就像公司组织——
  - 纯 Pipeline = 每个员工只做一个动作（如“只拧螺丝”），高度专业化但缺乏灵活性
  - 端到端 Agent = 一个人做所有事（从设计到生产到销售），全局理解但不够专业
  - 混合架构 = 每个部门有明确的职责（Pipeline 的阶段），但部门内部的员工可以灵活决定如何完成部门的任务（端到端子 Agent）。这是现代公司的实际组织方式
- 延伸：后续知识点（Agentic Workflow 编排、生产级 Agent 架构设计）会深入讲解如何设计“Pipeline 框架 + 端到端子 Agent”的混合架构

---

## 八、四关自测

### 复述关（3句话讲清）
1. Pipeline 模式是多智能体中最简单的架构——多个 Agent 按预定义的线性顺序排列，前一个的输出是后一个的输入，像工厂流水线一样单向传递、逐步转换，没有动态路由、没有并行、没有分支。
2. 它的核心是“固定顺序 + 数据单向流动”，每个 Agent 只专注一个环节（研究员查资料、写手写稿、编辑审校），顺序预先定义不动态改变——这既是优点（简单、可预测、易调试）也是局限（不灵活、无法分支并行循环）。
3. Pipeline 适合“步骤明确、有严格先后依赖”的任务（如转录→摘要→行动项、草稿→评审→润色）；需要动态决策、并行、循环的任务应该用 Supervisor、Router 或 LangGraph，不要强行用纯 Pipeline。

### 举例关（真实场景）
你做一个“会议纪要生成系统”：会议录音 → ASR 转录 Agent 转成文字 → 摘要 Agent 提取核心内容 → 行动项提取 Agent 列出待办和负责人 → 格式化 Agent 输出最终纪要文档。四个 Agent 按固定顺序依次处理，每个环节只干自己的事，顺序永远不变——这就是典型的 Pipeline，简单可靠、出问题一眼能定位是哪个环节。

### 反例关（边界条件）
用户需要一个“智能客服”系统，能根据问题类型（价格/技术/产品）走不同处理流程，复杂问题还要多 Agent 协作——强行用 Pipeline 实现“分类→价格处理→技术处理→产品处理→汇总”，结果每个问题都要走完所有阶段（即使是简单问题），延迟高、还无法跳过不需要的阶段。另外，研究员输出 2000 字全文直接传给写手，写手又输出 3000 字传给编辑，下游上下文被撑爆，编辑审校时只看到后半部分——这是没做输出契约和逐步压缩的典型坑。

### 教学关（给小白讲）
Pipeline 模式就像工厂流水线：第一个工人只装轮子，第二个只喷漆，第三个只质检，半成品在传送带上从左到右一站一站加工，最后变成成品。好处是每个工人都熟练、出了问题一看就知道是哪个工位；坏处是流程固定得像铁轨，一旦需要“根据颜色喷漆不同工序”或“两辆车同时装”，就不是流水线能干的了，得换更灵活的调度方式。

---

## 资料来源

- 官方文档: [Microsoft Learn — AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/Azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- 框架文档: [AG2 Docs — Pipeline / Sequential Pattern](https://docs.ag2.ai/latest/docs/user-guide/advanced-concepts/pattern-cookbook/pipeline/)
- 框架文档: [LangChain Docs — Custom Workflow](https://docs.langchain.com/oss/python/langchain/multi-agent/custom-workflow)
- 技术博客: [AI Wiki — Agent Orchestration](https://aiwiki.ai/wiki/agent_orchestration)
- 技术博客: [AI Builder Club — Multi-Agent Orchestration Patterns](https://www.aibuilderclub.io/blog/ai-agents-101-part-4)
- 技术博客: [Sparkco — Mastering Pipeline Agent Patterns](https://sparkco.ai/blog/mastering-pipeline-agent-patterns-in-2025)
- 技术博客: [Tamas Piros — The Sequential Agent Pattern](https://tpiros.dev/blog/sequential-agent-pattern-gemini-quote-nerd/)
- 行业报告: [ExplainX — Multi-Agent Orchestration Patterns Guide 2026](https://explainx.ai/blog/multi-agent-orchestration-patterns-guide-2026)
- 技术博客: [Enrico Piovano — LLM Frameworks Comparison (LCEL pipe)](https://enricopiovano.com/blog/llm-frameworks-comparison/)
- 官方文档: [Microsoft Learn — Semantic Kernel Sequential Orchestration](https://learn.microsoft.com/en-my/training/modules/orchestrate-semantic-kernel-multi-agent-solution/5-use-sequential-orchestration)
