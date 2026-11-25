## 一、结论前置

1. **Router（路由模式）是多智能体系统中最轻量的架构——一个“路由器 Agent”只做一件事：分类用户意图，然后把请求转发给对应的专业 Agent，选中的 Agent 端到端解决问题**。Router 不做任务分解、不做进度跟踪、不做结果汇总——它就是一个“分诊台”，把病人分到对应的科室，然后科室自己搞定。比 Supervisor 模式更轻量、更低延迟，但灵活性和协调能力也更弱。
2. **Router 模式的核心是“意图分类 + 路由转发”**。三种主流路由方式：①**基于规则**（关键词/正则匹配，最快最简单，但不够智能）；②**基于 LLM 分类**（让 LLM 分析输入并输出类别，最灵活，但多一次 LLM 调用）；③**基于语义/向量**（用 embedding 相似度匹配，快速路径，适合高并发场景）。生产环境通常用混合架构：语义路由处理简单明确的请求（快速路径），LLM 路由处理复杂模糊的请求（慢速路径）。
3. **Router vs Supervisor 的关键区别**：Router 是“一次性路由”——分类后把控制权完全交给专业 Agent，Agent 端到端解决，Router 不再介入；Supervisor 是“持续协调”——分解任务、分配、跟踪、验证、汇总，全程介入。Router 适合“任务类型明确、每个专业 Agent 能独立搞定”的场景（如客服分诊）；Supervisor 适合“任务复杂、需要多 Agent 协作、需要全局协调”的场景。

---

## 二、通俗类比 + 专业定义

### 通俗类比

#### Router 模式 = 医院的分诊台

- **分诊台护士（Router）**：
  - 不看病、不开药、不做检查
  - 只做一件事：问病人“你哪里不舒服？”
  - 根据回答分类：“发烧→呼吸科”、“骨折→骨科”、“肚子疼→消化科”
  - 把病人分到对应的科室，然后就不管了
  - 如果病人说“我也不知道哪里不舒服”，就分到“全科/急诊”（Fallback）

- **专科医生（专业 Agent）**：
  - 只看自己科室的病（呼吸科医生只看呼吸系统疾病）
  - 有自己的专业工具（听诊器、X光机、处方药）
  - 病人来了之后，从问诊到检查到开药，端到端搞定
  - 不需要每次都回分诊台请示

#### 为什么这种模式有效？
- 分诊台护士不需要懂所有医学知识，只需要能分类就行（轻量）
- 专科医生只专注一个领域，看病质量更高（专业分工）
- 病人不需要自己判断该挂哪个科（用户体验好）
- 分诊速度快，病人很快就能到对应科室（低延迟）

#### 对比 Supervisor 模式 = 餐厅主厨
- 主厨（Supervisor）持续协调：接单→分解→分配→跟踪→把关出菜，全程介入
- 分诊台护士（Router）一次性路由：问症状→分科→不管了，后续由科室自己搞定
- 餐厅需要主厨持续协调（因为一道菜需要多个厨师协作）
- 医院需要分诊台一次性路由（因为一个病人通常只需要一个科室）

### 专业定义

| 概念 | 定义 |
|------|------|
| **Router（路由 Agent）** | 多智能体系统中的轻量协调 Agent，唯一职责是对用户输入进行意图分类，然后将请求路由（转发）给对应的专业 Agent。Router 不执行具体任务，也不持续协调——选中的专业 Agent 端到端解决问题。 |
| **Router Pattern（路由模式）** | 一种多智能体架构模式，由一个 Router Agent 和多个专业 Agent 组成。Router 分类输入并路由到专业 Agent，专业 Agent 独立完成任务。也称为 Intent-Based Routing（基于意图的路由）、Triage（分诊）。 |
| **Intent Classification（意图分类）** | 将用户输入分类到预定义类别（如“订单查询”、“产品咨询”、“技术支持”、“闲聊”）的过程。是 Router 的核心能力。分类方式包括：基于规则、基于 LLM、基于语义/向量。 |
| **Specialized Agent（专业 Agent）** | 被 Router 管理的领域专用 Agent，每个 Agent 专注一个特定领域或任务类型，拥有该领域的专用工具、提示词和知识库。专业 Agent 被路由选中后，端到端完成任务，不需要 Router 持续协调。 |
| **Fallback（降级/兜底）** | 当 Router 无法明确分类用户意图（未知意图、模糊请求）时，将请求路由到一个通用 Agent 或默认处理流程的机制。Fallback 确保系统不会因为分类失败而崩溃。 |
| **Semantic Router（语义路由）** | 基于 embedding 相似度的路由方式：将用户输入向量化，与预定义类别的 embedding 比较，选择最相似的类别。速度快（不需要 LLM 调用），适合高并发场景，但对模糊输入的分类准确率较低。 |
| **LLM-based Routing（基于 LLM 的路由）** | 用 LLM 分析用户输入并输出分类结果的路由方式。灵活、准确（能理解复杂语义），但多一次 LLM 调用，延迟和成本较高。 |
| **Parallel Fan-out（并行扇出）** | Router 的一种扩展模式：当一个请求需要多个专业 Agent 同时处理时，Router 将请求同时路由给多个 Agent，然后汇总结果。LangGraph 中用 `Send` 实现。 |

