## 一、结论前置

1. **流式输出的核心价值不是“更快生成”，而是“更快让用户看到内容”。** TTFT（Time To First Token）指从发出请求到客户端收到第一个 token 的时间。流式不缩短模型把全文算完的总时间，它只把感知等待从“整段憋完才露面”改成“第一个 token 一出来就开始打字”。用户中途发现跑题可以停掉后续生成，但已生成的 token 通常仍会计费。
2. **聊天场景的主流工程组合是：HTTP POST 发消息 + SSE 单向推事件。** WHATWG 的 `EventSource` 原生支持自动重连和 `Last-Event-ID`，但只接受 GET，所以带 body 的对话必须用 `fetch` + `ReadableStream`。OpenAI Python SDK 明确说 streaming 走 SSE；Chat Completions 的 `stream=True` 仍 indefinitely supported，适合 OpenAI 兼容接口（含豆包）。注意：不能写“所有提供商的流式都基于 SSE”——Gemini 等文档本次未能打开，未校准的不写死。
3. **Agent 流式不是多一种 token 流，而是多种事件叠在同一条链上。** 包括文本增量、工具调用分片、handoff、节点状态、错误。生产难点集中在五件事：事件名不能认错 SDK、工具参数按 `index` 累积、工具一开始就推状态、错误走事件而不是掐断连接、反向代理不能把流缓冲成假流式。

---

## 二、通俗类比 + 专业定义

### 通俗类比

#### 流式输出 = 餐厅上菜方式的变革

- **非流式 = 所有菜做好一起上**：
  - 你点了一桌子菜（发了一个复杂问题）
  - 厨房全部做好后，服务员一次性端上来
  - 等待期间什么都吃不到，只能盯着空桌（加载 spinner）
  - 焦虑：“是不是忘了我的单？”（重复提交、刷新）

- **流式 = 做好一道上一道**：
  - 凉菜一出锅就上桌，热菜随后到
  - 总烹饪时间没变，但你早就开始吃了
  - 吃到一半发现“这盘不对”，可以立刻喊停，后面的菜不再做

- **Agent 流式 = 开放式厨房**：
  - 不只上菜，还让你看见“正在切菜 / 正在炒 / 出锅了”
  - 工具执行几秒时，用户看到的是“正在搜索”，而不是空白
  - 这不是把厨房流水线改成并行（Agent 循环仍然是：模型说完 → 跑工具 → 再问模型），只是把每个阶段的状态立刻端到桌面上

### 专业定义

下面五个概念是理解全文的基础，先把术语对齐：

- **流式输出（Streaming）**：服务器在生成过程中持续推送不完整结果，客户端边收边渲染。对比非流式：服务器缓存全部输出，生成结束后一次性返回。
- **TTFT**：请求发出到第一个可见 token 到达客户端的时间。流式优化的是 TTFT 和感知等待，不是总生成时间。
- **SSE（Server-Sent Events）**：WHATWG 规定的基于 HTTP 的单向事件流。`Content-Type: text/event-stream`；事件以空行（`\n\n`）分隔；字段包括 `data:` / `event:` / `id:` / `retry:`；始终按 UTF-8 解码；浏览器 `EventSource` 会自动重连并带上 `Last-Event-ID`。
- **chunk / delta**：一次推送里新增的那一小段。OpenAI Chat Completions 流式里，文本在 `choices[0].delta.content`，工具调用在 `delta.tool_calls`；`content` 经常是 `None`。
- **Agent 流式**：在 LLM token 流之外，再推工具开始/结束、节点更新、handoff、错误等语义事件。不同框架的顶层事件名不同，不能互相套用。

---

## 三、底层机制

### 1. 流式输出的工作原理

#### 传统非流式 vs 流式

```
非流式（Non-Streaming）：
客户端 → 发送请求
服务器 → 生成 token 1..N（全部缓存）
服务器 → 一次性返回全文
客户端 → 整段结束后才看见任何字
TTFT ≈ 总生成时间

流式（Streaming）：
客户端 → 发送请求
服务器 → 生成 token 1 → 立刻推 chunk 1
客户端 → 显示 token 1（此时 TTFT 结束）
服务器 → 继续推 chunk 2..N，最后约定结束标记
客户端 → 边收边追加
总生成时间 ≈ 非流式，但感知等待 ≈ TTFT
```

#### 关键洞察

从上面的对比可以得出四个反直觉但重要的结论：

