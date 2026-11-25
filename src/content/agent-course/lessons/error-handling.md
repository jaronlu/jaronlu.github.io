## 一、结论前置

1. **Agent 错误处理的第一原则是“不是所有错误都一样”——必须先分类，再决定处理策略**。可重试的是瞬时故障：连接失败、超时、408、409、429 限流、500/502/503/504，以及提供商过载码（Anthropic 的 529）。不可重试的是同一份请求再发一次仍会失败的错误：401、403、404、无效请求、上下文超限、内容过滤、额度耗尽。注意 400 不能一刀切：参数错误不重试，但有些提供商会把上下文超限也报成 400，要看错误类型而不是只看状态码。最危险的是“Agent 重试风暴”：一个不稳定工具触发整段推理循环重跑，成本飙升并可能死循环。正确做法是**只重试失败的那一次调用，绝不把整条链或整个推理循环重跑一遍**。
2. **生产级容错是分层的，不是三个固定数字**。①重试用带上限的指数退避加抖动，并且优先遵守 `Retry-After`。AWS 的 Full Jitter 是 `sleep = random(0, min(cap, base × 2^n))`；OpenAI / Anthropic 官方 SDK 用的是另一种：`0.5 × 2^n` 秒后再乘 `0.75–1.0` 的抖动，封顶 8 秒，默认再试 2 次。LangChain 模型调用默认最多 6 次，工具重试中间件默认再试 2 次、初始等待 1 秒、封顶 60 秒、抖动 ±25%。②断路器是三态状态机：Closed 计失败，Open 快速失败，冷却到时进入 Half-Open 放行少量探测。“连续 5 次、60 秒、失败后冷却翻倍”是常见工程选择，不是规范常量。③降级链是主方案失败后按优先级试备选：主模型 → 替代模型 → 缓存 → 明确的失败消息。
3. **工具失败要变成模型能读的观察，不要让整个 Agent 崩溃**。现行 LangChain 做法是用工具错误中间件把异常转成带同一个 `tool_call_id` 的 `ToolMessage`；`ToolRetryMiddleware` 耗尽重试后，默认 `on_failure=continue`，也是把错误交还给模型。这不是让模型自由发挥：框架仍要限制重试次数，并用步数上限兜底。LangGraph 用 `recursion_limit` 限制单次执行的 super-step，Python 从 1.0.6 起默认 1000，达到上限抛 `GraphRecursionError`；这不是“建议 15 步”这种业务约定。

---

## 二、通俗类比 + 专业定义

### 通俗类比

#### Agent 错误处理 = 餐厅的异常应对机制

- **不同的异常，不同的应对（错误分类）**：
  - **厨房临时忙不过来（瞬时错误/503）**：让顾客等一下，过几分钟再问（重试）
  - **食材用完了（限流/429）**：告诉顾客“这道菜今天卖完了，推荐类似的菜”（降级），不要反复问“还有没有”
  - **顾客点了菜单上没有的菜（请求错误/400）**：直接告诉顾客“没有这道菜”，不要反复去厨房问（不重试）
  - **顾客没买单就想进包间（认证错误/401）**：直接拒绝，不要重试（不重试）
  - **冰箱坏了（服务宕机）**：不要每 10 秒就去看冰箱修好没（断路器跳闸，等一段时间再探测）

- **指数退避 = 越来越久地问一次**：
  - 厨房忙，你等 1 分钟问一次（第 1 次重试）
  - 还忙，等 2 分钟再问（第 2 次）
  - 还忙，等 4 分钟再问（第 3 次）
  - 还忙，等 8 分钟再问（第 4 次）
  - 不要每 10 秒就冲进去问一次——那样只会让厨房更忙（惊群效应）

- **抖动 = 不要大家同时问**：
  - 如果 10 个服务员都在等厨房，不要同时去问（会挤爆厨房）
  - 每个人等的时间加一点随机偏差（你等 1 分 03 秒，我等 1 分 27 秒，他等 58 秒）
  - 这样大家错开时间问，厨房压力小

- **断路器 = 冰箱坏了就别老开冰箱门**：
  - 冰箱坏了（服务宕机），连续发现 5 次都不制冷（5 次失败）
  - 然后“跳闸”——接下来 1 小时不要开冰箱门（快速失败，不请求服务）
  - 1 小时后，试探性地开一次门（Half-Open 探测）
  - 如果制冷了（探测成功），恢复正常使用（Close）
  - 如果还没制冷（探测失败），继续跳闸，下次再等更久；等待时间要有上限，不能无限翻倍

- **降级链 = 主菜卖完了还有备选**：
  - 顾客点了招牌牛排（主模型）
  - 卖完了（失败）→ 推荐类似的猪排（便宜模型）
  - 猪排也卖完了 → 推荐今天的特价菜（缓存响应）
  - 都卖完了 → 送一份免费面包并道歉（优雅错误消息）
  - 不要直接说“今天什么都没有，你走吧”（粗暴失败）

- **工具错误返回给 LLM = 服务员把厨房的问题告诉顾客，让顾客决定**：
  - 顾客点了鱼，服务员去厨房，发现鱼不新鲜了（工具调用失败）
  - 服务员不是直接崩溃（抛异常），而是回来告诉顾客：“今天的鱼不太新鲜，您看是换一道菜，还是明天再来？”（返回结构化错误）
  - 顾客（LLM）自己决定：换菜（换工具）、明天再来（告知用户）、或者坚持要鱼（重试）
  - 这就是“错误作为信息”——让决策者（LLM）知道发生了什么，自己决定怎么办

### 专业定义

| 概念 | 定义 |
|------|------|
| **Error Classification（错误分类）** | 将错误分为可重试错误、不可重试错误和特殊错误，分别采用不同处理策略的方法。是错误处理的第一步——不是所有错误都应该重试。 |
| **Retryable Error（可重试错误）** | 同一请求稍后再发可能成功的瞬时错误。官方 SDK 自动重试连接失败、超时、408、409、429，以及 500 及以上；Anthropic 另有 529 Overloaded。LangChain 标成可重试的是限流、服务端失败、连接失败和超时。 |
| **Non-Retryable Error（不可重试错误）** | 不改请求就再发一次仍会失败的错误。包括 401、403、404、无效请求、上下文超限、内容过滤和额度耗尽。400 只是常见外壳，要看错误类型；上下文超限在 LangChain 里是独立的 `ContextOverflowError`，不可重试。 |
| **Exponential Backoff（指数退避）** | 失败后等待时间随尝试次数按指数增长，并设上限。AWS 文章用 `base × 2^attempt` 再封顶；OpenAI / Anthropic SDK 用 `0.5 × 2^n`，封顶 8 秒。给下游恢复时间，避免立刻重试把故障放大。 |
| **Jitter（抖动）** | 给退避时间加随机量，避免多个客户端算出同一个时刻一起重试（惊群）。Full Jitter 是在 0 到封顶退避之间均匀取值；官方 SDK 是把算出的等待乘以 0.75–1.0；LangChain 工具重试是 ±25%。三种都叫抖动，公式不同。 |
| **Circuit Breaker（断路器）** | 防止级联失败的代理状态机。Closed 放行并统计近期失败；一段时间内失败超过阈值就进入 Open，请求立即失败并启动冷却计时；计时结束后进入 Half-Open，只放行少量探测。探测成功则回到 Closed 并清零计数，失败则回到 Open 并重新计时。阈值、冷却时长和探测数量是实现参数，不是固定的 5 次、60 秒或“只放 1 个”。 |
| **Fallback Chain（降级链）** | 按优先级排列的备选方案链，主方案失败后依次尝试备选方案。典型的 Agent 降级链：主模型 → 便宜模型 → 缓存响应 → 优雅错误消息。确保系统在部分服务不可用时仍能提供基本功能。 |
| **Graceful Degradation（优雅降级）** | 系统在部分功能不可用时，不是完全失败，而是降低功能级别继续提供服务的能力。例如：主模型不可用时用便宜模型（回答质量降低但仍可用），搜索不可用时用缓存结果（可能不是最新但仍有答案）。 |
| **Tool Error as Observation（工具错误作为观察）** | Agent 特有的错误处理模式——工具调用失败时，不抛异常终止 Agent，而是将错误信息作为结构化的工具结果（Observation）返回给 LLM，让 LLM 决定下一步（重试、换工具、告知用户）。是 ReAct 循环的一部分。 |
| **Agent Retry Storm（Agent 重试风暴）** | Agent 特有的故障模式——一个不稳定的工具触发 Agent 反复重试整个推理循环（而不只是重试工具调用），导致 Token 成本飙升、死循环、服务被压垮。正确做法是只重试工具调用，绝不重试整个 LLM 推理循环。 |
| **Dead-Letter Queue（死信队列）** | 多次重试仍然失败的任务被放入的队列，后续由人工处理或延迟重试。防止失败任务阻塞主流程，同时保留失败任务供后续分析和处理。 |
| **Max Steps Limit（最大步数限制）** | 给一次 Agent 执行设置的步数上限，防止循环不收敛。LangGraph 的对应机制是 `recursion_limit`：限制单次执行的 super-step 数，超限抛 `GraphRecursionError`。Python 从 1.0.6 起默认 1000，运行时可通过 config 改小；业务上的 15 步只是应用自己的约定。 |
| **Repetition Detection（重复动作检测）** | 监控 Agent 执行行为，检测连续多步调用相同工具且参数相似的情况。检测到后强制退出或切换策略，防止无意义的重复循环。 |