---

## 三、底层机制

### 一、Router 模式的完整流程

```
用户请求
    ↓
┌─────────────────────────────────────────────┐
│  1. 意图分类（Router）                        │
│     - 分析用户输入的语义和上下文                │
│     - 分类到预定义类别（如：技术支持/产品咨询）  │
│     - 确定对应的专业 Agent                     │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  2. 路由转发（Router → Specialized Agent）    │
│     - 将用户请求和必要上下文传递给专业 Agent    │
│     - 控制权完全交给专业 Agent                  │
│     - Router 不再介入（一次性路由）             │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  3. 端到端执行（Specialized Agent）           │
│     - 专业 Agent 独立完成任务                  │
│     - 调用自己的专用工具                       │
│     - 可能有自己的内部循环（ReAct/Plan-Execute）│
│     - 产出最终结果                             │
└──────────────────┬──────────────────────────┘
                   ↓
              返回给用户
```

**关键点**：Router 是“一次性路由”，不是“持续协调”。选中的 Agent 端到端解决，Router 不再介入。

### 二、三种路由方式

#### 方式 1：基于规则（Rule-based）—— 最快最简单

```python
def rule_router(query: str) -> str:
    """基于关键词/正则的路由"""
    query_lower = query.lower()
    if any(word in query_lower for word in ["bug", "error", "crash", "不工作", "报错"]):
        return "tech_support"
    elif any(word in query_lower for word in ["价格", "多少钱", "套餐", "pricing", "cost"]):
        return "pricing"
    elif any(word in query_lower for word in ["你好", "hi", "hello", "在吗"]):
        return "greeting"
    else:
        return "general"  # Fallback
```

| 优点 | 缺点 |
|------|------|
| 极快（不需要 LLM 调用） | 不够智能（只能匹配关键词） |
| 零成本 | 维护困难（规则越来越多） |
| 可预测 | 无法理解语义（“我的页面白屏了”→没有“bug”关键词，可能分错） |
| 适合：简单明确的分类 | 不适合：复杂模糊的输入 |

#### 方式 2：基于 LLM 分类（LLM-based）—— 最灵活

```python
import os
from openai import OpenAI

# 用自己的 provider 跑通本示例（任何 OpenAI 兼容接口均可）：
#   export OPENAI_API_KEY=sk-xxx        # 你的 key
#   export OPENAI_BASE_URL=https://...  # 接口地址（用 openai 官方可省略）
#   export LLM_MODEL=doubao-pro-32k     # 模型名，按你的 provider 填
client = OpenAI()  # 自动读取 OPENAI_API_KEY / OPENAI_BASE_URL
MODEL = os.environ["LLM_MODEL"]

def llm_router(query: str) -> str:
    """用 LLM 分类用户意图"""
    prompt = f"""请分析以下用户查询的意图，只输出类别编号：
1. 技术支持（bug、报错、功能异常）
2. 价格咨询（价格、套餐、优惠）
3. 产品咨询（功能、使用方法、对比）
4. 闲聊（问候、无关话题）
5. 其他（无法分类）

用户查询：{query}
类别编号："""
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    result = resp.choices[0].message.content.strip()
    # 映射到 Agent
    mapping = {"1": "tech_support", "2": "pricing", "3": "product", "4": "greeting", "5": "general"}
    return mapping.get(result, "general")
```

| 优点 | 缺点 |
|------|------|
| 最灵活（能理解复杂语义） | 多一次 LLM 调用（延迟+成本） |
| 能处理模糊输入 | 分类可能不稳定（同样的输入可能分不同类） |
| 可以输出分类理由（可解释） | 需要设计好的分类 prompt |
| 适合：复杂模糊的输入 | 不适合：高并发、低延迟要求的场景 |

##### 进阶：结构化输出（Structured Output）
```python
# 用 JSON Schema 强制 LLM 输出结构化分类结果
class RouteDecision(BaseModel):
    category: Literal["tech_support", "pricing", "product", "greeting", "general"]
    confidence: float  # 0-1，分类置信度
    reason: str  # 分类理由
```
- 低置信度（<0.7）时走 Fallback 或人工审核
- `reason` 字段提供可解释性，方便调试

#### 方式 3：基于语义/向量（Semantic Router）—— 快速路径

```python
# 伪代码：语义路由
categories = {
    "tech_support": ["我的页面白屏了", "应用崩溃了", "功能不工作", "报错了"],
    "pricing": ["多少钱", "价格是多少", "有什么套餐", "优惠活动"],
    "product": ["怎么使用", "有什么功能", "和XX比怎么样"],
    "greeting": ["你好", "hi", "在吗"],
}

# 预计算每个类别的 embedding
category_embeddings = {cat: [embed(text) for text in examples] for cat, examples in categories.items()}

def semantic_router(query: str) -> str:
    """基于 embedding 相似度的路由"""
    query_emb = embed(query)
    best_cat = "general"
    best_score = 0
    for cat, embs in category_embeddings.items():
        # 计算查询与该类别所有示例的最大相似度
        max_sim = max(cosine_similarity(query_emb, e) for e in embs)
        if max_sim > best_score:
            best_score = max_sim
            best_cat = cat
    # 相似度低于阈值时走 Fallback
    if best_score < 0.7:
        return "general"
    return best_cat
```

