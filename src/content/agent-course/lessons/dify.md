## 一、结论前置

1. **Dify 是开源的 LLM 应用开发平台，用可视化画布把“模型 + 你自己的数据 + 工具”编排成应用，再发布成网页、API 或 MCP Server**。它的能力分三层：①**知识库层**（解析→分块→索引→检索→重排）；②**编排层**（节点式工作流 + Agent 节点/Agent 应用）；③**发布与运营层**（Web App、嵌入、API、MCP、日志、标注回复）。三层在同一平台内闭环，不必自己拼装后端。

2. **它对外的主线只有两种应用类型：Workflow 和 Chatflow，两者共用同一套画布与节点系统，区别在交互形态**。Workflow 从“用户输入或触发器”开始、跑一次给一个结果，结束节点是 Output（可选）；Chatflow 每一轮对话都触发一次流程，必须从用户输入开始、以 Answer 节点结束，并额外支持会话变量与多轮记忆。除此之外还有三种更简单的基础类型：Chatbot、Agent、Text Generator——它们底层同样跑在工作流引擎上，只是界面更轻。

3. **Dify 的“低代码”不等于“没有代码”，它把复杂度转移到了三处可插拔的边界上**：模型供应商以插件形式安装（模型无关，可按节点换模型）、工具与 Agent 策略以插件形式扩展、存储与向量库通过环境变量切换。默认自托管栈是 PostgreSQL + Redis + Weaviate + OpenDAL 本地文件系统，满足试用但不足以承载生产；生产化改造的着力点是持久化、对象存储、向量库独立部署与备份。

4. **它和 LangGraph 不是替代关系而是不同层次**：Dify 交付的是“平台”（含 UI、发布、日志、权限），LangGraph 交付的是“编排库”（含 Checkpoint、Interrupt、时间旅行）。Dify 能把已有流程包成工具供 Agent 调用，也能通过 HTTP 节点调用外部编排服务，所以常见做法是 Dify 做交付面、代码框架做深水区。

---

## 二、通俗类比 + 专业定义

### 通俗类比

#### Dify = AI 应用的“乐高积木平台”

- **可视化工作流 = 乐高底板 + 积木块**：
  - 你有一块大底板（画布），上面可以放各种积木块（节点）
  - 积木块有不同的类型：
    - **模型积木**：调用大模型（“让 AI 想一下”）
    - **知识检索积木**：从知识库找资料（“查一下说明书”）
    - **代码积木**：跑一小段 Python/JavaScript（“算一下这个数”）
    - **条件分支积木**：按条件走不同路径（“是 A 就走左边，是 B 就走右边”）
    - **迭代/循环积木**：遍历一个列表，或反复做到满足条件
    - **HTTP 请求积木**：调外部接口（“查一下天气”）
    - **人工审批积木**：流程暂停，等人填表点“通过”再继续
  - 你把积木拼起来、连上线，就得到一个可运行的“AI 应用”
  - 分支画出来就是并行——同一个节点连出两条线，两条线会同时跑，汇合点能同时读到两边的结果

- **知识库 = 乐高的“说明书库”**：
  - 把文档（PDF、Word、网页、Notion 等）上传进来，Dify 自动解析、切块、建索引
  - 切块有两种档位：**通用**（所有块用同一套参数）和**父子**（小块用来精确命中、命中后把整段父块喂给模型）
  - AI 回答前先去库里查，查到的是你的原文，不是它的记忆——这是压幻觉的主要手段
  - 就像员工遇到问题先翻公司手册，而不是凭印象瞎猜

- **Agent = 乐高的“会自己想办法的机器人”**：
  - 普通工作流是“固定流程”——积木怎么拼就怎么跑
  - Agent 是给一个目标 + 一组工具，它自己决定下一步调哪个工具、调几次
  - 代价是可预测性和成本控制变差：可能多绕几步，也可能跑偏
  - 所以能固定流程的地方就别上 Agent——这条是后面“坑 2”和进阶问题 2 的主线

- **模型供应商 = 乐高的“大脑仓库”**：
  - 模型供应商是**插件**，装哪个用哪个；同一张画布上不同节点可以配不同模型
  - 简单任务配便宜模型、难任务配强模型，是很常见的成本手段
  - 也能接本地推理服务（如 Ollama、llama.cpp），数据不出内网

- **插件与 Marketplace = 乐高的“扩展配件包”**：
  - 内置工具（搜索、网页抓取等）+ Marketplace 上的第三方工具、模型供应商、Agent 策略
  - 想接内部系统？把 OpenAPI/Swagger 导成自定义工具，或写一个工具插件

- **发布 = 把拼好的模型“打包出厂”**：
  - **Web App**：生成一个独立网页，直接给用户用
  - **网站嵌入**：把聊天窗嵌进你自己的站点
  - **Service API**：给后端程序调用
  - **MCP Server**：把应用暴露成 MCP 服务，供 Claude Desktop、Cursor 这类客户端调用（默认关闭，打开后生成的地址里带凭据，要当密钥保管）

- **可观测性 = 乐高的“质量监控系统”**：
  - 使用量、延迟、Token 与成本、错误、对话日志、节点级执行轨迹
  - **标注回复**（Annotation Reply）是它比较特别的一招：把标准答案存成库，用户问到相似问题时直接返回你的答案，绕过模型生成——既是质量兜底，也顺便省了 Token
  - 注意它和“点赞点踩”是两件事：点赞点踩是**反馈信号**，标注回复是**答案缓存**

- **部署方式 = 乐高的“购买方式”**：
  - **Dify Cloud**：托管版，注册即用，按套餐计费
  - **社区版自托管**：Docker Compose 起一套，数据在自己机器上
  - **Dify Premium**：AWS Marketplace 上的 AMI，一键部署进自己的 VPC，可去掉 `Powered by Dify` 标识
  - **Dify Enterprise**：企业版，官方文档明确支持同一应用分环境（staging / production）运行；其余企业治理能力以官方企业版资料为准

### 专业定义