---

## 三、底层机制

### 一、错误分类与处理策略矩阵

**不是所有错误都一样——先分类，再决定怎么处理。**

| 错误类型 | HTTP 状态码/信号 | 可重试？ | 处理策略 | 原因 |
|---------|----------------|---------|---------|------|
| **限流** | 429，常带 `Retry-After` | ✅ 是 | 有 `Retry-After` 就按它等，但要设上限；没有再退避。也可切到另一个提供商 | 暂时过载，等待后可能恢复 |
| **请求超时** | 408 | ✅ 是 | 官方 SDK 会重试。请求若非幂等，先确认有幂等键或能查出上次是否已生效 | 服务端没在时限内收完请求，重复发送可能成功 |
| **冲突 / 锁超时** | 409 | ✅ SDK 会重试 | 官方 SDK 把 409 当可重试。业务冲突要看响应体，不能只因为状态码就盲重试写操作 | OpenAI / Anthropic SDK 把 409 标成 lock timeout 并重试 |
| **服务器错误** | 500 及以上，含 502/503/504 | ✅ 是 | 退避重试有限次，然后降级。501 表示未实现，重试通常无意义 | SDK 对 `status >= 500` 一律重试；501 是这个规则里的例外，要单独识别 |
| **提供商过载** | Anthropic 529 | ✅ 是 | 与 503 一样退避，不要当成客户端错误 | Anthropic SDK 单独定义了 `OverloadedError` |
| **客户端超时 / 断连** | 无 HTTP 响应 | ✅ 是 | 退避重试。超时不等于对端没执行，写操作必须能去重 | 请求可能没发出去，也可能已经执行但响应丢了 |
| **无效请求** | 多为 400 / 422 | ❌ 否 | 改参数或改输入，不要原样重发 | 同一请求再发仍会被拒绝 |
| **认证错误** | 401 | ❌ 否 | 刷新或更换凭证后再发新请求，不要拿失效凭证重试 | 凭证无效，重试不会自己变有效 |
| **权限错误** | 403 | ❌ 否 | 停下来查权限 | 权限不足不会因为多试几次出现 |
| **不存在** | 404 | ❌ 否 | 核对模型名、路径或资源标识 | 资源不存在，重试不会让它出现 |
| **上下文超限** | 常为 400，类型是 context overflow | ❌ 否 | 截断、压缩或换更大窗口，再发**改过的**请求 | 输入没变短，原请求不会成功 |
| **内容过滤** | 提供商策略拒绝，或结束原因为 content filter | ❌ 否 | 改输入或告知用户，不要重试同一内容 | 违规内容重发仍会被拦 |

#### 关键原则
- **按错误类型分类，不按“4xx 一律不试、5xx 一律再试”**：408、409、429 都是 4xx，官方 SDK 却会重试；501 是 5xx，但表示未实现，重试通常没用
- **429 先读 `Retry-After`**：服务已经告诉你等多久。OpenAI SDK 只接受不超过 120 秒的值，更长就不再重试；Anthropic SDK 会遵守该头，但睡眠最长约 4294967 秒，应用层仍应自己封顶
- **服务端还可以用非标准头 `x-should-retry` 覆盖判断**：值为 `true` / `false` 时，OpenAI 和 Anthropic SDK 都服从它
- **上下文超限和认证失败都不重试原请求**：前者先缩短输入，后者先换凭证，再发的是新请求

### 二、指数退避+抖动（重试的标准实现）

#### 为什么需要指数退避？
- 服务过载时，频繁重试会让服务更过载（恶性循环）
- 等待时间越来越长，给服务恢复的机会
- 第 1 次等 1 秒，第 2 次等 2 秒，第 3 次等 4 秒，第 4 次等 8 秒...

#### 为什么需要抖动？
- 没有抖动：一批客户端同时失败，算出同一串等待时间（1s、2s、4s……），到点一起重试，故障被放大
- 有抖动：每条重试的等待时间错开，下游看到的是平滑流量，而不是一波一波的尖峰

#### 三种现行公式，不要混成一个“标准”

| 来源 | 等待时间 | 默认次数 | 适用 |
|------|---------|---------|------|
| AWS Full Jitter | `random(0, min(cap, base × 2^attempt))` | 文章不规定次数 | 自己实现通用退避时的经典算法 |
| OpenAI / Anthropic Python SDK | `min(0.5 × 2^n, 8) × random(0.75, 1.0)`；有 `Retry-After` 时优先用它 | 默认再试 2 次（`DEFAULT_MAX_RETRIES = 2`） | 调这两家 API 时，SDK 已经做了 |
| LangChain 工具重试中间件 | `initial_delay × backoff_factor^retry_number`，再加 ±25% 抖动，封顶 `max_delay` | `max_retries=2` 表示初次之外再试 2 次；默认 `initial_delay=1`、`backoff_factor=2`、`max_delay=60` | Agent 工具调用 |

LangChain 模型调用另有一层：`init_chat_model(..., max_retries=6)` 是默认值，自动重试网络错误、429 和 5xx，不重试 401、404 这类客户端错误。模型重试中间件包住调用后，这个参数不再作用于被包住的调用。

#### Full Jitter 的最小实现
```python
import random
import time

def retry_full_jitter(func, max_attempts: int = 3, base: float = 0.5, cap: float = 8.0):
    """AWS Full Jitter。max_attempts 含第一次调用，不是“额外重试次数”。"""
    for attempt in range(max_attempts):
        try:
            return func()
        except (TimeoutError, ConnectionError):
            if attempt == max_attempts - 1:
                raise
            # attempt 从 0 起：0.5、1、2、4……再封顶，然后在 0 到该值之间取值
            ceiling = min(cap, base * (2 ** attempt))
            time.sleep(random.uniform(0, ceiling))
```

#### 最佳实践
- 调 OpenAI / Anthropic 时，不要在 SDK 外面再套一层相同的重试，否则 2 次会变成 2×N 次
- 有 `Retry-After` 就用它，并设应用层上限。OpenAI SDK 超过 120 秒就放弃重试；自己实现时也应拒绝过大的值
- 429 不是“永远不退避”。没有 `Retry-After` 时，SDK 会退回指数退避
- 自动重试只用于幂等请求。RFC 9110 规定客户端不应自动重试非幂等方法，除非请求本身幂等，或能检测上次是否已生效。发邮件、扣款、下单要有幂等键；官方 SDK 对非 GET 会生成并在重试间复用 idempotency key，但业务去重仍要服务端认这个键