- **总生成时间不变**：流式不加快模型算字的速度。
- **感知延迟下降**：用户从“盯 spinner”变成“看着字往外蹦”。
- **中途可停**：前端 `AbortController` / 关掉 HTTP 连接；服务端相应取消上游流。已生成部分通常已计费。
- **OpenAI Python 消费 `Stream` 不自动重试**：重放请求会把已经送达的内容再生成一遍。取消 = 关掉这条 HTTP（context manager / `close()` / 客户端 abort），不要虚构一个单独的 “cancel 接口”。

### 2. SSE 协议详解

#### 核心特性（WHATWG）

1. 基于 HTTP 长连接，`Content-Type: text/event-stream`
2. 单向：只能服务器 → 客户端
3. 浏览器原生 `EventSource`：自动重连，重连时带 `Last-Event-ID`
4. 仅 UTF-8 文本，没有二进制帧，也没有应用层 pause API
5. 事件之间用空行分隔，不是“每行一个事件”

#### 线格式

```
id: 42
event: token
data: {"text": "Hello"}

data: [DONE]

```

- 每个事件由若干 `field: value` 行组成，以空行结束
- 多行 `data:` 会用 `\n` 拼成一条 `event.data`
- `id:` 会成为该连接的 last event ID
- OpenAI 兼容接口常用 `data: <json>`，最后一条 `data: [DONE]` 是约定结束标记，**不是 JSON**，不能 `JSON.parse`

#### 前端必须分清的两条路

| 能力 | `EventSource` | `fetch` + `ReadableStream` |
|------|----------------|----------------------------|
| HTTP 方法 | 只有 GET | 任意，聊天用 POST |
| 自动重连 / `Last-Event-ID` | 有 | 要自己做 |
| 应用层背压 | 没有 pause | 暂停 `reader.read()` 会形成背压 |
| 取消 | `source.close()` | `AbortController.abort()` |
| 适合聊天 POST | 不适合 | 适合 |

聊天带 body → 用 fetch。`EventSource` 适合“通知订阅”这类 GET 流，不要拿它发对话。

#### SSE vs WebSocket

| 维度 | SSE | WebSocket |
|------|-----|-----------|
| 方向 | 单向（服务器→客户端） | 双向 |
| 协议 | HTTP | 独立 `ws://` / `wss://` |
| 浏览器 | `EventSource` | `WebSocket` |
| 自动重连 | 规范要求 | 要自己写 |
| 二进制 | 否 | 是 |
| LLM 打字机 | 常见、够用 | 仅在需要客户端高频回推时 |

选型：**纯推流用 SSE；需要双向实时用 WebSocket。** 最常见架构仍是：普通 HTTP POST 发用户消息，SSE（或 fetch 读 SSE 体）收回包。

#### `Last-Event-ID` 不能当 LLM 断点续写

`Last-Event-ID` 只能让服务器**重放它已经缓存过的事件**。LLM token 流不可复现：同一段 prompt 再请求一次，得到的是新生成，不是原流的续上。把已生成文本塞回 prompt 当“续写”只是提示技巧，不是协议层断点。

### 3. LLM 流式 API

本仓库示例统一读环境变量：`OPENAI_API_KEY` / `OPENAI_BASE_URL` / `LLM_MODEL`。不写死 key，不写死会过时的模型名。

#### OpenAI 兼容接口（Chat Completions，`stream=True`）

openai-python README：streaming 使用 SSE；Chat Completions 仍 indefinitely supported。Python 迭代器会在 SDK 内部消费掉线上的 `data: [DONE]`，应用代码通常看不到这一行。

`delta` 结构（概念，不是保证每次字段齐全）：

- `choices[0].delta.content`：新增文本，可能为 `None`
- `choices[0].delta.tool_calls[]`：按 `index` 分片；**往往只有第一个 chunk 带 `id` / `name`，后续只有 `arguments` 碎片**
- `choices[0].finish_reason`：生成中为 `None`；结束为 `stop` / `tool_calls` 等。**非空之后再 `json.loads` 完整 arguments**

#### Anthropic（SDK helpers）

Anthropic 官方文档站本次因地区限制未能打开，以下内容基于 anthropic-sdk-python 的 helpers 源码确认：

- `with client.messages.stream(...) as stream:`
- `stream.text_stream` 迭代文本增量
- 退出 context manager 会取消；也可以 `stream.close()`
- 模型名同样走环境变量，不写死版本号

#### 关键注意事项

- 不要假设每个 chunk 都有文本
- 工具 JSON 必须累积，禁止对半截字符串 `json.loads`
- 结束标记 `[DONE]` 不是 JSON
- 消费 SDK `Stream` 不要依赖自动重试

### 4. Agent 流式的特殊性

#### 普通 LLM 流式 vs Agent 流式