| 概念 | 定义 |
|------|------|
| **Dify** | 开源的 LLM 应用开发平台：可视化编排（工作流/Agent）、内置 RAG 与知识库、可直接发布为 Web App / API / MCP Server，并附带日志与标注等运营能力。 |
| **BaaS** | 后端即服务——把认证、存储、API 等后端能力做成开箱可用，开发者不重复造轮子。Dify 以此自述其平台属性。 |
| **LLMOps** | 大模型应用的运营闭环：开发、发布、日志、评估、标注与持续优化。 |
| **Workflow** | 应用类型之一。从用户输入或触发器开始，跑一次产出结果，结束于 Output 节点（可选）。适合批处理、报表、数据管道。 |
| **Chatflow** | 应用类型之一。每条用户消息触发一次流程，必须从用户输入开始、以 Answer 节点结束；支持会话变量与多轮记忆，可流式输出。 |
| **Chatbot** | 基础类型。Prompt + 知识库的简单对话应用，不带工作流编排。 |
| **Agent（应用）** | 基础类型。自主型智能体，在 Agents 中维护，带自己的沙箱与文件系统，可被工作流复用。早期“模型 + 工具策略”形态的 Agent 应用仍在，属传统形态。 |
| **Text Generator** | 基础类型。单轮文本生成：一个 Prompt + 若干输入变量，一次模型调用出结果。 |
| **Node（节点）** | 画布上的处理单元：模型调用、知识检索、代码、条件分支、迭代、循环、HTTP、工具、人工输入等。单条执行路径最多 50 个节点。 |
| **Knowledge Base（知识库）** | 文档集合 + 索引配置（索引方式、分块模式、Embedding 模型），供检索节点或应用直接引用。 |
| **Index Method（索引方式）** | 知识库建库时选择：**高质量**（Embedding 向量检索）或**经济**（关键词检索）。决定检索能力上限，也决定能否用“父子分块”与“权重设置”。 |
| **Chunk Mode（分块模式）** | **通用**（单层切块）与**父子**（小块命中、父块供上下文）。建库后不可更改。 |
| **DSL** | Dify 用来描述应用的 YAML 格式，覆盖节点、Prompt、变量与设置，不含日志与知识库数据。导入即重建应用。 |
| **App Package（.ifpkg）** | 新版导出产物：一个 ZIP 包，内含 DSL 文件（`app.yaml`）与应用所需文件（图标、Agent 的技能与文件）。 |
| **Annotation Reply（标注回复）** | 人工维护的问答库。开启后先做语义匹配，命中阈值即直接返回预置答案，未命中才走模型生成。 |
| **MCP Server（发布侧）** | 把 Dify 应用暴露为 MCP 服务的能力，在应用“访问入口”页开启，生成的 URL 内含凭据。 |
| **Plugin（插件）** | 扩展机制，涵盖模型供应商、工具、Agent 策略、数据源、触发器。经 Marketplace 分发。 |
| **Trigger（触发器）** | 让 Workflow 自动运行：定时、Webhook 或插件事件。Chatflow 不支持触发器。 |
| **Human Input（人工输入）** | 让流程在某一步暂停、发出表单请求、等人提交后按所选动作分支继续，可配超时策略。 |
| **OpenDAL** | Dify 默认的文件存储抽象层，通过 `OPENDAL_SCHEME` 选择本地文件系统、S3、GCS、Azure Blob 等后端。 |

---

## 三、底层机制

### 一、整体架构

```
┌────────────────────────────────────────────────────────────┐
│                       Dify 平台架构                        │
├────────────────────────────────────────────────────────────┤
│  前端（Next.js Web UI）                                    │
│  • 应用/Agent 管理  • 工作流画布  • 知识库  • 日志与标注   │
│                        ↓ HTTP / SSE                        │
│  后端 API（Python + Flask + Gunicorn）                     │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ 应用服务 │ 工作流   │ 知识库   │ 模型网关 │ 工具     │  │
│  │          │ Graph    │ RAG      │          │ 插件调度 │  │
│  │          │ Engine   │ Pipeline │          │          │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│           ↓ Celery 异步任务（索引、清理、批量）            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 插件运行时（模型/工具/策略） · 代码沙箱 · SSRF 代理 │   │
│  └─────────────────────────────────────────────────────┘   │
│                             ↓                              │
│  数据层                                                    │
│  PostgreSQL（应用元数据、日志）  Redis（缓存/队列）        │
│  向量库（weaviate 默认，可切换）  对象/文件存储（OpenDAL） │
└────────────────────────────────────────────────────────────┘
```

一个容易记错的点：后端是 **Flask + Gunicorn**，不是 FastAPI；异步任务走 Celery，代码执行走独立沙箱容器，沙箱的对外请求经 SSRF 代理出网。

#### 请求处理流程

```
用户 / 外部系统
    ↓
入口：Web App · 嵌入窗口 · Service API · MCP 客户端
    ↓
鉴权（API Key）+ 会话管理（对话类应用才有 conversation_id）
    ↓
Workflow / Chatflow Graph Engine
    ├── 按边遍历节点（条件分支、迭代、循环、并行分叉）
    ├── 填充 Prompt 变量
    ├── 检索知识库（可选）→ 拼进 LLM 的 Context
    ├── 调工具 / 插件 / Agent 节点
    └── 人工输入节点（命中时挂起，等表单提交后按动作继续）
    ↓
模型网关 → 具体模型供应商（含 Token 计量）
    ↓
输出（Workflow: Output 节点；Chatflow: Answer 节点流式返回）
    ↓
写日志（对话日志 + 节点级执行轨迹）→ 可在后台回看与标注
```

### 二、五种应用类型

| 应用类型 | 怎么跑（入口 → 出口） | 适用场景 |
|---|---|---|
| **Workflow** | 用户输入或触发器 → Output（可选），跑一次 | 报表生成、数据处理、批量任务、定时同步 |
| **Chatflow** | 每轮用户消息 → Answer（必需），多轮 | 客服、流程引导、多分支多轮交互 |
| **Chatbot** | 单轮对话 → 回答，无编排 | FAQ、轻量问答 |
| **Agent** | 目标输入 → 自主决策 + 工具调用 → 答复 | 探索型任务、动态选工具 |
| **Text Generator** | Prompt + 变量 → 一次模型调用 → 文本 | 翻译、摘要、文案、SQL 生成 |

#### Workflow vs Chatflow

```
Workflow：输入 → 流程（可多分支/迭代）→ Output
（一次性任务，如"生成一份市场分析报告"）

Chatflow：用户消息 → 流程 → Answer（流式）
              ↑                 │
              └── 会话变量 / 多轮记忆 ┘
（对话型任务，如"客服机器人，用户可追问"）
```

两者的硬边界：