### 三、断路器（Circuit Breaker）

#### 为什么需要断路器？
- 服务宕机时，如果每个请求都去尝试调用（超时等待），会：
  - 浪费资源（每个请求都等超时）
  - 拖慢整个系统（请求堆积）
  - 可能让服务恢复更慢（持续施压）
- 断路器在服务宕机时“跳闸”，请求快速失败（不调用服务），给服务恢复的时间

#### 三种状态
```
┌─────────────┐   时间窗内失败超阈值   ┌─────────────┐
│   Closed    │ ──────────────────→ │    Open     │
│  请求通过    │                     │  立即失败    │
│  统计近期失败 │                     │  不调用下游  │
└─────────────┘                     └──────┬──────┘
       ↑                                    │
       │  探测成功，计数清零                  │  冷却计时结束
       │                                    ↓
       │                             ┌─────────────┐
       └──────────────────────────── │  Half-Open  │
              任一探测失败则回 Open    │  少量请求通过 │
                                     └─────────────┘
```

#### 状态转换规则
| 状态 | 行为 | 转换条件 |
|------|------|---------|
| Closed（关闭） | 请求通过，统计近期失败 | 给定时间窗内失败超过阈值 → Open，并启动冷却计时 |
| Open（打开） | 请求立即失败，不调用下游 | 计时结束 → Half-Open |
| Half-Open（半开） | 只放行有限数量的探测 | 探测成功 → Closed，失败计数清零；任一探测失败 → Open，重新计时 |

可运行实现见下一节。每个依赖一个实例；阈值和冷却时间是示例，不是规范值。Half-Open 必须占住探测名额，否则并发请求会同时打进正在恢复的下游。

#### 最佳实践
- 每个外部依赖一个断路器。阈值和冷却时间按该依赖的超时、流量来定，没有“模型 5 次、工具 3 次”的标准值
- Azure 架构文档要求统计的是一段时间内的近期失败，不是无限累计的历史失败；成功后应衰减或清零
- Half-Open 放行的是有限数量，不是规范里写死的 1 个。数量要小，避免正在恢复的服务被打满
- 冷却时间若采用翻倍，必须设上限，否则会一直打不开
- 断路器打开后走降级链，而不是把快速失败直接抛给用户

### 四、降级链（Fallback Chain）

#### 为什么需要降级链？
- 生产环境中，任何服务都可能失败
- 如果主服务失败就直接报错，用户体验很差
- 降级链确保“即使主服务挂了，系统仍能提供基本功能”

#### 典型的 Agent 降级链
```
用户请求
    ↓
[第1层] 主模型（当前任务选定的主力模型）
    ↓ 失败（超时/限流/断路器打开）
[第2层] 替代模型（另一家提供商，或同家更小的模型）
    ↓ 失败
[第3层] 缓存响应（语义缓存命中相似查询的历史结果）
    ↓ 未命中
[第4层] 优雅错误消息（"服务暂时不可用，请稍后重试"）
```

#### 不同错误类型的降级策略
| 错误类型 | 重试主模型？ | 降级策略 |
|---------|------------|---------|
| 瞬时错误（5xx/超时） | ✅ 按 SDK 或中间件的有限次数 | 重试耗尽后降级到替代模型 |
| 限流（429） | ✅ 按 `Retry-After` 或退避 | 等待过长或本提供商额度紧时，再降级 |
| 认证错误（401） | ❌ 不重试原请求 | 告警；凭证修好后发新请求，不降级到另一个模型掩盖配置错误 |
| 上下文超限 | ❌ 不重试原请求 | 截断或压缩后再调用，或换窗口更大的模型 |

#### 实现
```python
import os
from openai import OpenAI

# 所需环境变量：OPENAI_API_KEY、OPENAI_BASE_URL、LLM_MODEL
# 降级模型用 LLM_MODEL_FALLBACK，不把模型名写死
client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ.get("OPENAI_BASE_URL"),
)

class CacheMissError(Exception):
    pass

def complete(model: str, prompt: str) -> str:
    """SDK 自带重试。不要再包一层 retry，否则次数相乘。"""
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content

class FallbackChain:
    """降级链：只对瞬时失败降级，认证错误直接抛出。"""

    def __init__(self, cache):
        self.cache = cache
        self.models = [
            os.environ["LLM_MODEL"],
            os.environ["LLM_MODEL_FALLBACK"],
        ]

    def call(self, prompt: str) -> str:
        errors = []
        for model in self.models:
            try:
                return complete(model, prompt)
            except Exception as exc:
                # 认证、权限、无效请求：换模型也没用，或者会掩盖配置错误
                name = type(exc).__name__
                if name in {"AuthenticationError", "PermissionDeniedError", "BadRequestError"}:
                    raise
                errors.append(f"{model}: {exc}")

        cached = self.cache.get(prompt)
        if cached:
            return cached
        raise CacheMissError("所有模型和缓存都不可用：" + "; ".join(errors))
```

### 五、Agent 特有的错误处理：工具错误作为 Observation

#### 传统程序 vs Agent 的错误处理区别
| 维度 | 传统程序 | Agent |
|------|---------|-------|
| 错误处理方式 | 抛异常，终止或捕获 | 返回结构化错误，让 LLM 决定 |
| 决策者 | 程序代码（if-else） | LLM（根据错误信息推理） |
| 错误信息位置 | 异常对象 | 工具结果（Observation） |
| 自我纠错能力 | 有限（预设的错误处理） | 强（LLM 可以灵活应对各种错误） |

#### 为什么工具错误应该返回给 LLM？
- Agent 循环要把每次工具结果回填成一条与调用配对的消息。LangChain 要求这条 `ToolMessage` 带上原来的 `tool_call_id`，缺了 `ToolNode` 会抛 `ValueError`
- 工具失败也是一条结果。现行做法是用 `wrap_tool_call` 接住异常，返回 `ToolMessage`，而不是让异常冒泡把图打断
- 模型看到失败后可以换参数、换工具或向用户说明。重试次数由 `ToolRetryMiddleware` 限制，不交给模型无限决定
- 中间件顺序有要求：重试放在错误处理内侧。重试耗尽后用 `on_failure=error` 把异常交给外层错误中间件；若重试自己用默认的 `continue`，外层就看不到异常

#### 现行写法：中间件把异常变成 ToolMessage
```python
from collections.abc import Callable

from langchain.agents import create_agent
from langchain.agents.middleware import ToolRetryMiddleware, wrap_tool_call
from langchain.messages import ToolMessage
from langchain.tools.tool_node import ToolCallRequest

@wrap_tool_call
def handle_tool_errors(request: ToolCallRequest, handler: Callable[[ToolCallRequest], ToolMessage]) -> ToolMessage:
    """工具抛异常时，返回与本次调用配对的 ToolMessage。"""
    try:
        return handler(request)
    except Exception as exc:
        return ToolMessage(
            content=f"工具失败：{type(exc).__name__}。请检查参数、换一个工具，或告知用户。({exc})",
            tool_call_id=request.tool_call["id"],
        )

agent = create_agent(
    model="openai:gpt-5.5",  # 文档示例中的现行模型标识，实际部署用自己的提供商
    tools=[search_tool],
    # 列表里靠后的中间件在内侧。重试耗尽后抛异常，外层再转成 ToolMessage
    middleware=[
        handle_tool_errors,
        ToolRetryMiddleware(max_retries=2, retry_on=(TimeoutError, ConnectionError), on_failure="error"),
    ],
)
```

#### 在 Prompt 中指导 LLM 如何处理工具错误
```
## 工具调用错误处理

当工具返回 `status: "error"` 时：
1. 阅读错误信息和建议
2. 如果是超时/限流：等待后重试（最多重试 2 次）
3. 如果是参数错误：修正参数后重试
4. 如果重试 2 次仍失败：尝试其他工具，或者告知用户该功能暂时不可用
5. 不要因为一个工具失败就放弃整个任务——尝试其他方法完成任务
```