| 优点 | 缺点 |
|------|------|
| 快（向量检索毫秒级） | 对模糊输入准确率低 |
| 零 LLM 成本 | 需要预计算和维护类别 embedding |
| 适合高并发 | 无法理解复杂语义和上下文 |
| 适合：简单明确、高并发的请求 | 不适合：复杂、模糊、需要上下文的请求 |

#### 混合架构（生产级最佳实践）

```
用户请求
    ↓
┌─────────────────────┐
│  语义路由（快速路径）  │  ← 简单明确的请求在这里搞定
│  embedding 相似度     │
└──────────┬──────────┘
           ↓ 相似度低（模糊/复杂）
┌─────────────────────┐
│  LLM 路由（慢速路径）  │  ← 复杂模糊的请求在这里处理
│  LLM 分类+置信度      │
└──────────┬──────────┘
           ↓ 置信度低（无法分类）
┌─────────────────────┐
│  Fallback（兜底）     │  ← 通用 Agent 或人工审核
│  通用 Agent / 人工    │
└─────────────────────┘
```

- 80% 的简单请求走语义路由（快速、低成本）
- 19% 的复杂请求走 LLM 路由（灵活、准确）
- 1% 的无法分类请求走 Fallback（兜底）
- 兼顾速度、成本和准确率

### 三、Router vs Supervisor 的关键区别

| 维度 | Router（路由模式） | Supervisor（主管模式） |
|------|------------------|---------------------|
| **介入程度** | 一次性路由，之后不介入 | 持续协调，全程介入 |
| **职责** | 只做意图分类和转发 | 分解、分配、跟踪、验证、汇总 |
| **控制权** | 路由后控制权交给专业 Agent | 控制权始终在 Supervisor |
| **专业 Agent** | 端到端独立解决 | 执行子任务，结果返回 Supervisor |
| **多 Agent 协作** | 通常不需要（一个 Agent 搞定） | 经常需要（多个 Agent 协作） |
| **结果汇总** | 不需要（Agent 直接返回用户） | 需要（Supervisor 汇总多个结果） |
| **架构复杂度** | 低 | 高 |
| **延迟** | 低（少一次汇总） | 中高（多轮协调） |
| **灵活性** | 低（任务类型必须明确） | 高（可以动态调整） |
| **适用场景** | 客服分诊、领域明确的任务 | 复杂任务、多 Agent 协作 |
| **类比** | 医院分诊台 | 餐厅主厨 |

#### 选择原则
- 如果任务可以明确分类，且每个专业 Agent 能独立搞定 → Router
- 如果任务复杂，需要多个 Agent 协作，需要全局协调 → Supervisor
- 很多系统是混合的：第一层 Router 分类，某些类别路由到 Supervisor（复杂类别），某些类别路由到专业 Agent（简单类别）

### 四、Router 的扩展模式

#### 扩展 1：并行扇出（Parallel Fan-out）

```
用户请求："对比 A 产品和 B 产品的优缺点"
    ↓
Router 判断需要两个专业 Agent 同时处理
    ↓
同时路由给：
  ├─ Product A Agent → 分析 A 的优缺点
  └─ Product B Agent → 分析 B 的优缺点
    ↓
汇总结果 → 对比分析
```

- 适用：一个请求需要多个独立领域的信息
- LangGraph 中用 `Send` 实现并行扇出
- 注意：需要汇总步骤（Router 或专门的汇总 Agent）

#### 扩展 2：分层路由（Hierarchical Router）

```
用户请求
    ↓
顶层 Router（大类分类）：技术问题 / 商务问题 / 其他
    ↓ 技术问题
中层 Router（细分分类）：前端 / 后端 / 数据库 / 移动端
    ↓ 前端
专业 Agent：前端工程师 Agent
```

- 适用：类别很多（>10 个），单层路由分类准确率下降
- 每层只需要区分少数几个类别，准确率更高
- 类比：医院先分诊到“内科/外科”，内科再分到“呼吸/消化/心血管”

#### 扩展 3：上下文感知路由（Context-Aware Routing）

```
# 不只是看当前输入，还看对话历史
当前输入："那怎么重置？"
对话历史：
  用户："我忘记密码了"
  Agent："您可以通过邮箱重置密码"
  用户："那怎么重置？"  ← 当前输入
    ↓
Router 结合上下文判断：这是"账号安全/密码重置"类别，不是"通用问题"
```

- 适用：多轮对话，当前输入可能是省略/指代
- Router 需要访问对话历史，结合上下文分类
- 实现：把最近 N 轮对话历史也传给分类器

---

## 四、最小可运行代码示例

### 最简 Router 模式（手写）