- **起点不同**：Workflow 可以用触发器自动跑；Chatflow 永远从用户消息开始，不支持触发器。
- **终点不同**：Workflow 用 Output 节点（可选）；Chatflow 必须用 Answer 节点，否则前端拿不到回复。
- **可互换性有限**：Workflow 不能接收 Answer 节点，Chatflow 不能接收 Output 与触发器节点——导入 DSL 时会被拒。

### 三、工作流节点

#### 节点清单（按用途分组）

| 分组 | 节点 | 作用 |
|---|---|---|
| 入口 | **用户输入** | 定义应用输入变量；提供 `sys.user_id`、`sys.app_id` 等系统变量（Chatflow 另有 `sys.conversation_id`、`sys.dialogue_count`） |
| 入口 | **触发器** | 定时 / Webhook / 插件事件自动启动 Workflow |
| 模型 | **LLM** | 调模型，可挂 Context、可开 Vision、可切模型参数 |
| 模型 | **Agent（经典）** | 带策略的自主工具调用，作为流程中的一步 |
| 模型 | **Agent（新版，beta）** | 把一个 Agents 里的 Agent 当作一步执行，仅 Workflow 支持 |
| 知识 | **知识检索** | 从一个或多个知识库检索，输出 `result` 变量 |
| 知识 | **知识索引 / 数据源** | 知识管道（Knowledge Pipeline）里构建索引与接入数据源 |
| 处理 | **代码** | 沙箱内跑 Python / JavaScript |
| 处理 | **HTTP 请求** | 调外部 API |
| 处理 | **模板转换** | 用 Jinja2 渲染字符串 / HTML，输出上限 40 万字符 |
| 处理 | **文档提取** | 从上传文件里抽文本 |
| 处理 | **列表操作** | 过滤、排序、取值等列表运算 |
| 工具 | **工具** | 调用已配置的工具、插件工具、工作流工具、MCP 工具 |
| 控制 | **条件分支（IF/ELSE）** | 按条件走不同分支 |
| 控制 | **迭代** | 遍历数组，对每个元素跑一遍子流程 |
| 控制 | **循环** | 反复执行直到满足退出条件 |
| 控制 | **问题分类** | 用模型把输入归到预设类别 |
| 控制 | **参数提取** | 用模型从文本里抽结构化字段 |
| 变量 | **变量赋值** | 写入会话变量或环境变量 |
| 变量 | **变量聚合** | 把多个分支的输出合并成一个变量 |
| 人工 | **人工输入** | 挂起流程、发请求表单、按所选动作分支继续 |
| 出口 | **Answer** | Chatflow 的回复出口，支持流式 |
| 出口 | **Output** | Workflow 的结果出口 |

两个高频误解：

- **没有“并行节点”**。并行是把同一个节点的输出连到多个下游节点，引擎会同时执行；汇合处的下游节点可以同时读到各分支的输出，但并行分支之间互相读不到对方变量。
- **迭代 ≠ 循环**。迭代是“对列表里每个元素做一遍”，次数由数据长度决定；循环是“做到条件成立为止”，次数由条件决定。

#### 控制流示意

```
用户输入 → 问题分类 → 条件分支
                        ├── 产品咨询 → 知识检索 → LLM → Answer
                        └── 技术支持 → HTTP（建单）→ 迭代（逐条补附件）→ LLM → Answer
```

### 四、知识与 RAG

#### 建库时要定的三件事

1. **索引方式**：高质量（Embedding，向量检索）或经济（倒排索引，关键词检索）。单向门：经济可以升级为高质量，高质量不能降级为经济；父子分块只在高质量下可用。
2. **分块模式**：通用或父子。**建库后不可更改**；分隔符、最大块长度、重叠可以在建库后继续调。
3. **Embedding / Rerank 模型**：换 Embedding 模型会导致全量重算向量，是代价较高的一次性操作。

#### 分块参数的真实含义

- **分隔符**：按什么字符切。分隔符本身会被丢弃，所以要选文中不常出现的字符。
- **最大块长度**：单位是**字符**，超过就强制切断，不管分隔符。
- **重叠**：相邻块之间重复多少字符，用来防止关键信息正好被切断。
- **父子模式**：父块可以是“按段落切”或“整篇文档当父块”。整篇当父块时**只处理前 10,000 个 token**，超出部分会被截断，且父块创建后不可编辑，只能重新上传文档。

#### 文本预处理（建库时可选）

- 三个以上连续换行压成两个换行；多个空格压成单个；制表符、换页符、特殊 Unicode 空格转普通空格
- 去掉所有 URL 与邮箱地址（“整篇文档当父块”模式下此项失效）

#### 检索配置是两层的

检索能力取决于索引方式，先分清两种模式：

- **高质量**：三种检索策略可选——向量检索、全文检索、混合检索。父子分块、权重设置只在此模式可用。
- **经济**：只有倒排索引一条路，只支持 Top K，没有重排与阈值。

知识库层先定初始候选池，检索节点（或应用）层再二次收窄：

| 参数 | 作用 | 要点 |
|---|---|---|
| **权重设置** | 语义与关键词的相对权重（属混合检索） | 不需要重排模型即可用；权重取 1/0 即退化为纯语义或纯关键词 |
| **Rerank 模型** | 对候选结果重新打分排序 | 有视觉知识库时需同时选多模态重排模型，否则图片会被排除 |
| **Top K** | 返回的结果条数 | 文档默认 3；选了重排模型时会按模型上下文窗口自动下调 |
| **Score Threshold** | 最低相似度，低于即丢弃 | 文档默认 0.5；调高更严、调低更松 |
| **元数据过滤** | 只在指定文档范围内检索 | 手动或自动；大库、多语境时收益明显 |

一个容易漏的前提：**Top K 与阈值只在启用重排时才生效**。不配重排模型就只改 Top K，等于没改。

补充：知识检索节点支持多知识库同时检索后合并；知识库若用多模态 Embedding（带 Vision 标记），可以用图片作为查询（单图 ≤ 2MB），结果变量里会多出 `files` 字段。

#### 向量库与文件存储：默认值容易记错

| 项 | 默认值 | 说明 |
|---|---|---|
| `VECTOR_STORE` | **`weaviate`** | 不是 Qdrant。Docker Compose 会按该值自动拉起对应容器（`COMPOSE_PROFILES`） |
| `STORAGE_TYPE` | **`opendal`** | 默认 `OPENDAL_SCHEME=fs` 走本地文件系统；`local` 已弃用，内部就是 OpenDAL 的 fs 方案 |