| 维度 | 普通 LLM 流式 | Agent 流式 |
|------|----------------|-----------|
| 事件 | 几乎只有文本 delta | 文本 + 工具 + 节点/步骤 + handoff + 错误 |
| 用户看见 | 逐字打字 | “正在搜…” → 结果摘要 → 再逐字作答 |
| 循环 | 一轮生成 | 生成结束（可能 `tool_calls`）→ 执行工具 → 再开一轮生成 |
| 易错点 | 缓冲、取消、错误事件 | 事件名认错、参数分片、工具阶段空白 |

为了便于理解，可以把 Agent 执行过程标记为 `agent.started` / `run.step.started` 这类**分类标签**。但要注意：它们**不是**某个 SDK 的顶层 `event.type`，不要写进 `if event.type == ...` 里。

#### OpenAI Agents SDK（官方文档）

- `Runner.run_streamed()` → `RunResultStreaming`
- 必须把 `result.stream_events()` **消费到 iterator 结束**；最后几个可见 token 之后，SDK 还可能做 session 持久化、审批记账、history compaction。循环退出后看 `result.is_complete`
- 顶层 `StreamEvent.type` 只有这几类：
  - `raw_response_event`：`event.data` 是 Responses API 事件。文本增量用 `isinstance(event.data, ResponseTextDeltaEvent)` 再读 `event.data.delta`。`response.output_text.delta` 在 **data** 上，不在顶层 `event.type`
  - `run_item_stream_event`：完整 item。`event.item.type` 为 `tool_call_item` / `tool_call_output_item` / `message_output_item` 等
  - `agent_updated_stream_event`：`event.new_agent.name`
- `RunItemStreamEvent.name` 的语义名：`message_output_created`、`handoff_requested`、`handoff_occured`（官方故意保留这个拼写）、`tool_called`、`tool_output`、`reasoning_item_created` 等
- 中途停：`result.cancel()` 默认立刻停；`result.cancel(mode="after_turn")` 等当前 turn 干净结束。审批暂停时 iterator 会先结束，pending 在 `result.interruptions`，用 `result.to_state()` 批准后再 `Runner.run_streamed(agent, state)`

#### LangChain / LangGraph（不要混版本号）

两套命名空间，不要串：

1. **LangChain 事件流（新应用推荐）**：`stream_events(..., version="v3")`，用 `stream.interleave("messages", "tool_calls")` 分别拿文本投影和工具投影。这是 typed-projection API，不是旧的回调名字。
2. **统一 `stream` 格式**：`agent.stream(..., stream_mode=..., version="v2")` 得到 `{type, ns, data}`。`type` 是 `updates` / `messages` / `custom` 等。
3. **LangGraph `stream` 默认仍是 v1**：单 mode 返回 raw dict；多 mode 返回 `(mode, data)` 元组；子图再套 namespace。`version="v2"` 才统一成 `StreamPart`。LangGraph 的 `version="v2"` ≠ LangChain 的 `stream_events version="v3"`。

注意：旧代码里常见的 `chain.astream_events(..., version="v2")` + `event["event"] == "on_chat_model_stream"` 是旧回调风格，新应用不要再用。另外，LangChain 的 Python 和 JS 文档是两套 API，不要互相参照。

#### Letta

- 默认 **step streaming**：每步结束后推完整消息，不必重组
- `stream_tokens=True` 才是 token 流：同一 `id` 的多个 chunk 要在客户端累加
- SSE 同样以 `data: [DONE]` 结束
- 开启 reasoning 时常见顺序：`reasoning_message` →（`tool_call_message` → `tool_return_message`）→ `assistant_message`

### 5. 工具调用的流式处理

Agent 循环是**顺序**的：本轮 LLM 流结束且 `finish_reason=tool_calls` → 执行工具 → 把观察塞回消息 → 再开下一轮 LLM 流。工具跑几秒时后面没有新的模型 token，这是循环语义，**不是** SSE/HTTP 的队头阻塞。

真正的传输层 HOL：HTTP/1.1 一连接一请求；HTTP/2 多流复用仍受 TCP 丢包影响；HTTP/3/QUIC 在传输层规避队头阻塞。工程上真正要做的是：**工具名一到就推 `tool_start`，不要等工具跑完才吐任何事件。**

累积规则：

1. 用 `index` 当字典键，不要用可能晚到的 `id`
2. 首个 chunk 写入 `id` / `name`；后续只追加 `arguments` 字符串
3. `name` 一出现立刻发“正在调用 xxx”，此时 JSON 仍不完整
4. `finish_reason` 非空后再 `json.loads`
5. 不要把原始 arguments JSON 直接渲染给终端用户

### 6. 生产级挑战

#### 挑战 1：断流与重连