```python
from openai import OpenAI
# client/MODEL 沿用上节（env 三件套见上节说明）
client = OpenAI()

# 三个专业 Agent
def tech_support_agent(query: str) -> str:
    """技术支持 Agent"""
    prompt = f"你是技术支持专家。请解决以下技术问题：{query}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def pricing_agent(query: str) -> str:
    """价格咨询 Agent"""
    prompt = f"你是价格咨询专家。请回答以下价格相关问题：{query}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

def general_agent(query: str) -> str:
    """通用 Agent（Fallback）"""
    prompt = f"你是通用助手。请回答以下问题：{query}"
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content

# Router：LLM 分类 + 路由
def router(query: str) -> str:
    """Router Agent：分类意图，路由到专业 Agent"""
    print(f"[Router] 收到请求：{query}")

    # Step 1：意图分类（LLM）
    classify_prompt = f"""请分析以下用户查询的意图，只输出类别编号：
1. 技术支持（bug、报错、功能异常、使用问题）
2. 价格咨询（价格、套餐、优惠、购买）
3. 其他（无法分类）

用户查询：{query}
类别编号："""
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": classify_prompt}])
    category = resp.choices[0].message.content.strip()
    print(f"[Router] 分类结果：{category}")

    # Step 2：路由转发
    if category == "1":
        print("[Router] 路由到技术支持 Agent")
        return tech_support_agent(query)
    elif category == "2":
        print("[Router] 路由到价格咨询 Agent")
        return pricing_agent(query)
    else:
        print("[Router] 无法分类，路由到通用 Agent（Fallback）")
        return general_agent(query)

# 使用
result = router("我的应用打开就白屏了，怎么回事？")
print(f"\n最终回答：\n{result}")
```

### 混合路由（语义快速路径 + LLM 慢速路径）

```python
from openai import OpenAI
# client/MODEL 沿用上节（env 三件套见上节说明）
client = OpenAI()

# 预定义类别和关键词（简化版语义路由）
CATEGORIES = {
    "tech_support": {
        "keywords": ["bug", "error", "crash", "白屏", "报错", "崩溃", "不工作", "异常"],
        "agent": "tech_support_agent"
    },
    "pricing": {
        "keywords": ["价格", "多少钱", "套餐", "优惠", "pricing", "cost", "购买"],
        "agent": "pricing_agent"
    },
    "greeting": {
        "keywords": ["你好", "hi", "hello", "在吗", "嗨"],
        "agent": "greeting_agent"
    },
}

def semantic_router(query: str) -> str:
    """语义路由（快速路径）：基于关键词匹配"""
    query_lower = query.lower()
    for cat, info in CATEGORIES.items():
        for kw in info["keywords"]:
            if kw in query_lower:
                return cat, 0.9  # 匹配到关键词，高置信度
    return None, 0.0  # 未匹配

def llm_router(query: str) -> tuple:
    """LLM 路由（慢速路径）：返回 (类别, 置信度)"""
    prompt = f"""请分析以下用户查询的意图，输出 JSON 格式：
{{"category": "tech_support/pricing/greeting/general", "confidence": 0-1}}

tech_support: 技术问题、bug、报错、使用问题
pricing: 价格、套餐、优惠、购买
greeting: 问候、闲聊
general: 其他

用户查询：{query}"""
    resp = client.chat.completions.create(model=MODEL, messages=[{"role": "user", "content": prompt}])
    import json
    try:
        result = json.loads(resp.choices[0].message.content)
        return result["category"], result["confidence"]
    except:
        return "general", 0.5

def hybrid_router(query: str) -> str:
    """混合路由：语义快速路径 + LLM 慢速路径 + Fallback"""
    print(f"[Router] 收到请求：{query}")

    # Step 1：语义路由（快速路径）
    cat, conf = semantic_router(query)
    if cat and conf >= 0.7:
        print(f"[Router] 语义路由命中：{cat}（置信度 {conf}），快速路径")
        return AGENTS[cat](query)

    # Step 2：LLM 路由（慢速路径）
    print("[Router] 语义路由未命中，走 LLM 慢速路径")
    cat, conf = llm_router(query)
    print(f"[Router] LLM 分类：{cat}（置信度 {conf}）")

    if conf >= 0.6:
        return AGENTS[cat](query)

    # Step 3：Fallback（兜底）
    print("[Router] 置信度低，走通用 Agent（Fallback）")
    return general_agent(query)

# Agent 注册表
AGENTS = {
    "tech_support": tech_support_agent,
    "pricing": pricing_agent,
    "greeting": lambda q: "你好！有什么可以帮你的？",
    "general": general_agent,
}

# 使用
result = hybrid_router("你们的专业版多少钱？")
print(f"\n最终回答：\n{result}")
```

### 用 LangGraph 构建 Router（生产级）