#### 关键原则：重试范围缩到会失败的那一层
- LangChain 源码对 `with_retry()` 的说明就是：链上只有可能失败的那一段该重试，不要把整条链包进去
- 工具失败后重跑整个推理循环，会把已完成的模型调用和上下文再付一遍费，也可能重复已经成功的副作用
- 正确边界是：SDK 或 `ToolRetryMiddleware` 重试这一次调用；耗尽后把错误作为 `ToolMessage` 留在当前循环里，由模型决定下一步

### 六、死循环检测与防护

#### Agent 死循环的常见原因
1. 工具持续失败，Agent 反复重试同一个工具
2. Agent 陷入“思考-行动”循环，每次都做相似的动作但没有进展
3. Agent 忘记了原始目标，在细节中无限循环
4. 工具返回结果不明确，Agent 反复调用试图“得到更好的结果”

#### 防护措施

#### 1. 用框架的递归上限，而不是另写一个“15 步”
```python
def invoke_with_limit(graph, inputs):
    """recursion_limit 限制单次执行的 super-step。Python 1.0.6 起默认 1000。"""
    return graph.invoke(inputs, config={"recursion_limit": 25})
```
超限会抛 `GraphRecursionError`。节点内可以读 `config['metadata']['langgraph_step']` 或 `RemainingSteps`，在撞上限之前主动收束，而不是等异常再丢掉已有状态。

#### 2. 重复动作检测（Repetition Detection）
```python
def detect_repetition(history: list, threshold: int = 3) -> bool:
    """检测连续多步调用相同工具且参数相似"""
    recent_actions = history[-threshold:]

    # 检查最近 N 步是否都是相同的工具调用
    if all(action.get("tool") == recent_actions[0].get("tool")
           for action in recent_actions):
        # 检查参数是否相似
        params = [str(action.get("params", {})) for action in recent_actions]
        if len(set(params)) <= 2:  # 参数高度相似
            print(f"[警告] 检测到重复动作：连续 {threshold} 次调用 {recent_actions[0]['tool']}")
            return True
    return False
```

#### 3. 无进展检测（No Progress Detection）
```python
def detect_no_progress(history: list, window: int = 5) -> bool:
    """检测最近 N 步是否没有实质性进展"""
    # 检查最近 N 步的结果是否都相似（没有新信息）
    recent_results = [str(h.get("result", ""))[:100] for h in history[-window:]]
    if len(set(recent_results)) <= 2:
        print("[警告] 检测到无进展：最近多步结果高度相似")
        return True
    return False
```

#### 4. 检测到循环后的处理
- 强制退出并返回当前最佳结果
- 或者：注入“提示消息”让 Agent 重新评估方向（“你已经重复了多次，是否应该换个方法或回到原始目标？”）
- 或者：降级到更简单的策略（直接用 LLM 回答，不调用工具）

---

## 四、最小可运行代码示例

### 完整的容错工具调用装饰器（重试+断路器+降级）

```python
import random
import threading
import time
from functools import wraps

# ========== 1. Full Jitter ==========
def retry_full_jitter(max_attempts=3, base_delay=0.5, max_delay=8.0,
                      retryable=(TimeoutError, ConnectionError)):
    """max_attempts 含第一次。只重试传入的瞬时异常，其他异常原样抛出。"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except retryable:
                    if attempt == max_attempts - 1:
                        raise
                    ceiling = min(max_delay, base_delay * (2 ** attempt))
                    time.sleep(random.uniform(0, ceiling))
        return wrapper
    return decorator


# ========== 2. 断路器 ==========
class CircuitBreakerOpenError(Exception):
    pass

class CircuitBreaker:
    """教学用状态机。阈值是示例；Half-Open 用锁保证同时只有一个探测。"""

    def __init__(self, failure_threshold=5, recovery_timeout=60, max_recovery_timeout=3600):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.max_recovery_timeout = max_recovery_timeout
        self.failures = 0
        self.opened_at = None
        self.state = "closed"
        self._probe_taken = False
        self._lock = threading.Lock()

    def call(self, func, *args, **kwargs):
        with self._lock:
            if self.state == "open":
                if time.monotonic() - self.opened_at < self.recovery_timeout:
                    raise CircuitBreakerOpenError("断路器打开，快速失败")
                self.state = "half-open"
                self._probe_taken = False
            probing = self.state == "half-open"
            if probing:
                if self._probe_taken:
                    raise CircuitBreakerOpenError("半开状态已有探测在进行")
                self._probe_taken = True

        try:
            result = func(*args, **kwargs)
        except Exception:
            with self._lock:
                self.failures += 1
                self._probe_taken = False
                if probing or self.failures >= self.failure_threshold:
                    self.state = "open"
                    self.opened_at = time.monotonic()
                    if probing:
                        self.recovery_timeout = min(
                            self.max_recovery_timeout, self.recovery_timeout * 2
                        )
            raise

        with self._lock:
            self.failures = 0
            self.state = "closed"
            self._probe_taken = False
        return result


# ========== 3. 全局断路器注册表 ==========
circuit_breakers = {}

def get_circuit_breaker(name: str) -> CircuitBreaker:
    if name not in circuit_breakers:
        circuit_breakers[name] = CircuitBreaker()
    return circuit_breakers[name]


# ========== 4. 容错工具调用装饰器（重试+断路器） ==========
def resilient_tool(tool_name: str, max_retries=3):
    """容错工具调用：重试 + 断路器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            breaker = get_circuit_breaker(tool_name)

            # 断路器打开时直接失败（不重试）
            if breaker.state == "open":
                try:
                    return breaker.call(func, *args, **kwargs)
                except CircuitBreakerOpenError as e:
                    # 返回结构化错误给 Agent
                    return {"status": "error", "error_type": "circuit_open",
                            "message": str(e), "suggestion": "服务暂时不可用，请稍后重试"}

            # 只重试瞬时错误。参数错误、认证错误不能在这里被吞掉再试
            for attempt in range(max_retries):
                try:
                    return breaker.call(func, *args, **kwargs)
                except CircuitBreakerOpenError as exc:
                    return {"status": "error", "error_type": "circuit_open",
                            "message": str(exc), "suggestion": "服务暂时不可用"}
                except (TimeoutError, ConnectionError) as exc:
                    if attempt < max_retries - 1:
                        ceiling = min(8.0, 0.5 * (2 ** attempt))
                        time.sleep(random.uniform(0, ceiling))
                        continue
                    return {"status": "error", "error_type": "timeout",
                            "message": f"工具调用失败（共 {max_retries} 次）：{exc}",
                            "suggestion": "请稍后重试，或尝试其他工具"}
                except Exception as exc:
                    return {"status": "error", "error_type": type(exc).__name__,
                            "message": str(exc), "suggestion": "请检查工具参数或尝试其他方法"}
        return wrapper
    return decorator


# ========== 使用示例 ==========
def external_search_api(query: str) -> list:
    """替换成真实搜索客户端。这里只演示失败被转成结构化结果。"""
    raise TimeoutError(f"搜索超时：{query}")

@resilient_tool("search_api", max_retries=2)
def search_tool(query: str) -> dict:
    """搜索工具（自动带重试+断路器）"""
    return {"status": "success", "results": external_search_api(query)}

def main():
    result = search_tool("人工智能")
    if result["status"] != "success":
        print(result["error_type"], result["message"])

if __name__ == "__main__":
    main()
```

### Agent 死循环检测与防护