`EventSource` 会自动重连并带 `Last-Event-ID`。你的服务器必须真的缓存了那些 id，才能续推。LLM 流缓存不住、也重放不了。fetch POST 方案要自己实现重连；更常见的降级是：保留已渲染文本，必要时把已生成内容当前缀重新请求（提示技巧，不是断点）。

#### 挑战 2：队头阻塞（概念别用错）

不要把"工具执行挡住后续 token"当成 SSE 的队头阻塞。工具阶段应该推状态事件；下一轮模型流是新的一次上游请求，和当前流无关。

#### 挑战 3：背压

WHATWG SSE / `EventSource` **没有**应用层 pause。`fetch` 读 `ReadableStream` 时，你不调用下一次 `reader.read()`，内核/HTTP 层才会形成背压。服务端若用同步生成器堵在 async 路由里，既取不消也背压不了——见下一节 FastAPI 示例。至于"万级并发用什么方案"，本次未找到可靠依据，不写死。

#### 挑战 4：错误处理

流中出错应推 `event: error`（或你们自己的 JSON `type=error`），**不要直接断开导致前端把已渲染 DOM 清掉**。保留已生成文本，给重试入口。

#### 挑战 5：成本与取消

用户点停止 = 取消 HTTP。上游 SDK 停了生成，已产出 token 通常仍计费。不要假设“取消就不花钱”。OpenAI 流消费失败不会自动重试，这是刻意的。

---

## 四、最小可运行代码示例

以下示例按"从简单到完整"排列：先看最基础的 OpenAI 兼容流式调用，再到 FastAPI 后端、前端消费、Agent 循环，最后是各框架的官方写法。

先配置环境变量（任何 OpenAI 兼容接口均可）：

```bash
export OPENAI_API_KEY=sk-xxx
export OPENAI_BASE_URL=https://api.example.com/v1
export LLM_MODEL=your-model-name
```

### 1. OpenAI 兼容流式（同步客户端）

最基础的用法：开启 `stream=True`，迭代器逐 chunk 消费文本增量。

```python
import os
from openai import OpenAI

client = OpenAI()  # 读取 OPENAI_API_KEY / OPENAI_BASE_URL
MODEL = os.environ["LLM_MODEL"]

stream = client.chat.completions.create(
    model=MODEL,
    messages=[{"role": "user", "content": "用三句话介绍流式输出"}],
    stream=True,
)

full = []
for chunk in stream:
    if not chunk.choices:
        continue
    delta = chunk.choices[0].delta
    if delta.content:
        full.append(delta.content)
        print(delta.content, end="", flush=True)
print("".join(full))
```

### 2. FastAPI SSE：async generator + 关闭 nginx 缓冲

FastAPI 文档：`StreamingResponse` 要能取消，生成器必须碰到 `await`。同步 `generate()` 包进 `async def` 路由会堵住事件循环，取消也无效。用 `AsyncOpenAI`。

```python
import json
import os

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

app = FastAPI()
client = AsyncOpenAI()
MODEL = os.environ["LLM_MODEL"]


class ChatIn(BaseModel):
    message: str


@app.post("/chat")
async def chat(body: ChatIn):
    async def generate():
        # 每个 yield 前都有 await：取消才能生效
        stream = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": body.message}],
            stream=True,
        )
        try:
            async for chunk in stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta.content:
                    payload = json.dumps({"type": "token", "text": delta.content})
                    yield f"data: {payload}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            err = json.dumps({"type": "error", "message": str(exc)})
            yield f"event: error\ndata: {err}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # 让 nginx 关掉这条响应的缓冲
        },
    )
```

nginx：`proxy_buffering` **默认 on**。响应头 `X-Accel-Buffering: no` 可以覆盖（除非配了 `proxy_ignore_headers` 把这个头忽略掉）。也可以在 location 里写 `proxy_buffering off;`。`proxy_read_timeout` 默认 60s，指**两次成功读之间**的超时，不是整段响应的总时限；模型长时间不出 token 会被掐断。

### 3. 前端：fetch POST + 按 `\n\n` 切事件 + AbortController

前端消费 SSE 的正确姿势：用 `fetch` 发 POST（`EventSource` 不支持 POST），用 `ReadableStream` 按空行 `\n\n` 切完整事件，用 `AbortController` 取消。三个常见错误：只用 `split('\n')` 会切坏多行 data、对 `[DONE]` 做 `JSON.parse` 会报错、忘了处理 error 事件。