```python
# ChatOpenAI 自动读取 OPENAI_API_KEY / OPENAI_BASE_URL（沿用上节 env 三件套）
import os
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from typing import TypedDict, Literal
from pydantic import BaseModel

class RouterState(TypedDict):
    messages: list
    category: str

llm = ChatOpenAI(model=os.environ["LLM_MODEL"])

# 结构化分类输出
class RouteDecision(BaseModel):
    category: Literal["tech_support", "pricing", "product", "general"]
    confidence: float

# 三个专业 Agent 节点
def tech_support_node(state):
    prompt = f"你是技术支持专家。请解决：{state['messages'][-1].content}"
    response = llm.invoke([HumanMessage(content=prompt)])
    return {"messages": [response]}

def pricing_node(state):
    prompt = f"你是价格咨询专家。请回答：{state['messages'][-1].content}"
    response = llm.invoke([HumanMessage(content=prompt)])
    return {"messages": [response]}

def general_node(state):
    prompt = f"你是通用助手。请回答：{state['messages'][-1].content}"
    response = llm.invoke([HumanMessage(content=prompt)])
    return {"messages": [response]}

# Router 节点：分类
def router_node(state):
    """Router 节点：用结构化输出分类"""
    structured_llm = llm.with_structured_output(RouteDecision)
    query = state["messages"][-1].content
    prompt = f"""请分析以下用户查询的意图：
tech_support: 技术问题、bug、报错
pricing: 价格、套餐、优惠
product: 产品功能、使用方法
general: 其他

用户查询：{query}"""
    result = structured_llm.invoke([HumanMessage(content=prompt)])
    return {"category": result.category}

# 路由逻辑：根据 category 路由到对应 Agent
def route_logic(state):
    return state["category"]

# 构建 Router 图
graph = StateGraph(RouterState)
graph.add_node("router", router_node)
graph.add_node("tech_support", tech_support_node)
graph.add_node("pricing", pricing_node)
graph.add_node("general", general_node)

graph.set_entry_point("router")

# 条件边：Router 根据 category 路由
graph.add_conditional_edges("router", route_logic, {
    "tech_support": "tech_support",
    "pricing": "pricing",
    "product": "general",  # product 暂时也走 general
    "general": "general",
})

# 每个专业 Agent 执行完后结束
graph.add_edge("tech_support", END)
graph.add_edge("pricing", END)
graph.add_edge("general", END)

app = graph.compile()

# 运行
result = app.invoke({"messages": [HumanMessage(content="我的应用白屏了")], "category": ""})
print(result["messages"][-1].content)
```

---

## 五、易混概念对比表

| 维度 | Router（路由模式） | Supervisor（主管模式） | Pipeline（流水线模式） |
|------|------------------|---------------------|---------------------|
| 介入程度 | 一次性路由 | 持续协调 | 顺序传递 |
| 核心职责 | 意图分类+转发 | 分解+分配+跟踪+汇总 | 按固定顺序传递 |
| 控制权 | 路由后交给专业 Agent | 始终在 Supervisor | 按流程传递 |
| 多 Agent 协作 | 通常不需要 | 经常需要 | 顺序协作 |
| 结果汇总 | 不需要 | 需要 | 最后一步输出 |
| 灵活性 | 低 | 高 | 最低 |
| 延迟 | 最低 | 中高 | 中 |
| 适用场景 | 任务类型明确 | 复杂任务 | 步骤固定 |
| 类比 | 医院分诊台 | 餐厅主厨 | 工厂流水线 |

| 路由方式 | 方法 | 速度 | 成本 | 准确率 | 适用场景 |
|---------|------|------|------|--------|---------|
| 基于规则 | 关键词/正则 | 极快 | 零 | 低 | 简单明确 |
| 基于 LLM | LLM 分类 | 慢 | 高 | 高 | 复杂模糊 |
| 基于语义 | embedding 相似度 | 快 | 低 | 中 | 高并发简单请求 |
| 混合架构 | 语义+LLM+Fallback | 快（多数走快速路径） | 中 | 高 | 生产级 |

| 维度 | 专业 Agent（Specialized） | 通用 Agent（General/Fallback） |
|------|-------------------------|---------------------------|
| 领域 | 专注一个领域 | 通用，什么都能答一点 |
| 工具 | 领域专用工具 | 通用工具 |
| 提示词 | 领域专家角色 | 通用助手角色 |
| 质量 | 高（专业深度） | 中（广度但不深） |
| 数量 | 多个（每个领域一个） | 1 个（兜底） |
| 触发 | Router 分类命中 | Router 无法分类时 |

| Router 模式优势 | 说明 |
|---------------|------|
| 轻量 | Router 只做分类，架构简单 |
| 低延迟 | 一次性路由，没有持续协调开销 |
| 专业分工 | 每个 Agent 专注一个领域，质量高 |
| 可扩展 | 新增领域只需加一个专业 Agent 和分类规则 |
| 易调试 | 问题定位到 Router 分类错误或某个 Agent 出错 |
| 用户体验 | 用户不需要自己判断该找哪个专家 |

| Router 模式挑战 | 说明 |
|---------------|------|
| 分类错误 | 分错类别就会找错 Agent，回答质量差 |
| 模糊输入 | 跨领域/模糊的请求难以分类 |
| 多领域请求 | 一个请求需要多个领域时，单一路由不够 |
| 类别维护 | 新增/修改类别需要更新分类器和 Agent |
| 无协调 | 选中的 Agent 独立工作，无法利用其他 Agent 的能力 |
| 冷启动 | 新类别没有足够的训练/示例，分类准确率低 |