向量库取值官方维护了一份长清单，覆盖 weaviate、qdrant、milvus、pgvector、opensearch、elasticsearch、tidb、oracle、tencent、oceanbase、couchbase、analyticdb 等，完整清单以文末环境变量文档为准（取值拼写严格按清单，例如 `pgvecto-rs`、`tidb_on_qdrant`）。

### 五、Agent 能力

#### 经典 Agent 节点：模型 + 工具 + 策略

```
用户任务
    ↓
模型按策略推理（Function Calling 或 ReAct）
    ↓
需要工具？
    ├── 是 → 选工具 → 执行 → 结果回填上下文 → 继续推理
    └── 否 → 直接给最终答复
    ↓
循环，直到完成或撞到 Max Iterations
```

- **策略**：Function Calling（把工具定义通过 `tools` 参数交给模型，靠模型原生能力调用）与 ReAct（用结构化 Prompt 走“思考→行动→观察”，适合不支持函数调用或需要显式推理链的模型）。更多策略从 **Marketplace → Agent Strategies** 安装。
- **执行控制**：Max Iterations 是防死循环的硬闸，官方建议简单任务 3–5 轮、复杂研究类 10–15 轮；Memory 控制记忆多少条历史消息（TokenBufferMemory），窗口越大越贵。
- **输出**：最终答复、每次工具调用的输出、推理轨迹（ReAct 下更完整）、迭代次数、成功状态、Agent 日志。

#### 新版 Agent：带沙箱的“长期员工”

新版 Agent 在 **Agents** 里维护，有自己的沙箱与文件系统（可以在 Build 模式里装程序、写文件），能力集中管理、可被多个工作流复用。工作流里的新版 Agent 节点（beta，仅 Workflow）只是“派活”——节点上写这一步的任务，把上游变量（纯文本部分截断在 2,000 字符）交给它，需要长内容就走文件；返回值默认只有 `text`，其余输出要在任务里显式声明。

注意隔离性：两个节点邀请同一个 Agent，各自从保存的配置出发、在各自沙箱里跑，一个节点写的文件不会流到另一个节点。

### 六、模型与插件

- **模型供应商是插件**：在“集成 → 模型供应商”里安装，装完填凭据即可；官方不承诺一个固定数量，实际可用清单以 Marketplace 当前列表为准。
- **模型无关**：应用里配置的是“供应商 + 模型名”，换模型不改流程；不同节点可以配不同模型。
- **插件类型**：模型供应商、工具、Agent 策略、数据源、触发器。工具既可以是内置的，也可以是自定义（导入 OpenAPI/Swagger）、工作流工具、MCP 工具。

### 七、发布与集成

| 方式 | 说明 | 适用 |
|---|---|---|
| **Web App** | 独立页面，可配标题、图标、主题 | 直接给最终用户 |
| **网站嵌入** | 生成嵌入代码或 iframe | 站点客服、帮助中心 |
| **Service API** | 带 API Key 的 HTTP 接口 | 后端、移动端、第三方系统 |
| **MCP Server** | 在“访问入口”页开启，生成专属 URL | Claude Desktop、Cursor 等 MCP 客户端 |
| **应用市场模板** | 发布为模板供他人安装 | 团队内复用、生态分发 |

MCP Server 默认关闭；开启后生成的 URL 里带认证凭据，等同于 API Key，怀疑泄露就用重新生成按钮换掉（旧地址立即失效）。

Service API 的主要端点：

| 端点 | 用途 |
|---|---|
| `POST /v1/chat-messages` | 对话类应用（Chatbot / Agent / Chatflow）发消息，`response_mode` 支持 `streaming` / `blocking` |
| `POST /v1/workflows/run` | 运行 Workflow，返回 `data.outputs` |
| `GET /v1/messages` | 拉取某会话的历史消息 |
| `POST /v1/messages/{message_id}/feedbacks` | 提交点赞/点踩反馈 |
| `POST /v1/files/upload` | 上传文件供多模态输入使用 |

### 八、可观测性与标注回复

#### 监控与日志

- 消息数、用户数、会话数；平均与分位延迟；Token 与成本；错误率与错误类型
- 对话日志：每轮的用户输入、模型输出、引用到的知识库片段、调用的工具、耗时、Token
- 节点级轨迹：Workflow / Chatflow 每次运行可以看到每个节点的输入输出，这是排障的第一现场

#### 标注回复（Annotation Reply）

不是“给人看的标注”，而是**可命中的答案库**：

```
用户提问
    ↓
在标注库里做语义匹配（用配置的 Embedding 模型）
    ├── 匹配分数 ≥ 阈值 → 直接返回预置答案（省一次模型调用）
    └── 未命中 → 走正常生成流程
```

- 开关在“编排 → 添加功能”里；要配相似度阈值与 Embedding 模型，换模型会重算全部向量
- 三种录入方式：从日志里把回答改成标准答案、按模板批量导入问答对、在标注页手工新增
- 可看命中率、命中相似度、哪些标注从未被命中（后者就该清理或补内容）

#### 反馈信号

用户在 Web App 上点👍/👎，走 `feedbacks` 接口落到日志里。它提供的是“这条回答好不好”的信号，与“下次这个问题直接答什么”是两件事——别把两者混为一谈。

---

## 四、最小可运行示例

### 示例一：把应用当代码管（DSL）

Dify 的应用可以导出成 DSL（YAML）描述，进 Git、走 Code Review。导出产物有两种形态：

| 形态 | 内容 | 适用 |
|---|---|---|
| `.yml`（早期版本导出） | 单个 DSL 文件 | 旧版本 Dify |
| `.ifpkg`（Dify 1.18.0 起） | ZIP 包，内含 `app.yaml` + 图标 + Agent 的技能与文件 | 新版本 |

DSL 的顶层结构大致长这样（画布坐标等字段已略，字段随 DSL 版本演进，以实际导出为准）：

```yaml
version: "0.1.5"        # DSL 版本（示例值，实际以导出文件为准）；导入时会做兼容性检查
kind: app
app:
  name: "产品客服助手"
  mode: advanced-chat   # workflow / advanced-chat / chat / agent-chat / agent / completion
  icon: "💬"
  icon_background: "#FFEAD5"
  description: "基于知识库的产品客服机器人"
workflow:
  graph:
    nodes: []           # 每个节点含 id / data.type / data.title 与节点自身配置
    edges: []           # 每条边含 source / target / sourceHandle / targetHandle
  environment_variables: []
  conversation_variables: []   # 仅 Chatflow 有
dependencies: []        # 依赖的插件（模型供应商、工具等）
```