```javascript
async function streamChat(message, outputElement, abortController) {
  const response = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
    signal: abortController.signal,
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read(); // 不调用下一次 read = 应用层背压
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      const dataLines = rawEvent
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart());
      const data = dataLines.join("\n");
      if (!data) continue;
      if (data === "[DONE]") return fullText;

      const payload = JSON.parse(data);
      if (payload.type === "token") {
        fullText += payload.text;
        outputElement.textContent = fullText;
      } else if (payload.type === "error") {
        outputElement.textContent = fullText + "\n[错误] " + payload.message;
      } else if (payload.type === "tool_start") {
        outputElement.textContent = fullText + "\n[正在调用] " + payload.name;
      }
    }
  }
  return fullText;
}

const controller = new AbortController();
document.querySelector("#stop")?.addEventListener("click", () => controller.abort());
```

### 4. Agent 循环：按 index 累积 tool_calls，name 到了立刻 tool_start

完整的 Agent 流式循环：本轮 LLM 流结束后判断是否有工具调用，有则执行工具、把结果塞回消息，再开下一轮。关键是工具参数按 `index` 累积，`name` 一到就推状态，不要等 JSON 完整。

```python
import json
import os
from openai import OpenAI

client = OpenAI()
MODEL = os.environ["LLM_MODEL"]

tools = [
    {
        "type": "function",
        "function": {
            "name": "search",
            "description": "搜索公开资料",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    }
]


def execute_tool(name: str, params: dict) -> str:
    if name == "search":
        return f"关于 {params.get('query', '')} 的摘要（示例占位）"
    return f"未知工具 {name}"


def run_agent(user_text: str):
    messages = [{"role": "user", "content": user_text}]
    announced = set()

    while True:
        stream = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=tools,
            stream=True,
        )
        tool_calls = {}  # index -> {id, name, arguments}
        text_parts = []

        for chunk in stream:
            if not chunk.choices:
                continue
            choice = chunk.choices[0]
            delta = choice.delta

            if delta.content:
                text_parts.append(delta.content)
                print(delta.content, end="", flush=True)

            if delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    slot = tool_calls.setdefault(
                        idx, {"id": None, "name": None, "arguments": ""}
                    )
                    if tc.id:
                        slot["id"] = tc.id
                    if tc.function and tc.function.name:
                        slot["name"] = tc.function.name
                    if tc.function and tc.function.arguments:
                        slot["arguments"] += tc.function.arguments
                    if slot["name"] and idx not in announced:
                        announced.add(idx)
                        print(f"\n[tool_start] {slot['name']}", flush=True)

            if choice.finish_reason == "tool_calls":
                messages.append(
                    {
                        "role": "assistant",
                        "content": "".join(text_parts) or None,
                        "tool_calls": [
                            {
                                "id": slot["id"],
                                "type": "function",
                                "function": {
                                    "name": slot["name"],
                                    "arguments": slot["arguments"],
                                },
                            }
                            for slot in tool_calls.values()
                        ],
                    }
                )
                for slot in tool_calls.values():
                    params = json.loads(slot["arguments"])  # 此时才完整
                    result = execute_tool(slot["name"], params)
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": slot["id"],
                            "content": result,
                        }
                    )
                announced.clear()
                break

            if choice.finish_reason == "stop":
                return "".join(text_parts)

    return "".join(text_parts)
```

### 5. OpenAI Agents SDK（注意顶层 type 的正确用法）

OpenAI Agents SDK 的事件分层容易写错：文本 delta 在 `event.data` 上，不在顶层 `event.type`。

```python
import asyncio
from openai.types.responses import ResponseTextDeltaEvent
from agents import Agent, ItemHelpers, Runner


async def main():
    agent = Agent(name="Joker", instructions="You are a helpful assistant.")
    result = Runner.run_streamed(agent, input="Please tell me 5 jokes.")

    async for event in result.stream_events():
        if event.type == "raw_response_event" and isinstance(
            event.data, ResponseTextDeltaEvent
        ):
            print(event.data.delta, end="", flush=True)
        elif event.type == "agent_updated_stream_event":
            print(f"\n[agent] {event.new_agent.name}")
        elif event.type == "run_item_stream_event":
            if event.item.type == "tool_call_item":
                print("\n[tool_called]")
            elif event.item.type == "tool_call_output_item":
                print(f"\n[tool_output] {event.item.output}")
            elif event.item.type == "message_output_item":
                print(f"\n[message]\n{ItemHelpers.text_message_output(event.item)}")

    # 必须消费到 iterator 结束；这里循环退出后看最终状态
    print("complete:", result.is_complete)


if __name__ == "__main__":
    asyncio.run(main())
```

### 6. LangChain v3 事件流 + LangGraph `stream` v2（两套 API，注意区分）

LangChain 的 `stream_events v3` 和 LangGraph 的 `stream v2` 是两套命名空间，version 号不能互相套用。