---

## 六、3个实战中的常见坑

### 坑 1：Router 分类错误，把用户请求分给了错误的 Agent，结果“答非所问”

**现象**：用户问“你们的企业版有 SSO 功能吗？”，Router 分类为“价格咨询”（因为有“企业版”这个词），分给了价格 Agent。价格 Agent 回答了企业版的价格，但用户问的是功能（SSO），完全答非所问。用户体验极差。

#### 避坑
- **分类 prompt 要详细且有区分度**：不要只写“价格咨询：价格相关”，要写清楚边界——“价格咨询：询问具体价格、套餐费用、优惠活动、购买方式。注意：询问某个版本有什么功能属于产品咨询，不是价格咨询。”
- **用 few-shot 示例**：在分类 prompt 中给出几个容易混淆的示例，明确分类边界：
  - “企业版多少钱？”→价格咨询
  - “企业版有什么功能？”→产品咨询
  - “企业版支持 SSO 吗？”→产品咨询
- **用结构化输出+置信度**：让 LLM 输出分类和置信度，低置信度（<0.7）时走 Fallback（通用 Agent），而不是硬分给某个专业 Agent
- **定期审计分类错误**：记录每次分类结果和用户反馈（用户是否追问/纠正），发现分类错误的模式，优化分类 prompt 或类别定义
- **A/B 测试分类器**：对比不同分类 prompt/模型的准确率，选择最优的
- **给用户纠正机会**：如果 Agent 回答后用户说“不是这个意思”，Router 重新分类（结合用户纠正），路由到正确的 Agent
- **类别设计要互斥**：确保类别之间没有重叠（如“价格咨询”和“产品咨询”的边界要清晰），重叠的类别会导致分类不稳定

### 坑 2：Router 模式处理不了“跨领域”请求，一个问题涉及多个专业领域

**现象**：用户问“我想从免费版升级到企业版，需要多少钱？数据会迁移吗？”——这个问题同时涉及“价格”（升级费用）和“技术支持”（数据迁移）。Router 只能选一个类别，分给了价格 Agent，价格 Agent 回答了费用但没回答数据迁移，用户不满意。或者分给了技术 Agent，只回答了数据迁移没回答费用。

#### 避坑
- **识别跨领域请求，用并行扇出（Parallel Fan-out）**：Router 判断请求涉及多个领域时，同时路由给多个专业 Agent，然后汇总结果
  - 实现：LangGraph 用 `Send` 实现并行扇出；手写的话用 ThreadPoolExecutor 并行调用多个 Agent
- **或者用 Supervisor 模式处理复杂请求**：Router 先分类，如果是“简单/单领域”请求，路由给专业 Agent（Router 模式）；如果是“复杂/跨领域”请求，路由给 Supervisor（Supervisor 模式，分解任务、协调多个 Agent）
  - 这是混合架构：第一层 Router 分类，复杂类别走 Supervisor，简单类别走专业 Agent
- **或者设置“综合 Agent”**：对于常见的跨领域组合（如“价格+技术”），设置一个专门的“购买咨询 Agent”，它同时具备价格和技术知识
- **分类时允许输出多个类别**：让 LLM 输出“主要类别+次要类别”，如果有次要类别，也路由给对应的 Agent
- **用户体验层面**：如果 Agent 只回答了部分问题，主动问用户“您还想了解数据迁移的问题吗？我可以帮您转接技术专家”
- **类比**：就像医院——如果病人同时有心脏病和胃病，分诊台不会只分给一个科室，而是会安排多科会诊（并行扇出），或者转给全科医生（综合 Agent）

### 坑 3：新增专业 Agent 时，Router 的分类器没有同步更新，新 Agent 永远不会被调用

**现象**：团队新增了一个“安全咨询 Agent”，但忘记更新 Router 的分类 prompt 和类别定义。结果是即使用户问安全相关的问题，Router 也只会分到现有的类别（如“技术支持”或“通用”），新的安全 Agent 永远不会被调用——成了“僵尸 Agent”。

#### 避坑
- **类别定义和 Agent 注册放在同一个配置文件**：新增 Agent 时，必须同时在配置文件中添加类别定义、分类关键词、分类示例。配置文件驱动，避免遗漏
- **自动化测试**：每次新增 Agent 后，运行分类测试——用该领域的典型问题测试 Router 是否能正确分类到新 Agent。测试不通过则不能上线
- **Router 动态加载类别**：不要把类别硬编码在 prompt 中，而是从 Agent 注册表动态生成分类 prompt。新增 Agent 后自动出现在分类选项中
  ```python
  # 动态生成分类 prompt
  categories_desc = "\n".join([f"{i+1}. {agent.name}：{agent.description}" for i, agent in enumerate(agents)])
  classify_prompt = f"请分类到以下类别：\n{categories_desc}\n\n用户查询：{query}"
  ```