手写 DSL 不划算，正确姿势是用官方 `difyctl` 做导出→校验→导入→发布（以下命令取自官方文档）：

```bash
# 先把两个 ID 放到变量里，命令里就不出现尖括号占位符
export APP_ID="你的应用 ID"
export TARGET_VERSION_ID="要回滚到的版本 ID"

# 导出线上版本到 order-status.yml（导出时密钥默认留空）
V=$(difyctl get console_app version --app-id "$APP_ID" | jq -r '.data[] | select(.current) | .id')
difyctl export console_app dsl --app-id "$APP_ID" --workflow-id "$V" | jq -r .data > order-status.yml

# 校验：valid 为 true 才会被导入接受；warning 不影响导入（通常是缺凭据或模型）
difyctl check console_app dsl --app-id "$APP_ID" --yaml-content "$(cat order-status.yml)"

# 导入：先取 draft_hash，导入时带上，防止覆盖别人同时期的改动
H=$(difyctl export console_app dsl --app-id "$APP_ID" | jq -r .draft_hash)
difyctl import console_app dsl --mode yaml-content --yaml-content "$(cat order-status.yml)" \
  --app-id "$APP_ID" --draft-hash "$H"

# 试跑草稿、检查发布就绪、发布、必要时回滚
difyctl test console_app workflow --app-id "$APP_ID" --inputs '{"topic": "order 1042"}'
difyctl check console_app release --app-id "$APP_ID"
difyctl publish console_app --app-id "$APP_ID" --marked-name v2
difyctl restore console_app version --app-id "$APP_ID" --version-id "$TARGET_VERSION_ID"
```

几个必须知道的约束：

- **只有 Workflow 和 Chatflow 能从文件更新**，其他类型只能“从文件新建”
- 导入会**替换草稿**（含未发布的改动），但不影响已发布版本，直到你 Publish
- 应用的名称、描述、图标、Web App 设置一旦导入就立即对外生效，**不需要发布**
- 导出默认清空密钥值；`--include-secret` 会把明文写进文件，别进 Git

### 示例二：用 Python 调 Service API

所需环境变量（不写死密钥）：

```bash
export DIFY_BASE_URL="https://api.dify.ai/v1"   # 自托管改成 https://你的域名/v1
export DIFY_API_KEY="app-xxxxxxxx"              # 应用「访问 API」页生成
export DIFY_USER="user-001"                     # 终端用户标识，用于区分会话
```

```python
"""Dify Service API 最小客户端：对话（流式）+ 工作流 + 反馈。

依赖：pip install requests
必须配置的环境变量：DIFY_BASE_URL / DIFY_API_KEY / DIFY_USER
"""

import json
import os
import requests

class DifyClient:
    """封装 Dify Service API 的三个常用动作。"""

    def __init__(self) -> None:
        self.base_url = os.environ["DIFY_BASE_URL"].rstrip("/")
        self.api_key = os.environ["DIFY_API_KEY"]
        self.user = os.environ.get("DIFY_USER", "user-001")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def chat(self, query: str, conversation_id: str = "") -> dict:
        """对话类应用：流式接收，逐段打印，最后返回完整答案与新会话 ID。

        SSE 事件里，`message` 携带增量文本，`message_end` 携带本轮元信息
        （含 conversation_id、用量），据此把上下文串到下一轮。
        """
        payload = {
            "inputs": {},
            "query": query,
            "response_mode": "streaming",
            "conversation_id": conversation_id,  # 空串表示新会话
            "user": self.user,
        }
        answer, conv_id, message_id = "", conversation_id, ""

        with requests.post(
            f"{self.base_url}/chat-messages",
            headers=self.headers,
            json=payload,
            stream=True,
            timeout=120,
        ) as resp:
            resp.raise_for_status()
            for raw in resp.iter_lines():
                if not raw:
                    continue
                line = raw.decode("utf-8")
                if not line.startswith("data: "):
                    continue
                event = json.loads(line[6:])
                if event.get("event") == "message":
                    chunk = event.get("answer", "")
                    answer += chunk
                    print(chunk, end="", flush=True)
                elif event.get("event") == "message_end":
                    conv_id = event.get("conversation_id", conv_id)
                    message_id = event.get("message_id", "")

        print()
        return {"answer": answer, "conversation_id": conv_id, "message_id": message_id}

    def run_workflow(self, inputs: dict) -> dict:
        """Workflow 应用：用 blocking 模式换取一次性结果，取 data.outputs。"""
        payload = {"inputs": inputs, "response_mode": "blocking", "user": self.user}
        resp = requests.post(
            f"{self.base_url}/workflows/run",
            headers=self.headers,
            json=payload,
            timeout=300,
        )
        resp.raise_for_status()
        return resp.json().get("data", {}).get("outputs", {})

    def feedback(self, message_id: str, rating: str, content: str = "") -> dict:
        """对某条回答点赞/点踩（rating 取 like 或 dislike）。"""
        resp = requests.post(
            f"{self.base_url}/messages/{message_id}/feedbacks",
            headers=self.headers,
            json={"rating": rating, "user": self.user, "content": content},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()

if __name__ == "__main__":
    client = DifyClient()

    first = client.chat("你们的产品有哪些功能？")
    # 带上 conversation_id 才有上下文，否则每次都是新会话
    second = client.chat("价格是多少？", conversation_id=first["conversation_id"])

    # inputs 的键必须与工作流「用户输入」节点里定义的变量名一致，否则接口返回 400
    outputs = client.run_workflow({"topic": "AI Agent", "length": "1000字"})
    print("工作流输出：", outputs)

    if second["message_id"]:
        client.feedback(second["message_id"], "like", "回答准确")
```

---

## 五、易混概念对比

### Dify vs LangChain / LangGraph