```python
from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver


def get_weather(city: str) -> str:
    """Get weather for a given city."""
    return f"It's always sunny in {city}!"


# 模型字符串按你的 provider 改；不要照抄文档里的过时/内部代号
agent = create_agent(
    model="openai:gpt-4o-mini",
    tools=[get_weather],
    checkpointer=InMemorySaver(),
)

# LangChain：新应用推荐 stream_events version="v3" + interleave
stream = agent.stream_events(
    {"messages": [{"role": "user", "content": "What is the weather in SF?"}]},
    version="v3",
)
for kind, item in stream.interleave("messages", "tool_calls"):
    if kind == "messages":
        for token in item.text:
            print(token, end="", flush=True)
    elif kind == "tool_calls":
        print(f"\nTool call: {item.tool_name}({item.input})")

final_state = stream.output

# LangGraph / 统一 stream 格式：version="v2" 得到 {type, ns, data}
# 这是另一套 version 号，不是把 v3 填进这里
for chunk in agent.stream(
    {"messages": [{"role": "user", "content": "What is the weather in SF?"}]},
    stream_mode=["updates", "messages"],
    version="v2",
):
    if chunk["type"] == "messages":
        token, metadata = chunk["data"]
        if getattr(token, "content", None):
            print(token.content, end="", flush=True)
    elif chunk["type"] == "updates":
        print("\n[update]", chunk["data"])
```

LangGraph 默认 v1：单 mode 直接是 raw dict。父图包了 `create_agent` 子图时，要拿内层 token 必须 `subgraphs=True`。

### 7. Anthropic SDK（helpers 写法）

Anthropic 官方站本次未校准，以下基于 SDK helpers 源码：

```python
import os
from anthropic import Anthropic

client = Anthropic()  # ANTHROPIC_API_KEY
MODEL = os.environ["LLM_MODEL"]

with client.messages.stream(
    model=MODEL,
    max_tokens=1024,
    messages=[{"role": "user", "content": "用三句话介绍流式输出"}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
# 退出 with 会取消；也可 stream.close()
```

---

## 五、易混概念对比表

流式输出的坑大多来自"把两个相似概念当成一回事"。下表把最容易混淆的八组概念并排对齐：

| 概念 | 它到底是什么 | 常见误认 | 正确边界 |
|------|----------------|----------|----------|
| 流式 vs 非流式 | 推送时机：边生成边发 vs 攒完再发 | “流式生成更快” | 总时间差不多；变的是 TTFT / 感知等待 |
| SSE vs WebSocket | 单向 HTTP 事件流 vs 双向独立协议 | “LLM 必须上 WS” | 打字机够用 SSE；WS 留给双向 |
| `EventSource` vs fetch | GET 订阅 vs 任意方法读流 | “聊天用 EventSource” | POST 对话用 fetch；ES 无 pause、不能 POST |
| HTTP HOL vs Agent 等待 | 传输层一连接堵住 vs 循环里先跑工具 | “工具耗时 = SSE 队头阻塞” | 工具阶段应推状态；下一轮是新的模型流 |
| LangChain v3 vs LangGraph v2 | 事件投影 API vs `StreamPart` 字典 | 两个 version 可以混填 | 命名空间不同；Graph 默认仍是 v1 |
| Agents 顶层 type vs data.type | `raw_response_event` vs `response.output_text.delta` | `if event.type == "response.output_text.delta"` | delta 在 `event.data` 上 |
| `Last-Event-ID` vs 续写 | 重放已缓存事件 vs 重新生成 | “断线从 token 断点接着吐” | LLM 流不可复现 |
| Step 流 vs Token 流（Letta） | 整步消息 vs 同 id 分片 | 默认就是打字机 | 默认 step；token 要 `stream_tokens=True` |

---

## 六、3 个实战中的常见坑

下面三个坑是生产环境最高频的翻车点，按"现象 → 原因 → 避坑"排列：

### 坑 1：Nginx / 反向代理缓冲导致"假流式"

**现象**：本地逐字打出，上线后憋很久突然蹦出一大段。

**原因**：nginx `proxy_buffering` 默认 **on**，会尽量把上游响应读进缓冲区（内存不够再进临时文件），再交给客户端。流式 SSE 被攒成普通响应。

**避坑**：

- 应用响应带 `X-Accel-Buffering: no`（可被 `proxy_ignore_headers` 关掉，那时这条头没用）
- 或 location 写 `proxy_buffering off;`
- 同时检查 gzip、HTTP/2 缓冲、CDN、云负载均衡是否还在攒包
- 关注 `proxy_read_timeout`：默认 60s 是两次读之间的间隔

### 坑 2：工具参数分块 JSON 没累积