```python
class AgentLoopGuard:
    """Agent 循环防护：最大步数 + 重复检测 + 无进展检测"""

    def __init__(self, max_steps=15, repetition_threshold=3, no_progress_window=5):
        self.max_steps = max_steps
        self.repetition_threshold = repetition_threshold
        self.no_progress_window = no_progress_window
        self.history = []
        self.step_count = 0

    def record_step(self, tool: str, params: dict, result: str):
        """记录每一步的执行"""
        self.history.append({
            "step": self.step_count,
            "tool": tool,
            "params": params,
            "result": result[:200]  # 只存前 200 字符用于比较
        })
        self.step_count += 1

    def check(self) -> dict:
        """检查是否应该终止循环"""
        # 1. 最大步数检查
        if self.step_count >= self.max_steps:
            return {
                "should_stop": True,
                "reason": "max_steps",
                "message": f"已达到最大步数 {self.max_steps}，强制终止"
            }

        # 2. 重复动作检测
        if self.step_count >= self.repetition_threshold:
            recent = self.history[-self.repetition_threshold:]
            tools_same = all(h["tool"] == recent[0]["tool"] for h in recent)
            params_similar = len(set(str(h["params"]) for h in recent)) <= 2
            if tools_same and params_similar:
                return {
                    "should_stop": True,
                    "reason": "repetition",
                    "message": f"检测到连续 {self.repetition_threshold} 次重复调用 {recent[0]['tool']}"
                }

        # 3. 无进展检测
        if self.step_count >= self.no_progress_window:
            recent = self.history[-self.no_progress_window:]
            results_similar = len(set(h["result"] for h in recent)) <= 2
            if results_similar:
                return {
                    "should_stop": True,
                    "reason": "no_progress",
                    "message": f"最近 {self.no_progress_window} 步结果高度相似，无实质性进展"
                }

        return {"should_stop": False}

    def get_redirect_message(self) -> str:
        """生成重定向消息，注入给 Agent 让它重新评估方向"""
        return (
            "\n\n[系统提示] 你已经执行了多步但似乎没有进展。"
            "请重新评估：1) 是否偏离了原始目标？"
            "2) 是否应该换一种方法？"
            "3) 是否应该直接基于已有信息给出答案？"
            "如果继续重复相同的动作，系统将强制终止。"
        )


# 使用示例：只演示防护器，不调用不存在的模型函数
guard = AgentLoopGuard(max_steps=15, repetition_threshold=3)
for _ in range(3):
    guard.record_step("search", {"q": "订单"}, "同一条错误")
check = guard.check()
if check["should_stop"]:
    print(check["reason"], guard.get_redirect_message())
```

---

## 五、易混概念对比表

| 错误类型 | 可重试？ | 处理策略 | 示例 |
|---------|---------|---------|------|
| 限流（429） | ✅ | 先遵守 `Retry-After` 并封顶，否则退避 | API 调用超限 |
| 408 / 客户端超时 | ✅ | 退避重试；写操作要有幂等键 | 请求没在时限内完成 |
| 409 | ✅ SDK 会重试 | 确认是锁超时而不是业务冲突，再重试 | OpenAI / Anthropic SDK 的 lock timeout |
| 500 及以上 | ✅，501 除外 | 退避后降级；501 改调用方式 | 502/503/504、Anthropic 529 |
| 网络错误 | ✅ | 退避重试 | 连接重置、DNS 临时失败 |
| 无效请求（400/422） | ❌ | 改请求，不原样重发 | 参数或格式错误 |
| 认证错误（401） | ❌ | 换凭证后发新请求 | Token 过期 |
| 权限错误（403） | ❌ | 查权限，不重试 | 无权限访问 |
| 不存在（404） | ❌ | 核对标识 | 模型名或路径错误 |
| 上下文超限 | ❌ | 缩短输入后再调用 | 常以 400 出现，但是另一类错误 |
| 内容过滤 / 额度耗尽 | ❌ | 改输入或处理账单，不重试 | 策略拒绝不是瞬时故障 |

| 容错模式 | 解决什么问题 | 工作原理 | 适用场景 |
|---------|------------|---------|---------|
| 重试（Retry） | 瞬时错误 | 失败后等待再试 | 超时/限流/服务器错误 |
| 指数退避 | 频繁重试压垮服务 | 等待时间指数增长 | 所有重试场景 |
| 抖动（Jitter） | 惊群效应 | Full Jitter、±25%，或乘以 0.75–1.0，三者不要混用 | 多客户端同时重试 |
| 断路器 | 级联失败 | 连续失败后快速失败 | 服务宕机/持续错误 |
| 降级链 | 主服务不可用 | 依次尝试备选方案 | 所有生产级系统 |
| 优雅降级 | 完全失败 | 降低功能级别继续服务 | 部分服务不可用 |
| 死信队列 | 反复失败的任务 | 放入队列后续处理 | 异步任务/批处理 |

| 维度 | 传统程序错误处理 | Agent 错误处理 |
|------|----------------|--------------|
| 错误处理方式 | 抛异常/捕获 | 返回结构化错误给 LLM |
| 决策者 | 程序代码 | LLM（推理决定） |
| 自我纠错 | 预设的错误处理逻辑 | 灵活的 LLM 推理 |
| 重试范围 | 整个函数/操作 | 只重试工具调用，不重试整个推理循环 |
| 错误信息 | 异常对象 | 工具结果（Observation） |
| 死循环防护 | 通常不需要（程序逻辑确定） | 必须（LLM 可能陷入循环） |

| 断路器状态 | 行为 | 转换条件 |
|-----------|------|---------|
| Closed（关闭） | 请求通过，统计时间窗内的近期失败 | 失败超过阈值 → Open，并启动计时 |
| Open（打开） | 立即失败，不调用下游 | 计时结束 → Half-Open |
| Half-Open（半开） | 放行有限数量的探测 | 成功 → Closed 且计数清零；失败 → Open 并重新计时 |

| 重试参数 | OpenAI / Anthropic SDK | LangChain 模型调用 | LangChain 工具重试 |
|---------|----------------------|------------------|-------------------|
| 初始等待 | 0.5 秒 | 集成内部退避，文档未单列公式 | 1 秒 |
| 上限 | 8 秒；`Retry-After` 另有上限 | 未在该参数中暴露 | 60 秒 |
| 次数 | 默认再试 2 次 | `max_retries` 默认 6 | 默认再试 2 次，另加初次调用 |
| 抖动 | 乘以 0.75–1.0 | 文档写明带 jitter | 默认 ±25% |

---

## 六、3个实战中的常见坑

### 坑 1：工具失败后重试整个 LLM 推理循环，导致“Agent 重试风暴”——成本飙升、死循环、服务被压垮

**现象**：团队实现了一个 Agent，当工具调用失败时，代码捕获异常后“从头开始整个 Agent 循环”（重新思考、重新规划、重新调用工具）。运行后发现：①一个不稳定的工具（如搜索 API 偶尔超时）触发 Agent 反复重试，每次重试都重新走完整的推理循环（消耗大量 Token）；②成本上升——每次重跑都要再次发送已有上下文，并可能重复已经成功的副作用；③服务被压垮——Agent 反复重试同一个不稳定的工具，导致该工具的负载更高，更不稳定（恶性循环）；④死循环——Agent 陷入“工具失败→重试→工具失败→重试”的无限循环。

#### 避坑
- **核心原则：重试范围缩到失败的那一次调用**
  - 工具调用失败 → 中间件按有限次数重试这一次 → 仍失败就把 `ToolMessage` 留在当前循环
  - 不要从捕获异常处重跑整个 Agent，也不要用 `chain.with_retry()` 把整条链包进去
  - “整圈比单次工具调用贵 10–100 倍”没有稳定出处，不能当定量结论。可以确定的是：重跑会再次发送已有上下文，并可能重复已经成功的副作用

- **工具错误返回结构化信息，让 LLM 自我纠错**：

```python
# 错误做法：异常冒泡，Agent 循环被打断
def search_tool_bad(query, search_api):
    result = search_api(query)
    if not result:
        raise TimeoutError("搜索超时")
    return result

# 可用做法：返回结构化错误。Agent 框架里更应使用 ToolMessage，见上一节
def search_tool(query, search_api):
    try:
        return {"status": "success", "results": search_api(query)}
    except TimeoutError:
        return {
            "status": "error",
            "error_type": "timeout",
            "message": "搜索服务超时",
            "suggestion": "请简化查询关键词后重试，或尝试其他信息来源",
        }
```
  - LLM 看到错误后，可以：重试（简化关键词）、换工具、告知用户、调整计划
  - 这是 ReAct 循环的正常部分——错误也是一种“观察”