| 维度 | Dify | LangChain / LangGraph |
|---|---|---|
| 定位 | 低代码应用平台 | 代码框架 / 编排库 |
| 使用方式 | 画布拖拽 + 配置 | 写 Python / JS |
| 灵活性 | 受平台节点与功能边界限制 | 完全自定义 |
| RAG | 内置完整链路与知识库管理 | 需要自己组装组件 |
| Agent | 内置 Agent 应用/节点与策略插件 | LangGraph 提供状态图级编排 |
| 可观测性 | 内置日志、成本、标注 | 依赖 LangSmith 等外部平台 |
| 交付成本 | 一键发布 Web/API/MCP | 需自建后端与部署 |
| 深水区能力 | 受节点模型限制（如单路径 50 节点、节点内部无法下断点） | Checkpoint、Interrupt、时间旅行等一等公民 |

### Workflow vs Chatflow

| 维度 | Workflow | Chatflow |
|---|---|---|
| 触发 | 用户调用或触发器（定时/Webhook/插件事件） | 每条用户消息 |
| 会话状态 | 无 | 有（`sys.conversation_id`、会话变量） |
| 出口节点 | Output（可选） | Answer（必需） |
| 流式输出 | 不适用 | 支持逐段输出文本、图片、文件 |
| 典型场景 | 报表、批处理、定时任务 | 客服、引导式问答 |

### 选型三问

1. **需要多轮对话吗？** 不需要 → Workflow；只是“一次输入一次输出”且不需要分支编排 → Text Generator。
2. **路径能预先定下来吗？** 能 → 用画布（Workflow / Chatflow）；定不下来、要模型自己决定下一步 → Agent。
3. **需要工具调用吗？** 需要但调用顺序固定 → 工作流里放工具节点；调用顺序由模型决定 → Agent 节点或 Agent 应用。

三问都答完后还剩一个易混项：Chatbot。它是“Prompt + 知识库 + 对话”，没有编排能力，只在“单轮或简单多轮 FAQ、不需要分支与工具”时才选它；一旦需要条件分支、工具或迭代，就该回到 Workflow / Chatflow。

---

## 六、3个实战中的常见坑

### 坑 1：一套分块参数打天下——检索要么命中不全，要么塞一堆无关内容

**现象**：技术手册里的代码块被切成两半、制度文件切得太碎丢上下文、FAQ 被拆成好几块反而增加噪音、网页的导航和页脚也进了索引。团队以为是 Embedding 模型不行，换了两三个模型依旧——根因在分块与预处理，不在模型。

#### 避坑

- **先想清楚“命中单元”是什么**：检索的基本单位就是块。代码要整段命中、条款要整条命中、问答要整条命中，块的大小就该按这些单元来定，而不是照抄一个默认值。
- **分块模式在建库时定生死**：通用模式适合 FAQ、术语表这类自包含内容；父子模式适合信息密度高的技术手册与研究报告——小块负责精准命中，返回时把父块整段交给模型补上下文。模式**建库后不可改**，改只能重建库。
- **整篇当父块有硬上限**：父块用“整篇文档”时只处理前 10,000 个 token，超出的内容会被静默截断；且父块不可编辑，要改只能重传文档。
- **预处理先做掉噪声**：建库时开启“合并连续空格/换行/制表符”和“去掉 URL 与邮箱”，能显著减少导航栏、页脚这类垃圾块；更复杂的清洗（去页眉、去目录页）要在上传前自己处理。
- **检索参数按“两层”调**：知识库层决定候选池，节点层再做重排与收窄。权重设置属混合检索，只在全部知识库都是高质量索引时可用；Top K 与阈值又只在**启用重排后**才生效——不配重排模型就改 Top K，等于没改。
- **用元数据过滤收窄范围**：大库里混着多个业务线的内容时，先按元数据圈定文档范围，比一味调阈值有效。
- **量化验证**：准备一批覆盖各类问题的测试题，人工标注“应该引用哪几个文档”，改动参数后跑同一批题看命中情况，再决定上线。

- **类比**：切菜。炒肉丝要切细、炖牛肉要切大块、拌黄瓜可以不切——块的大小取决于这道菜，不取决于刀。分块同理，取决于文档形态与检索单元。

### 坑 2：工作流画得太复杂——节点堆到几十个，出问题找不到现场，改一行要读懂全图

**现象**：一个“智能客服”被画成三十多个节点：五类问题分类，每类各有独立处理链，链里又嵌条件分支和迭代。结果是调试靠猜、改一处要通读全图、串行执行慢、变量未定义与类型错配频发。团队归因于“Dify 工作流不好用”，实际是过度设计。

#### 避坑

- **先按“能不能删”做减法**：合并同类 LLM 节点、把多层 if-else 收进一个代码节点、把独立处理链拆成子流程。节点数是最直观的复杂度指标。
- **注意硬上限**：单条执行路径最多 50 个节点。撞上限说明拆分方式该换了，别硬凑。
- **条件分支超过三层就别画了**：复杂判断、数据转换、字段计算放代码节点，可读性和性能都更好。
- **把重复流程封装成“工作流工具”**：主流程负责调度，子流程负责具体处理，子流程能独立测试与复用。
- **流程不固定时才换 Agent**：Agent 更灵活，但可预测性与成本控制更差。给 Agent 设 Max Iterations、限定工具范围，别让它自由发挥。
- **调试靠节点级轨迹**：每次运行都能看每个节点的输入输出，先定位“哪个节点输出不对”，再往回追，不要从头通读。
- **给节点起名字**：`问题分类`、`产品知识检索`、`生成回答`，而不是 `LLM 1`、`条件分支 2`。复杂流程另写一页说明各节点职责与变量流向。
- **性能先看串行链**：每个 LLM 节点都是几百毫秒到几秒，能并行就并行（同源分支），能用便宜模型就用便宜模型。
- **别把高频固定问题交给生成**：这类问题用标注回复做快速通道，既稳又省 Token。

- **类比**：写代码。一个函数一千行、嵌套十层 if-else，谁都维护不了；拆函数、减嵌套、起好名字，才叫工程。

### 坑 3：生产环境照抄快速启动——数据丢了、文件传不上、检索变慢

**现象**：按快速启动起了一套 Docker Compose（默认 Weaviate + OpenDAL 本地文件系统），跑一段时间后：重启丢索引、大文件上传失败、多机部署时文件不同步、备份不知道该备哪几处、检索随着数据量涨而变慢。归因是“自托管太麻烦”，实际是**快速启动只适合验证，生产要另配**。

#### 避坑

#### 1. 认清默认值