**现象**：`JSONDecodeError`，或界面永远不出现“正在调用工具”。

**原因**：`arguments` 按 token 切开；`id`/`name` 往往只在首 chunk。对半截字符串 `json.loads`，或等到工具跑完才推任何 UI。

**避坑**：按 `index` 累积；`name` 一到就 `tool_start`；`finish_reason` 非空再 parse。前端不要展示原始 JSON。

### 坑 3：中途失败直接断开，已生成内容被清空

**现象**：模型写到一半报错，连接没了，页面空白。

**避坑**：

- 生成器 `except` 里 yield 一条 error 事件，再发 `[DONE]`
- 前端把 error 画在已有文本后面，不 `innerHTML = ""`
- FastAPI 用 **async generator + 真实 await**，取消才停得住
- 不要对 OpenAI `Stream` 做“失败自动重试”——会重复已显示内容

错误示范（同步生成器、失败直接崩、假流式）：

```python
def generate():  # 不要这样：堵 event loop，也取消不了
    for chunk in sync_client.chat.completions.create(...):
        yield f"data: {chunk}\n\n"
```

正确方向见第四节的 `async def generate()`：有 `await`、有 error 事件、有 `[DONE]`、有 `X-Accel-Buffering: no`。

---

## 七、进阶问题（引导往下挖）

掌握上面的内容后，这两个问题帮你把知识从"会用"推向"想透"：

### 问题 1：流式只是体验优化吗？对成本、可靠性、可观测性还有什么？

#### 引导思考

1. **成本**：流式让用户能提前停。停掉后通常仍要为已生成 token 付钱，但不必为后半段继续烧。不要用无出处的“提前停 xx% 省 yy% token”当结论；去自己的账单和 trace 里量。
2. **可靠性**：非流式是全有或全无——生成到 90% 失败等于用户看见 0。流式是渐进交付：失败前的字还在。前提是错误走事件、前端不清空。
3. **可观测性**：流式才能定义 TTFT、token 间隔、取消率、工具段空白时长。这些比“总耗时一个数字”更能定位是网关缓冲、模型变慢，还是工具卡住。
4. **取消语义**：取消 = 关 HTTP。SDK 流不自动重试。可观测性要把“用户取消”和“上游失败”分开，否则 SLA 会被自己的停止按钮污染。
5. **交互**：流式打开了“看到跑题就改方向”的产品形态；那是产品设计，不是协议免费附赠。

类比：从“寄一封完整的信”变成“通电话”。电话并不让对方脑子转得更快，但允许你中途打断、听语气判断卡没卡住、断线后至少记得刚才说到哪。

### 问题 2：事件很多，前端怎么展示才不像调试器？

#### 引导思考

分层，而不是把 SDK 事件名泼到屏幕上：

1. **主区（所有人）**：最终答案逐字出现。工具只用一行人话：“正在搜索… / 搜索完成”。原始 JSON 默认不展示。
2. **折叠的过程（自愿）**：Thought、工具摘要、步骤关系。默认收起。
3. **调试面板（权限）**：原始事件、完整 arguments、时间戳。这是给排障的，不是给终端用户的。
4. **状态要及时**：`tool_start` 在 name 到达时就画，不要等工具返回。这和坑 2 是同一条机制。
5. **错误也是内容**：跟在已生成文字后面，而不是替换整棵 DOM。

类比：透明厨房的玻璃隔断——用餐区干净，想看炒菜再往玻璃那儿看，后厨监控屏只有值班经理能进。

---

## 八、四关自测

### 复述关（3 句话讲清）

1. 流式不让模型算得更快，它降低的是 TTFT 和感知等待：第一个 token 一到就开始渲染。
2. 对话用 HTTP POST 发、SSE 推；`EventSource` 不能 POST，要用 fetch 按 `\n\n` 拆事件，且不要 `JSON.parse("[DONE]")`。
3. Agent 流式要认对框架事件名、按 `index` 拼工具 JSON、工具一开始就推状态；工具等待不是 HTTP 队头阻塞；nginx 默认缓冲会造成假流式。

### 举例关（真实场景）

你做一个写作助手。非流式下，用户对着空白页干等整篇生成结束，不知道死没死，容易连点重发。改成 SSE 后，第一个 token 一到就开始出字，用户边读边判断方向；发现跑题就 abort，后半段不再生成（前半段 token 通常仍计费）。上线时必须处理 nginx `proxy_buffering`——响应头加 `X-Accel-Buffering: no`，或在 location 里关闭缓冲。否则本地打字机好好的，线上又变成"攒完突然倒一大段"的假流式。

### 反例关（边界条件）