- **监控每个 Agent 的调用频率**：如果某个 Agent 长时间（如一周）没有被调用，告警——可能是分类器没有覆盖该类别，或者该 Agent 已经不需要了
- **定期审查类别覆盖度**：用历史用户请求测试分类器，发现有大量请求被分到“通用/Fallback”时，说明可能缺少对应的专业类别，需要新增
- **类别和 Agent 的生命周期管理**：新增/删除/修改 Agent 时，有明确的流程更新 Router 的分类器（如 PR 模板中包含“Router 分类器是否已更新”的检查项）

---

## 七、进阶问题（引导往下挖）

### 问题 1：Router 的分类准确率是整个系统的天花板——如何持续提升分类准确率？

#### 引导思考
- **分类准确率的重要性**：Router 分错了，后面的专业 Agent 再强也没用（答非所问）。分类准确率是整个系统的“天花板”——系统的最高表现不会超过分类准确率
- **提升方法 1：优化类别定义**
  - 类别之间要互斥（边界清晰），不要有重叠
  - 每个类别要有明确的“正例”和“反例”（什么属于这个类别，什么不属于）
  - 类别数量要适中（5-10 个最好），太多分类器会混淆，太少不够精细
  - 定期审查类别，合并相似的类别，拆分过大的类别
- **提升方法 2：优化分类 prompt**
  - 详细的类别描述（不只写名字，写清楚边界和例子）
  - Few-shot 示例（特别是容易混淆的例子）
  - 结构化输出（强制输出类别+置信度+理由）
  - 上下文感知（结合对话历史分类，不只看当前输入）
  - A/B 测试不同 prompt，选择准确率最高的
- **提升方法 3：用更好的分类模型**
  - 分类任务不需要最强的模型，但需要稳定的模型
  - 可以用专门微调的分类模型（比通用 LLM 更准、更快、更便宜）
  - 小模型（如 GPT-4o-mini）通常足够做分类，成本低速度快
  - 对于非常复杂的分类，可以用大模型（如 GPT-4o）
- **提升方法 4：混合路由架构**
  - 简单请求走语义路由（快、准）
  - 复杂请求走 LLM 路由（灵活、准）
  - 不确定的请求走 Fallback（兜底）
  - 持续优化快速路径和慢速路径的阈值
- **提升方法 5：持续学习和反馈闭环**
  - 记录每次分类结果和用户反馈（用户是否追问/纠正/满意）
  - 分类错误的案例加入“困难案例库”，用于优化 prompt 和 few-shot
  - 定期重新评估分类准确率，发现退化及时修复
  - 可以用 RL（强化学习）优化分类策略（根据用户反馈调整路由）
- **提升方法 6：人机协同**
  - 低置信度的分类请求人工审核（或让用户确认类别）
  - 人工审核的结果用于优化分类器
  - 高风险/高价值的请求（如涉及支付、法律）强制人工确认
- **类比**：就像医院分诊台的准确率提升——护士经验丰富了（优化 prompt）、引入了智能分诊系统（更好的模型）、简单症状快速分诊（语义路由）、复杂症状医生会诊（LLM 路由）、不确定的转急诊（Fallback）、持续学习疑难病例（反馈闭环）
- 延伸：后续知识点（Agent 评估指标、生产级 Agent 架构设计）会深入讲解如何评估和优化 Router 的分类准确率

### 问题 2：Router 模式和“模型路由（Model Routing）”是什么关系？未来会不会出现“自动选择最佳模型+最佳 Agent”的智能路由？

#### 引导思考
- **Router 模式（Agent 路由）**：根据用户意图，选择最合适的专业 Agent（每个 Agent 有自己的角色、工具、提示词，可能用不同的模型）
- **模型路由（Model Routing）**：根据请求的复杂度/类型，选择最合适的 LLM 模型（简单请求用小模型/便宜模型，复杂请求用大模型/强模型）
  - 代表：NVIDIA NeMo Switchyard、Microsoft Foundry model router
  - 目标：在保证质量的前提下，降低成本和延迟
- **两者的关系**：
  - **互补，不是互斥**：Agent 路由选择“哪个专业 Agent”，模型路由选择“用哪个 LLM 模型”。一个 Agent 内部也可以有模型路由（简单子任务用小模型，复杂子任务用大模型）
  - **可以组合**：第一层 Router 选择专业 Agent，每个 Agent 内部再做模型路由（根据子任务复杂度选择模型）
  - **目标一致**：都是为了在质量、成本、延迟之间找到最优平衡
- **未来趋势：智能路由（Intelligent Routing）**
  - 不只是路由到 Agent，而是同时选择“最佳 Agent + 最佳模型 + 最佳工具集 + 最佳提示词策略”
  - 路由决策基于：请求复杂度、领域、历史成功率、成本预算、延迟要求、用户偏好
  - 可能用 RL（强化学习）或学习型路由器，根据反馈持续优化路由策略
  - 可能出现“路由即服务”（Routing as a Service）：专门的智能路由层，根据请求动态组合最佳的 Agent/模型/工具
- **TCAndon-Router 的思路（arXiv 2026）**：
  - 把路由从“直接标签预测”改为“两阶段：先推理再选择”
  - Router 不只输出 Agent 标签，还输出自然语言推理链（分析用户查询的潜在原因、需要哪些能力）
  - 然后根据推理链选择 Agent 子集（可能选多个 Agent 协作）
  - 这是“智能路由”的早期探索