- **重试放在工具调用边界，不放在 Agent 循环外层**：
  - 用 `ToolRetryMiddleware` 或工具自己的客户端重试。默认再试 2 次，不要和 SDK 的默认 2 次叠成双层
  - 耗尽后返回 `ToolMessage`，让模型在当前循环里决定下一步
  - 模型调用的重试用 `max_retries` 或 `ModelRetryMiddleware`，不要为了一次模型超时把前面的工具结果也重跑

- **用递归上限兜底，重复检测只作为补充**：
  - LangGraph 用 `recursion_limit` 限制 super-step，超限抛 `GraphRecursionError`。默认 1000 对交互任务通常太宽，应按任务收紧
  - “连续 3 次相同工具就终止”不是框架标准。相同工具加相同参数可以提示模型换方法，但不能替代递归上限

- **断路器防止把已故障的下游打满**：
  - 每个依赖一个断路器。打开后快速失败，冷却后再做有限探测
  - 阈值按该依赖的流量和时间窗来定，不存在标准的“连续 5 次”

- **类比**：就像“服务员点菜”——
  - 顾客点了鱼，服务员去厨房，发现鱼不新鲜了（工具失败）
  - ❌ 错误做法：服务员回来把整个点菜流程重来一遍（“您好，欢迎光临，请问您要点什么？”）——浪费时间，顾客不耐烦
  - ✅ 正确做法：服务员回来告诉顾客“今天的鱼不太新鲜，您看是换一道菜还是明天再来？”（返回错误信息），让顾客（LLM）决定——高效，顾客有选择权
  - Agent 错误处理也是一样，不要因为工具失败就从头开始整个循环，而是把错误告诉 LLM，让它在当前上下文中决定下一步

### 坑 2：用“4xx 不重试、5xx 都重试”代替错误分类，该试的不试，不该试的反复试

**现象**：团队写了一个按状态码首位分类的重试器。401、403 和参数错误被原样重试，凭证不会因此变有效，权限系统还可能把重复请求当成异常访问。上下文超限常以 400 返回，输入不变就一定再次超限。反过来，408、409、429 也是 4xx，官方 SDK 却会重试；一刀切丢掉这些请求，瞬时故障就被当成永久失败。

#### 避坑
- **核心原则：看错误是否可能在不改请求的情况下消失**
  - 可重试：连接失败、超时、408、429、500/502/503/504、Anthropic 529。409 官方 SDK 会重试，但要确认不是需要改请求的业务冲突
  - 不可重试：401、403、404、无效请求、上下文超限、内容过滤、额度耗尽。400 要拆开看，不能整类丢弃或整类重试
  - 501 虽是 5xx，但表示未实现，重试通常无意义

- **实现错误分类的重试逻辑**：

```python
import random
import time

def exception_sets(sdk):
    """从 OpenAI SDK 模块取异常类。400 不能整类重试，上下文超限也常是 400。"""
    retryable = (
        sdk.APITimeoutError,
        sdk.APIConnectionError,
        sdk.RateLimitError,            # 429
        sdk.InternalServerError,       # SDK 中代表 5xx；501 仍应单独排除
    )
    non_retryable = (
        sdk.AuthenticationError,       # 401
        sdk.PermissionDeniedError,     # 403
        sdk.NotFoundError,             # 404
        sdk.ContentFilterFinishReasonError,
    )
    return retryable, non_retryable

def smart_retry(func, retryable, non_retryable, max_attempts=3):
    """只重试瞬时错误。max_attempts 含第一次调用。"""
    for attempt in range(max_attempts):
        try:
            return func()
        except non_retryable:
            raise
        except retryable:
            if attempt == max_attempts - 1:
                raise
            ceiling = min(8.0, 0.5 * (2 ** attempt))
            time.sleep(random.uniform(0, ceiling))
```

- **特殊错误的特殊处理**：
  - **429**：先解析 `Retry-After`，并拒绝超出上限的值。OpenAI SDK 的上限是 120 秒；没有该头才用退避。不要把限流理解成“一律不重试”
  - **401**：先更换凭证，再发一次新请求。这不是对原请求的自动重试，也不要在没换凭证时循环调用
  - **上下文超限**：缩短消息后再调用。调用的输入已经变了，不能算作同一请求的重试

- **按错误类型看重试是否有效**：
  - 记录状态码、提供商错误类型、是否重试、重试是否成功
  - 某一类错误重试后从不成功，就把它移出可重试集合，而不是继续靠次数碰运气

- **类比**：就像“打电话”——
  - 对方占线（429）：按对方说的时间再打；对方没说，就一次比一次等得更久，并且错开时间
  - 对方手机关机（503/529）：等一会儿再打，试几次仍不通就换联系方式
  - 你拨错号码（无效请求）：先查号码，不要把同一个错号再打一遍
  - 对方把你拉黑（403）：再打也不会接通，还可能被当成骚扰
  - 空号（404）：号码不会因为多打几次出现
  - 一次说太多对方听不进（上下文超限）：缩短内容后再说，原样重复没用
  - 错误处理也是一样，“不是所有错误都值得重试”——先判断错误类型，再决定是重试、修复、还是放弃

### 坑 3：把断路器写成固定的“5 次、60 秒、只放 1 个请求”，或漏掉半开探测

**现象**：阈值低到一两次抖动就打开，正常流量被快速失败；冷却被写成很长且没有 Half-Open，服务恢复后仍拒绝所有请求；失败计数只增不减，历史故障把新窗口也拖进 Open；所有依赖共用一个断路器，一个工具故障让其他工具一起快速失败。

#### 避坑
- **阈值是时间窗里的近期失败，不是无限累计**：
  - Azure 的状态机统计的是给定时间段内的近期失败。成功后要清零或衰减，否则很早以前的失败也会把断路器打开
  - 1–2 次对高流量依赖通常太敏感，几十次又会在已经不可用时继续施压。具体数字按超时和流量定，不能抄“模型 5 次、工具 3 次”

- **冷却时间要能恢复，也要有上限**：
  - 计时结束进入 Half-Open，不是直接 Closed，也不是一直 Open
  - 探测失败后可以加长冷却，但必须封顶。没有上限时，翻倍会让断路器实际上不再打开

- **Half-Open 只放行有限探测**：
  - 探测成功才回 Closed，并清零失败计数
  - 任一探测失败就回 Open，重新计时
  - 并发下要用锁或许可数限制探测数量。先读状态再调用，不占坑，会让多个线程同时探测

- **每个依赖独立的断路器**：
  - 一个依赖故障不应让其他依赖也快速失败
  - 每个提供商、工具和数据库使用自己的断路器
  - 这样一个服务挂了，其他服务仍然正常工作

不要让所有依赖共用一个 `CircuitBreaker`。主模型、替代模型、搜索和数据库各建一个实例；某个实例打开时，其他依赖仍按自己的状态工作。阈值沿用上一节的示例，不是标准值。

- **断路器打开时走降级链**：
  - 断路器打开后，不要直接返回错误给用户
  - 走降级链：主模型断路器打开 → 用便宜模型 → 便宜模型也挂了 → 用缓存 → 都挂了 → 优雅错误消息
  - 断路器是“防止级联失败”的手段，降级链是“确保基本功能”的手段，两者配合使用

- **监控断路器状态**：
  - 记录每个断路器的状态变化（关闭→打开→半开→关闭）
  - 告警：断路器频繁跳闸（说明服务不稳定，需要排查）
  - 监控：断路器打开持续时间（如果打开太久，说明服务恢复慢，需要人工介入）