第一个 tool_call chunk 就 `json.loads(arguments)` —— JSON 还是半截，必然爆。`if event.type == "response.output_text.delta"` 在 Agents SDK 里也对不上：那是 `raw_response_event` 的 `data`，不是顶层 type。

以下都是边界上的错法：
- 把工具执行几秒写成 "SSE 队头阻塞"
- 用 `EventSource` 发 POST
- 指望 `Last-Event-ID` 从某个 token 断点续写
- 流失败就自动重放同一条 `Stream`

### 教学关（给小白讲）

以前餐厅等所有菜齐了才上桌，你会饿、会催单。现在做好一道上一道，总时间差不多，但你早就开吃了。传菜窗口（SSE）是单向的：菜从厨房到你桌。你要点餐得另开一张单（HTTP POST / fetch），不能对着传菜口喊（EventSource 不会 POST）。中间别加一口蓄水缸（nginx 缓冲），否则又变回“等很久来一大桶”。后厨炒菜那几分钟（跑工具）不是窗口堵了，是菜还在锅里——这时候递一张“正在炒”的纸条，别让客人盯着空桌。

---

## 资料来源

> 下列链接在 2026-10-20 校准中实际打开。打不开的官方 HTML（OpenAI Platform 被 Cloudflare 403、Anthropic / Claude 平台地区墙、MDN EventSource、Gemini / Vertex、Azure streaming）不列入，也不根据它们下结论。

- 官方文档: [OpenAI Agents SDK — Streaming](https://openai.github.io/openai-agents-python/streaming/) — `run_streamed` / `stream_events` 必须消费到结束；顶层 `raw_response_event` / `run_item_stream_event` / `agent_updated_stream_event`；`ResponseTextDeltaEvent.delta`；`RunItemStreamEvent.name`（含 `handoff_occured` 官方拼写）
- 官方文档: [LangChain — Streaming](https://docs.langchain.com/oss/python/langchain/streaming) — 新应用推荐 `stream_events(..., version="v3")` + `interleave`；`stream(..., version="v2")` 的 `{type, ns, data}`
- 官方文档: [LangGraph — Streaming](https://docs.langchain.com/oss/python/langgraph/streaming) — 默认 v1 形态；`version="v2"` 的 `StreamPart`；`subgraphs=True` 才能从子图拿到 messages
- 官方文档: [Letta — Streaming](https://docs.letta.com/guides/agents/streaming) — 默认 step streaming；`stream_tokens=True` 按同一 `id` 重组；SSE `data: [DONE]`
- 标准: [WHATWG HTML — Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html) — `EventSource`、UTF-8、`Last-Event-ID`、按空行分事件、无 pause API
- 官方文档: [FastAPI — StreamingResponse](https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse) — async generator 必须能碰到 `await` 才能取消
- 官方文档: [nginx ngx_http_proxy_module — proxy_buffering](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffering) — 默认 on；`X-Accel-Buffering: yes|no` 可覆盖，除非 `proxy_ignore_headers`；`proxy_read_timeout` 为两次读的间隔
- 源码 / README: [openai-python](https://github.com/openai/openai-python) — streaming 使用 SSE；Chat Completions indefinitely supported；消费 `Stream` 不自动重试
- 源码: [anthropic-sdk-python helpers](https://github.com/anthropics/anthropic-sdk-python) — `messages.stream` / `text_stream` / 退出 context manager 取消 / `stream.close()`（官方站点 HTML 本次未打开）

---

## 修订记录

- 修订（一）2026-10-20：按官方文档 / SDK 源码校准全文，不以仓库原稿为事实。修正 OpenAI Agents SDK 顶层事件名（`response.output_text.delta` 等不在 `event.type`）；LangChain 改为 `stream_events(version="v3")` + `interleave`，LangGraph 标明默认 v1 与 `stream version="v2"` 是另一套命名空间；Letta 补 `stream_tokens=True` 与按 id 重组。纠正把工具等待写成 SSE/HTTP 队头阻塞；澄清 `EventSource` 无 pause、不能 POST，背压来自暂停 `reader.read()`。删除无出处数字（TTFT 区间、8s→0.6s、90%、提前停 15–20% 省 30–50% token、10K+ 并发等）和过时模型名。FastAPI 示例改为 `AsyncOpenAI` + async generator + `X-Accel-Buffering: no`；前端改为 fetch POST、按 `\n\n` 切事件、`AbortController`。nginx 依据官方默认 `proxy_buffering on`。资料来源只保留本次实际打开的链接，去掉 JS LangChain、Anthropic 站、腾讯云 / OpenHelm / NiteAgent 等博客。状态保持“已学习，待四关自测”，校准 ≠ 过四关自测。