- `VECTOR_STORE` 默认是 `weaviate`，`STORAGE_TYPE` 默认是 `opendal`（`OPENDAL_SCHEME=fs`，即本地文件系统）。这两个默认值都是“能跑起来”，不是“能扛住”。
- 切换向量库时，`COMPOSE_PROFILES` 会按 `VECTOR_STORE` 自动拉起对应容器；若数据集已有索引，以数据集自身记录的存储类型为准。

#### 2. 每一份有状态数据都要单独考虑

| 组件 | 生产要点 |
|---|---|
| PostgreSQL | 数据卷持久化；建议用托管实例；定期 `pg_dump`；高并发配连接池 |
| Redis | 缓存 + Celery 队列，配持久化与密码/网络隔离；建议托管 |
| 向量库 | 独立部署或托管，别与 API 抢同一台机器；配资源上限与快照备份 |
| 文件存储 | 换成 S3 兼容或云对象存储（`STORAGE_TYPE` 可选 `s3`、`aliyun-oss`、`tencent-cos`、`azure-blob`、`google-storage` 等），或多服务器共享的 OpenDAL 后端 |

#### 3. 对象存储用 OpenDAL 配置

默认走 OpenDAL，Dify 会自动扫描 `OPENDAL_<SCHEME>_*` 形式的变量。以 S3 为例：

```bash
STORAGE_TYPE=opendal
OPENDAL_SCHEME=s3
# 其余凭据按 OPENDAL_S3_* 命名，具体键名以官方环境变量文档为准
```

不要停留在本地文件系统上多机部署——A 机传的文件 B 机读不到，是这类部署最经典的故障。

#### 4. 入口与超时

- 前置反向代理做 HTTPS；调大请求体上限（大文件上传）、调长读超时（工作流可能跑很久）
- 代码执行走沙箱容器，沙箱的对外请求经 SSRF 代理，这两条链路要单独放行与限流

#### 5. 备份与升级

- 备份对象是四份：PostgreSQL、向量库快照、对象存储、Redis（如需）。备份要落到独立位置，并定期做恢复演练。
- 升级前读 Release Notes，先备份 `.env`、`envs/`、`volumes/`；在测试环境验证后再动生产；保留回滚方案。

#### 6. 监控与告警

- 先跑基线，再定阈值。没有基线就设“响应时间 > 5s 告警”这类数字，只会制造噪音。
- 至少覆盖：API 延迟与错误率、PostgreSQL 连接数与慢查询、向量库查询延迟、Redis 内存、磁盘使用率。

- **类比**：快速启动是毛坯房，能住但不适合久住；生产配置是精装修——地基（数据库）、储物间（对象存储）、书房（向量库索引）都得按用途规划，还要有安防（监控）与保险（备份）。

---

## 七、进阶问题

### 问题 1：Dify 的画布和 LangGraph 的状态图，各自适合什么场景？能结合吗？

#### 引导思考

- **画布（Dify）的本质**：把流程表达为“节点 + 边”的可视图，节点类型由平台预定义，配置代替编码。收益是上手快、易沟通、一键发布；代价是表达力受节点边界约束（单路径 50 节点、节点内部无法下断点、复杂状态管理要靠会话变量硬撑）。
- **状态图（LangGraph）的本质**：State + Node + Edge 全在代码里，节点是任意函数、边是任意判断函数，Checkpoint / Interrupt / 时间旅行是一等公民。收益是表达力与可调试性；代价是要自己搭后端、发布、观测。

- **决策顺序**（从上往下问，命中即停）：

```
需要非技术同事参与编辑或验收？ → 是 → Dify
需要几分钟内出可演示原型？     → 是 → Dify
需要平台级产出（Web App/API/MCP/日志/权限）？ → 是 → Dify
需要长时运行 + 中途存档恢复？  → 是 → LangGraph
需要节点内部级断点/时间旅行/复杂状态？ → 是 → LangGraph
两者都不强烈？ → 选团队更熟的那个
```

- **三种结合方式**：

| 方式 | 分工 | 代价 |
|---|---|---|
| Dify 前置、LangGraph 在 HTTP 节点后面 | 交付面与复杂算法分离 | 多一跳网络、错误要跨系统追 |
| LangGraph 编排、Dify 应用当工具 | 借 Dify 的 RAG 与知识库管理 | Dify 侧要暴露稳定的 Service API |
| Dify 做 MVP、验证后迁 LangGraph | 先验证需求再投工程 | 迁移不是重写画布，是重新实现逻辑 |

- **类比**：建站工具 vs 手写前端。官网用建站工具，核心交易系统手写——不是二选一，而是按位置分配。

### 问题 2：Agent 和工作流怎么权衡？边界划在哪里？

#### 引导思考

- **本质差异**：工作流是“路径预先确定，模型只在节点内做局部判断”；Agent 是“路径由模型在运行时决定”。前者可控可审计，后者能处理未预见情况。

| 维度 | 工作流 | Agent |
|---|---|---|
| 路径 | 预先定义 | 运行时决定 |
| 可预测性 | 高 | 低 |
| 成本 | 可估算（固定节点数） | 波动（迭代次数不定） |
| 审计 | 每步可追溯 | 需要额外的轨迹记录 |
| 适合 | 流程明确、重复、需合规 | 探索型、工具选择动态、多轮试错 |

- **四个该用 Agent 的信号**：任务边界本身不清、要调的工具取决于中间结果、需要“试—失败—再试”、用户话题随时切换。
- **四个该用工作流的信号**：流程固定且重复、成本与质量要严格控制、需要合规审计、高风险动作（转账、删除、对外发送）必须卡在固定节点上。
- **三档混合模式**：

| 模式 | 结构 | 适用 |
|---|---|---|
| 工作流为主、Agent 为节点 | 外层画布控制，局部放 Agent 节点 | 大部分生产客服、内容生产 |
| Agent 为主、工作流为工具 | Agent 决策，调封装好的工作流工具 | 研究型 Agent、报告生成 |
| 分层 | 上层调度，下层按复杂度分派 | 任务类型差异大的平台 |

- **权衡原则**：能用工作流就不用 Agent；必须用 Agent 时，用 Max Iterations、工具白名单、成本上限把自主性圈起来；高风险动作永远留在工作流节点上。

- **类比**：公司管理。报销、生产走 SOP，研发、战略给自主权；没有哪家公司只靠一种。

---

## 八、四关自测

### 复述关（3句话讲清）