- **类比**：就像“电路保险丝”——
  - 保险丝太细（阈值太低）：稍微电流大一点就烧断（误跳闸），家里经常停电（用户体验差）
  - 保险丝太粗（阈值太高）：电器都着火了保险丝还没断（不跳闸），可能引发火灾（级联失败）
  - 保险丝烧断后不换（没有半开探测）：永远没电（永远打不开）
  - 全屋一个总闸（全局断路器）：厨房电器短路导致全屋停电（一个工具失败连累所有）
  - 正确的做法：每个房间一个合适粗细的保险丝（每个依赖独立断路器，阈值合理），烧断后等一会儿推上去试试（半开探测），不行就再等更久（冷却翻倍），厨房停电了还可以用客厅的电器（降级链）
  - 断路器设计也是一样，合理的配置才能既保护系统又不影响用户体验

---

## 七、进阶问题（引导往下挖）

### 问题 1：“错误作为信息返回给 LLM”的模式很优雅，但 LLM 可能“不理解”错误信息或者“错误处理不当”——如何确保 LLM 能正确处理各种工具错误？

#### 引导思考
- **“错误作为信息”的优势和挑战**：
  - 优势：灵活——LLM 可以根据错误类型和上下文灵活决定下一步（重试/换工具/告知用户/调整计划）
  - 挑战：不可控——LLM 可能不理解错误信息、可能错误处理、可能忽略错误继续、可能陷入重试循环
- **确保 LLM 正确处理错误的方法**：

  1. **结构化错误格式，而不是自由文本**：
     - 用固定的 JSON 格式返回错误，包含 `status`、`error_type`、`message`、`suggestion` 字段
     - LLM 更容易解析结构化信息，也更容易根据 `error_type` 做决策
     - `suggestion` 字段直接给 LLM 建议下一步（如“请简化查询后重试”），降低 LLM 的决策难度

```python
good = {
    "status": "error",
    "error_type": "timeout",
    "message": "搜索服务超时",
    "suggestion": "请简化查询关键词后重试",
}
bad = "出错了，不知道为什么，你自己看着办吧"
```

  2. **在 System Prompt 中明确错误处理规则**：
     - 不要假设 LLM“知道”怎么处理错误，要在 Prompt 中明确说明
     - 按错误类型给出处理规则：
       ```
       ## 工具错误处理规则
       - timeout（超时）：等待后重试，最多重试 2 次；2 次后换工具或告知用户
       - rate_limit（限流）：等待 5 秒后重试，不要立即重试
       - not_found（不存在）：不要重试，告知用户资源不存在
       - permission_denied（无权限）：不要重试，告知用户需要权限
       - unknown（未知错误）：尝试 1 次，如果仍失败，换工具或告知用户
       - 任何错误重试 2 次后仍失败：不要继续重试，换方法或告知用户
       ```

  3. **少样本示例展示错误处理**：
     - 在 Prompt 中给出 1-2 个“工具失败后正确处理”的完整示例
     - 示例比文字规则更有效——LLM 可以模仿示例的行为
     ```
     ## 示例：工具失败后的正确处理

     用户：帮我搜索"人工智能的最新发展"
     Thought: 用户需要搜索信息，我调用搜索工具。
     Action: search(query="人工智能的最新发展")
     Observation: {"status": "error", "error_type": "timeout", "message": "搜索超时", "suggestion": "简化查询后重试"}

     Thought: 搜索超时了，根据建议我应该简化查询后重试。我把查询简化为"AI 发展"。
     Action: search(query="AI 发展")
     Observation: {"status": "success", "results": [...]}

     Thought: 搜索成功了，我可以基于结果回答用户。
     Final Answer: ...
     ```

  4. **框架计数，不靠模型自觉停**：
     - `ToolRetryMiddleware(max_retries=2)` 表示初次调用之外再试 2 次，耗尽后按 `on_failure` 返回错误或抛出
     - 这是次数上限，不是“连续失败 2–3 次”的经验口诀。模型仍可能换个参数再调，所以还要有 `recursion_limit`

  5. **错误注入测试**：
     - 在测试环境中，故意让工具返回各种错误（超时/限流/404/格式错误）
     - 观察 LLM 是否能正确处理
     - 发现处理不当的场景，优化 Prompt 或错误格式
     - 这是确保 LLM 错误处理能力的最有效方法

  6. **错误处理的可观测性**：
     - 记录每次工具错误后 LLM 的处理方式（重试/换工具/告知用户/忽略）
     - 分析“错误处理不当”的案例（如忽略错误继续、重试次数过多）
     - 持续优化 Prompt 和错误格式
- **类比**：就像“培训新员工处理客户投诉”——
  - 只告诉新员工“客户投诉时灵活处理”是不够的（LLM 可能不知道怎么处理）
  - 正确的培训包括：①标准化的投诉分类（结构化错误格式）；②每种投诉的处理流程（Prompt 中的错误处理规则）；③老员工处理投诉的示范录像（少样本示例）；④主管监督（错误计数器和强制退出）；⑤模拟投诉演练（错误注入测试）；⑥事后复盘（可观测性）
  - LLM 的错误处理培训也是一样，需要系统化的方法，而不是“让 LLM 自己看着办”
- 延伸：后续知识点（可观测性与调试、生产级 Agent 架构设计）会深入讲解如何监控和优化 Agent 的错误处理

### 问题 2：断路器、重试、降级链、死信队列——这么多容错模式，生产级 Agent 应该如何组合使用？有没有“标准架构”？

#### 引导思考
- **各种容错模式的定位**：
  - **重试**：解决瞬时错误（最内层，第一次防御）
  - **断路器**：防止级联失败（中间层，保护下游服务）
  - **降级链**：确保基本功能（外层，用户体验保障）
  - **死信队列**：处理反复失败的任务（最外层，异步任务兜底）
  - **错误作为信息**：Agent 特有的 LLM 自我纠错（贯穿所有层）
- **生产级 Agent 的标准容错架构（分层防御）**：

  ```
  用户请求
      ↓
  ┌─────────────────────────────────────────────────────┐
  │ 第 1 层：降级链（Fallback Chain）                      │
  │   主模型 → 便宜模型 → 缓存 → 优雅错误消息              │
  │   （确保即使所有服务挂了，用户也能得到基本响应）         │
  └──────────────────────┬──────────────────────────────┘
                         ↓
  ┌─────────────────────────────────────────────────────┐
  │ 第 2 层：断路器（Circuit Breaker）                    │
  │   每个模型/工具一个独立断路器                           │
  │   时间窗内失败超阈值后跳闸，冷却后做有限探测           │
  │   （防止服务宕机时反复请求压垮服务，防止级联失败）      │
  └──────────────────────┬──────────────────────────────┘
                         ↓
  ┌─────────────────────────────────────────────────────┐
  │ 第 3 层：重试（Retry with Backoff + Jitter）          │
  │   只重试瞬时错误（408/409/429/5xx/超时/529）          │
  │   次数用 SDK 或中间件默认值，不在外层再叠一层           │
  │   （解决瞬时错误，给服务恢复时间）                      │
  └──────────────────────┬──────────────────────────────┘
                         ↓
  ┌─────────────────────────────────────────────────────┐
  │ 第 4 层：实际调用（LLM API / 工具 API）               │
  └──────────────────────┬──────────────────────────────┘
                         ↓ 失败（所有重试都失败）
  ┌─────────────────────────────────────────────────────┐
  │ 第 5 层：错误作为信息返回给 LLM                         │
  │   结构化错误（status/error_type/message/suggestion）  │
  │   LLM 决定：重试/换工具/告知用户/调整计划              │
  │   （Agent 特有的自我纠错能力）                          │
  └──────────────────────┬──────────────────────────────┘
                         ↓ LLM 也无法处理（死循环/反复失败）
  ┌─────────────────────────────────────────────────────┐
  │ 第 6 层：死循环检测 + 死信队列                         │
  │   最大步数限制 + 重复动作检测 + 无进展检测              │
  │   异步任务反复失败 → 放入死信队列，后续人工处理         │
  │   （最后的兜底，防止系统崩溃）                          │
  └─────────────────────────────────────────────────────┘
  ```