- **Multi-Agent System Routing（MASR）的形式化**：
  - 路由决策不只是“选哪个 Agent”，而是：
    1. 这个请求应该用单 Agent 还是多 Agent 工作流？
    2. 如果是多 Agent，需要哪些角色？
    3. 每个角色用哪个 LLM 模型？
  - 这是一个组合优化问题，当前系统用启发式方法近似求解
- **类比**：就像云计算的“智能负载均衡”——不只是把请求分到哪个服务器，而是根据请求类型（静态/动态/计算密集）、服务器负载、成本、延迟，自动选择最佳的服务器+实例类型+区域。未来的 Agent 路由也会这样，不只是选 Agent，而是自动组合最佳的 Agent+模型+工具+策略
- 延伸：后续知识点（生产级 Agent 架构设计、成本与性能权衡）会深入讲解如何设计智能路由系统和成本优化策略

---

## 八、四关自测

### 复述关（3句话讲清）
1. Router 模式是多智能体中最轻量的架构——一个路由 Agent 只做一件事：分类用户意图，然后把请求转发给对应的专业 Agent，选中的 Agent 端到端解决问题，Router 不再介入。
2. 三种主流路由方式：基于规则（关键词匹配，最快但不智能）、基于 LLM 分类（最灵活但多一次调用）、基于语义/向量（embedding 相似度，适合高并发）；生产环境常用混合架构（语义快速路径 + LLM 慢速路径 + Fallback 兜底）。
3. Router vs Supervisor 的关键区别：Router 是“一次性路由”（分类后交权），Supervisor 是“持续协调”（分解/分配/跟踪/汇总全程介入）；任务类型明确、每个 Agent 能独立搞定用 Router，任务复杂需多 Agent 协作用 Supervisor。

### 举例关（真实场景）
你做一个 SaaS 客服机器人：用户问“我的应用白屏了”→Router 用关键词命中“技术支持”，毫秒级路由给技术支持 Agent；用户问“专业版多少钱”→关键词命中“价格”，路由给价格 Agent；用户问“SSO 怎么配置”→关键词没命中，走 LLM 分类，路由给产品咨询 Agent；实在分不清的走通用 Agent 兜底。80% 的简单请求毫秒响应，只有 19% 走 LLM 慢速路径。

### 反例关（边界条件）
用户问“我想从免费版升级到企业版，要多少钱？我的历史数据会迁移吗？”——这同时涉及价格和技术支持，Router 只能选一个类别，结果价格 Agent 只回答了费用、技术 Agent 只回答了迁移，用户不满意。这种跨领域请求不能用单一路由，必须用并行扇出（同时路由给多个 Agent 汇总）或转给 Supervisor 模式。另外，新增了“安全咨询 Agent”却忘了更新 Router 的分类 prompt，新 Agent 永远不会被调用，成了“僵尸 Agent”。

### 教学关（给小白讲）
Router 模式就像医院的分诊台：护士不看病，只问你“哪里不舒服”，然后把你分到呼吸科、骨科或消化科，专科医生自己从头看到尾。好处是快（你不用自己猜该挂哪科）、省钱（护士不用懂所有病）；坏处是如果你同时有心脏病和胃病，分诊台一次只能把你分到一个科，得安排多科会诊。

---

## 资料来源

- 框架文档: [LangChain Docs — Router Pattern](https://docs.langchain.com/oss/python/langchain/multi-agent/router)
- 框架文档: [LangChain Docs — Multi-source Knowledge Base with Routing](https://docs.langchain.com/oss/python/langchain/multi-agent/router-knowledge-base)
- 论文: [arXiv:2504.10519 — Toward Super Agent System with Hybrid AI Routers](https://arxiv.org/html/2504.10519v2)
- 论文: [arXiv:2601.04544 — TCAndon-Router: Adaptive Reasoning Router](https://arxiv.org/pdf/2601.04544v1)
- 技术博客: [BCloud Consulting — Multi-Agent Orchestration with LangGraph](https://bcloud.consulting/blog/orquestacion-multi-agente-langgraph-casos-uso-reales-produccion/)
- 技术博客: [The Neural Base — Triage Agent Routes to Specialists](https://theneuralbase.com/agent-patterns/learn/intermediate/triage-agent-routes-to-specialists/)
- 技术博客: [BSWEN — AI Agent Routing: Intent Classification and Routing](https://docs.bswen.com/blog/2026-03-06-agent-routing/)
- 官方文档: [NVIDIA — Route AI Agent Workloads with NeMo Switchyard](https://developer.nvidia.com/blog/route-ai-agent-workloads-across-models-with-nvidia-nemo-switchyard/)
- 官方文档: [Microsoft Learn — Model Router with Foundry Agents](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/model-router-agents)

> 来源核验 2026-11-25：全部外链逐一联网核验可访问，论文标题按 arXiv 原文校准；存疑数字保留原文标注。技术结论与官方文档不一致时以官方为准。