1. Dify 是开源的 LLM 应用开发平台，把知识库、可视化编排、发布与运营装进一套系统，用画布拖节点就能建应用，再发布成网页、API 或 MCP Server。
2. 主线是 Workflow 和 Chatflow 两类应用：前者跑一次给一个结果（起点可以是用户输入或触发器，终点是 Output），后者每条消息触发一次流程（必须从用户输入到 Answer，支持会话变量）；另外还有 Chatbot、Agent、Text Generator 三种更简单的基础类型。
3. 它的复杂度收在三个可替换的边界上——模型供应商插件化、工具与策略插件化、存储与向量库靠环境变量切换；默认自托管栈是 PostgreSQL + Redis + Weaviate + OpenDAL 本地存储，够试用不够生产。

### 举例关（真实场景）

公司要做“内部制度问答机器人”，IT 不想从零写后端。用 Dify：把员工手册 PDF、考勤制度、报销规则传进知识库，选高质量索引；制度类文档用父子分块，小块负责命中条款、返回时给整条条款；在画布上拖一条 Chatflow——用户输入 → 知识检索（配 Rerank 与阈值）→ LLM（Context 引用检索结果）→ Answer。发布后拿到 Web App 链接和 API Key，嵌进企业微信。上线两周后，把高频问题（“年假怎么算”）整理成标注回复，命中即返回标准答案，既稳又省 Token。

### 反例关（边界条件）

要做一个跑几小时、中途要存档恢复、还要代码级断点调试、并且深度定制算法的系统——硬用画布搭，会撞上单路径 50 节点的上限，复杂状态只能靠会话变量硬撑，调试只能看节点快照。这种场景该用 LangGraph。另一类错配是**该用工作流的地方硬上 Agent**：客服问答流程本来就固定，却让 Agent 自主探索，结果每轮多调几个工具，成本上升、答案还不稳定。判断顺序是：先问“路径能不能预先定下来”，能定就用工作流；定不下来再上 Agent，并把迭代次数、工具范围、成本上限一起设好。

### 教学关（给小白讲）

以前做 AI 应用像自己装修：画图纸、买材料、请工人——写代码、搭后端、接模型、存知识库全是体力活。Dify 像一个样板间平台：左边放一个“问问题”的框，中间接一个“查资料”的库，右边连一个“AI 回答”的格子，线连上，点发布就能用。麻烦事（怎么查资料、怎么接模型、怎么变成网页）它都内置了。好处是快、不用写代码、非技术同事也能一起改；坏处是它只给你标准格子——要盖造型特别的异形建筑，就得叫工程队（手写代码）。另外它自带一间“标准答案库”，常见问题可以让它直接照答，不必每次现算。

---

## 资料来源

- 官方文档 · 概览（定位与主能力）: [Dify Documentation](https://docs.dify.ai/)
- 官方文档 · 关键概念（应用类型、DSL、变量）: [Key Concepts](https://docs.dify.ai/en/learn/key-concepts)
- 官方文档 · Workflow 与 Chatflow（起点/终点差异）: [Workflow & Chatflow](https://docs.dify.ai/en/cloud/use-dify/build/workflow-chatflow)
- 官方文档 · 编排逻辑（串并行、50 节点上限、迭代与循环）: [Orchestration Logic](https://docs.dify.ai/en/cloud/use-dify/build/orchestrate-node)
- 官方文档 · 文本生成应用: [Text Generator](https://docs.dify.ai/en/cloud/use-dify/build/text-generator)
- 官方文档 · Agent 节点（策略、Max Iterations、输出）: [Agent](https://docs.dify.ai/en/cloud/use-dify/nodes/agent)
- 官方文档 · 人工输入节点（挂起、表单、超时）: [Human Input](https://docs.dify.ai/en/cloud/use-dify/nodes/human-input)
- 官方文档 · 知识检索节点（多库合并、查询图片、元数据过滤）: [Knowledge Retrieval](https://docs.dify.ai/en/cloud/use-dify/nodes/knowledge-retrieval)
- 官方文档 · 索引方式与检索参数（三种检索策略、Top K / 阈值默认值、经济模式限制）: [Specify the Index Method and Retrieval Settings](https://docs.dify.ai/en/cloud/use-dify/knowledge/create-knowledge/setting-indexing-methods)
- 官方文档 · 模板节点（Jinja2、输出上限）: [Template](https://docs.dify.ai/en/cloud/use-dify/nodes/template)
- 官方文档 · 分块配置（通用/父子、字符单位、整篇父块上限）: [Configure the Chunk Settings](https://docs.dify.ai/en/cloud/use-dify/knowledge/create-knowledge/chunking-and-cleaning-text)
- 官方文档 · 知识库数据来源（本地文件、Notion 同步、网页同步）: [Create a Ready-to-Use Knowledge Base](https://docs.dify.ai/en/cloud/use-dify/knowledge/create-knowledge/introduction)
- 官方文档 · 标注回复: [Annotation System](https://docs.dify.ai/en/cloud/use-dify/monitor/annotation-reply)
- 官方文档 · 发布为 MCP Server: [MCP Server](https://docs.dify.ai/en/cloud/use-dify/publish/publish-mcp)
- 官方文档 · 应用导入导出（.ifpkg 与 app.yaml）: [Export and Import Apps](https://docs.dify.ai/en/self-host/use-dify/workspace/export-import-apps)
- 官方文档 · difyctl 管理 DSL: [Create and Update Apps from DSL Files](https://docs.dify.ai/en/cli/create-and-update-apps-from-dsl-files)
- 官方文档 · 自托管环境变量（VECTOR_STORE / STORAGE_TYPE 取值与默认值）: [Environment Variables](https://docs.dify.ai/en/self-host/deploy/configuration/environments)
- 官方文档 · Premium 部署: [Dify Premium on AWS](https://docs.dify.ai/en/self-host/deploy/platform-guides/dify-premium)
- 源码 · 应用类型枚举 `AppMode`: [dify/api/models/model.py](https://github.com/langgenius/dify/blob/main/api/models/model.py)
- 源码 · 节点实现目录: [dify/api/core/workflow/nodes](https://github.com/langgenius/dify/tree/main/api/core/workflow/nodes)
- 源码 · 默认部署配置: [dify/docker/.env.example](https://github.com/langgenius/dify/blob/main/docker/.env.example)
> 来源核验 2026-11-25：全部外链逐一联网核验可访问，论文标题按 arXiv 原文校准；存疑数字保留原文标注。技术结论与官方文档不一致时以官方为准。