- **各层的协作关系**：
  - **请求从外到内**：用户请求 → 降级链 → 断路器 → 重试 → 实际调用
  - **错误从内到外处理**：实际调用失败 → 重试（解决瞬时错误）→ 重试失败 → 断路器（可能跳闸）→ 断路器打开或重试失败 → 降级链（用备选方案）→ 降级也失败 → 优雅错误消息
  - **Agent 层的特殊处理**：工具错误不抛异常，而是返回结构化错误给 LLM，让 LLM 在 Agent 循环中自我纠错
  - **异步任务的额外层**：反复失败的异步任务放入死信队列，不阻塞主流程

- **关键设计原则**：
  1. **每层只解决一类问题**：重试解决瞬时错误，断路器解决级联失败，降级链解决服务不可用，不要让一层做所有事
  2. **从内到外优先级**：先重试（最便宜），再断路器（保护服务），再降级（用户体验），最后死信队列（兜底）
  3. **每个依赖独立的断路器**：不要全局一个断路器，一个服务挂了连累所有
  4. **可观测性**：每层都要记录状态和指标（重试次数、断路器状态、降级率、死信队列长度），方便排查问题
  5. **配置化**：重试次数、断路器阈值、降级链顺序都应该可配置，不要硬编码

- **同步任务 vs 异步任务的区别**：
  - **同步任务（用户在线等待）**：重试 + 断路器 + 降级链，确保用户快速得到响应（即使是降级响应）
  - **异步任务（后台处理）**：重试 + 断路器 + 死信队列，不要求立即响应，可以反复重试，最终失败的放入死信队列
  - **Agent 任务**：通常是同步的（用户在线等待），但 Agent 内部可能有异步子任务（如批量处理）

- **监控和告警**：
  - **重试成功率**：如果某种错误的重试成功率低，说明不应该重试
  - **断路器跳闸频率**：频繁跳闸说明服务不稳定，需要排查
  - **降级率**：降级率高说明主服务不稳定，需要优化主服务
  - **死信队列长度**：死信队列持续增长说明有系统性问题，需要人工介入
  - **P99 延迟**：容错措施（重试、断路器等待）会增加延迟，需要监控延迟是否在可接受范围内

- **类比**：就像“医院的急诊分诊体系”——
  - **第 1 层（降级链）= 医院总值班**：即使所有科室都忙，总值班也能处理基本问题（确保基本功能）
  - **第 2 层（断路器）= 科室限流**：某个科室病人太多（服务过载），暂时停止接收新病人（跳闸），等科室缓过来再接收（半开探测），防止科室崩溃（级联失败）
  - **第 3 层（重试）= 等号叫号**：医生暂时忙（瞬时错误），等一会儿再叫号（重试），等的时间越来越长（指数退避），多个病人错开叫号（抖动）
  - **第 4 层（实际调用）= 医生看诊**
  - **第 5 层（错误作为信息）= 护士告知病人情况**：检查做不了（工具失败），护士告诉病人“检查机器坏了，您看是明天再来还是先看其他科”（返回结构化错误），让病人（LLM）决定
  - **第 6 层（死循环检测+死信队列）= 医务处介入**：病人在医院反复跑各个科室都解决不了（死循环），医务处介入（强制终止）；处理不了的疑难病例（反复失败的任务）放入疑难病例讨论（死信队列），后续专家会诊（人工处理）
  - 生产级 Agent 的容错架构也是一样，需要分层防御，每层解决一类问题，协同工作确保系统可靠
- 延伸：后续知识点（可观测性与调试、生产级 Agent 架构设计）会深入讲解生产级 Agent 的可靠性架构和监控体系

---

## 八、四关自测

### 复述关（3句话讲清）
1. 先按错误是否可能自行消失来分类：408、409、429、5xx（501 除外）、超时和 529 可以有限重试；401、403、404、无效请求、上下文超限、内容过滤和额度耗尽不重试原请求。400 要看错误类型。
2. 重试、断路器和降级解决的是不同问题。退避加抖动只覆盖瞬时失败，断路器在时间窗内失败过多后快速失败并做有限探测，降级链在主方案不可用时改走替代方案。次数和阈值用对应 SDK 的默认值或按依赖测量，没有统一的“3–5 次、连续 5 次、60 秒”。
3. 工具失败要变成带 `tool_call_id` 的 `ToolMessage`，重试只包这一次调用。LangGraph 再用 `recursion_limit` 限制 super-step，防止整圈重跑和死循环。

### 举例关（真实场景）
客服 Agent 查物流，接口返回 429，并带 `Retry-After: 5`。工具中间件按这个值等一次再调用；仍失败，就返回带原 `tool_call_id` 的 `ToolMessage`，说明是限流。模型据此告诉用户稍后再查，或先记下订单号。它不会拿同一个失败重跑整段推理，也不会在 SDK 已经重试之后再套一层同样的重试。

### 反例关（边界条件）
发邮件的工具在响应超时后被自动重试，服务端其实已经发出第一封，于是用户收到重复邮件。RFC 9110 不允许在不能确认幂等时自动重试非幂等方法。发信、扣款、下单要么带服务端认的幂等键，要么重试前先查询上次结果。另一个边界是 401：不换凭证就重试，结果不会变化；但 429 虽然也是 4xx，却应该按 `Retry-After` 重试，不能因为“4xx”三个字一起丢掉。

### 教学关（给小白讲）
服务员就是模型，厨房是外部工具。厨房一时忙，服务员按对方说的时间再去，没说就一次等得更久，并和其他服务员错开（退避加抖动）。冰箱在一段时间内连续打不开，就先别再开，过一会儿只让一个人去看一眼，好了再恢复（断路器）。招牌菜没有，就按菜单换一道，再没有就说明今天做不了（降级）。服务员不会把整张点菜单撕掉重来，而是把“这道做不了”带回桌上，让客人改点（工具错误变成观察）。

---

## 资料来源

- 标准: [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) — 幂等方法、408/409/500 的语义，以及自动重试非幂等请求的限制
- 标准: [RFC 9110, Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after) — `Retry-After` 可以是日期或秒数，常用于 503
- 架构文档: [Microsoft Azure, Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) — Closed、Open、Half-Open，以及时间窗内的近期失败
- 架构文章: [AWS, Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) — Full Jitter、Equal Jitter、Decorrelated Jitter
- 官方文档: [LangChain, Models](https://docs.langchain.com/oss/python/langchain/models) — `max_retries` 默认 6、可重试状态码、模型异常的 `is_retryable`
- 官方文档: [LangChain, Built-in middleware](https://docs.langchain.com/oss/python/langchain/middleware/built-in) — `ToolRetryMiddleware` 的次数、退避和 `on_failure`
- 官方文档: [LangChain, Tools](https://docs.langchain.com/oss/python/langchain/tools) — 用中间件把工具异常转成 `ToolMessage`
- 官方文档: [LangGraph, Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api) — `recursion_limit` 与 `GraphRecursionError`
- 源码: [langchain_core RunnableRetry](https://github.com/langchain-ai/langchain/blob/master/libs/core/langchain_core/runnables/retry.py) — 只重试会失败的那段 Runnable，默认 `wait_exponential_jitter`
- 源码: [OpenAI Python SDK, `_constants.py` 与 `_base_client.py`](https://github.com/openai/openai-python/blob/main/src/openai/_constants.py) — 默认 2 次、0.5 秒起、8 秒封顶、408/409/429/`>=500`，以及 `Retry-After` 上限
- 源码: [Anthropic Python SDK, `_constants.py` 与 `_exceptions.py`](https://github.com/anthropics/anthropic-sdk-python/blob/main/src/anthropic/_constants.py) — 同样的默认退避，另有 529 Overloaded
- 源码: [tenacity `wait_exponential_jitter`](https://github.com/jd/tenacity/blob/main/tenacity/wait.py) — `multiplier × exp_base^n + random(0, jitter)`，不是 Full Jitter
