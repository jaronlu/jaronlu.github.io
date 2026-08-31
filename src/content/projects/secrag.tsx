export function SecRAGContent() {
  return (
    <>
      <h2>项目一句话</h2>
      <p>
        SecRAG 是一个面向机构内部投研场景的 Agentic RAG 原型。它不是只做"文档问答"，而是通过服务端身份绑定、角色感知多源检索、ReAct 工具调用、引用与数字验证、合规检查和审计记录，将知识问答组织为一条受约束、可追踪的完整工作流。
      </p>

      <h2>为什么做这个项目</h2>
      <p>证券行业的知识问答场景，检索本身不是最大的难点，真正棘手的是：</p>
      <ul>
        <li>信息分散在研报、公告、法规、财报、内部制度里</li>
        <li>同一问题，投顾 / 机构销售 / 合规 / 运营 / 技术看到的材料权限不同</li>
        <li>数字错了会触发合规风险，引用错了会引发客户投诉</li>
        <li>普通 RAG 系统无法区分"检索到的内容"和"模型脑补的内容"</li>
        <li>问答过程没有审计轨迹，出了问题无法复盘</li>
      </ul>
      <p>
        这个项目想验证的是：能不能把知识库从"文档检索器"升级成结构上可信任的投研助手。答案不靠模型自觉，靠工作流设计把身份、权限、验证、合规、审计变成硬约束。
      </p>

      <h2>系统架构</h2>
      <p>
        系统采用<strong>外层 StateGraph + reason 节点内部 ReAct 子图</strong>的嵌套图架构，不是"提问 → 检索 → 生成答案"一步到位。完整工作流：
      </p>
      <figure className="arch-figure">
        <svg
          viewBox="0 0 820 268"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="SecRAG 核心工作流：Query 经 Planner、Retriever、Reasoner（ReAct 子图）、Verifier、Composer、Auditor 到 Answer，检索不足时回退 Planner，验证失败时回退 Reasoner"
        >
          <defs>
            <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            </marker>
            <marker id="arr-a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
            </marker>
          </defs>
          <style>{`
            .n { fill: none; stroke: var(--line-strong); stroke-width: 1; }
            .n-a { fill: none; stroke: var(--accent); stroke-width: 1.2; }
            .t { font-family: var(--mono); font-size: 12px; fill: var(--ink); }
            .s { font-family: var(--sans); font-size: 10px; fill: var(--muted); }
            .a { font-family: var(--mono); font-size: 10px; fill: var(--accent); font-weight: 600; }
            .l { stroke: var(--ink); stroke-width: 1; fill: none; }
            .la { stroke: var(--accent); stroke-width: 1; fill: none; }
          `}</style>
          <text className="t" x="8" y="128">Query</text>
          <line className="l" x1="52" y1="124" x2="66" y2="124" markerEnd="url(#arr)" />
          <rect className="n" x="70" y="100" width="104" height="48" />
          <text className="t" x="122" y="121" textAnchor="middle">Planner</text>
          <text className="s" x="122" y="138" textAnchor="middle">生成检索计划</text>
          <line className="l" x1="174" y1="124" x2="186" y2="124" markerEnd="url(#arr)" />
          <rect className="n-a" x="190" y="100" width="104" height="48" />
          <text className="t" x="242" y="121" textAnchor="middle">Retriever</text>
          <text className="s" x="242" y="138" textAnchor="middle">按角色权限检索</text>
          <line className="la" x1="242" y1="96" x2="242" y2="76" />
          <text className="a" x="242" y="66" textAnchor="middle">RBAC 权限前置生效</text>
          <line className="l" x1="294" y1="124" x2="306" y2="124" markerEnd="url(#arr)" />
          <rect className="n" x="310" y="100" width="104" height="48" />
          <text className="t" x="362" y="121" textAnchor="middle">Reasoner</text>
          <text className="s" x="362" y="138" textAnchor="middle">ReAct 子图 + 工具</text>
          <line className="l" x1="414" y1="124" x2="426" y2="124" markerEnd="url(#arr)" />
          <rect className="n-a" x="430" y="100" width="104" height="48" />
          <text className="t" x="482" y="121" textAnchor="middle">Verifier</text>
          <text className="s" x="482" y="138" textAnchor="middle">来源 / 数字校验</text>
          <line className="la" x1="482" y1="96" x2="482" y2="76" />
          <text className="a" x="482" y="66" textAnchor="middle">两类校验独立检查</text>
          <line className="l" x1="534" y1="124" x2="546" y2="124" markerEnd="url(#arr)" />
          <rect className="n" x="550" y="100" width="104" height="48" />
          <text className="t" x="602" y="121" textAnchor="middle">Composer</text>
          <text className="s" x="602" y="138" textAnchor="middle">合规检查 + 回答</text>
          <line className="l" x1="654" y1="124" x2="666" y2="124" markerEnd="url(#arr)" />
          <rect className="n" x="670" y="100" width="96" height="48" />
          <text className="t" x="718" y="121" textAnchor="middle">Auditor</text>
          <text className="s" x="718" y="138" textAnchor="middle">会话 + 审计日志</text>
          <line className="l" x1="718" y1="148" x2="718" y2="176" markerEnd="url(#arr)" />
          <text className="t" x="718" y="196" textAnchor="middle">Answer</text>
          <path className="la" d="M 242 148 L 242 224 L 122 224 L 122 152" markerEnd="url(#arr-a)" />
          <text className="a" x="182" y="216" textAnchor="middle">检索不足 → 回退重新规划</text>
          <path className="la" d="M 482 148 L 482 240 L 362 240 L 362 152" markerEnd="url(#arr-a)" />
          <text className="a" x="422" y="232" textAnchor="middle">验证失败 → 重新推理</text>
        </svg>
        <figcaption>核心节点简化图。实际完整工作流还包含：服务端 Bearer token 身份绑定 → 加载会话 → 消解追问 → 查询理解，以及 Composer 节点内的合规检查、Auditor 节点的 SQLite 持久化。Reasoner 内部是一次编译的 ReAct 子图，可动态调用检索、计算器、行情、SQL、财务指标、适当性检查、重排等工具。</figcaption>
      </figure>

      <h2>能力证据矩阵</h2>
      <table>
        <thead>
          <tr>
            <th>能力</th>
            <th>项目中的落点</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>服务端身份验证</td>
            <td>Bearer token 派生用户和角色，不信任请求体中的身份信息；5 种 demo 角色（advisor / institutional_sales / compliance / operations / technical）</td>
          </tr>
          <tr>
            <td>多层检索权限</td>
            <td>Planner、检索执行层和文档 chunk 元数据共同限制可访问的数据源与内容；非公开内容缺少 allowed_roles 时默认拒绝</td>
          </tr>
          <tr>
            <td>Agent 编排</td>
            <td>外层 LangGraph StateGraph + reason 节点内部 ReAct 子图；条件路由、有限重试、明确的拒绝终态</td>
          </tr>
          <tr>
            <td>ReAct 工具调用</td>
            <td>检索、计算器、适当性检查、行情、SQL、财务指标、重排 7 种工具，按角色动态开放</td>
          </tr>
          <tr>
            <td>可信输出</td>
            <td>引用提取 → 来源与数字验证 → 合规检查，三步独立校验后再生成最终响应</td>
          </tr>
          <tr>
            <td>会话与审计</td>
            <td>SQLite 持久化会话、审计记录和入库任务状态；完整审计只在服务端保存，不通过问答接口返回</td>
          </tr>
          <tr>
            <td>增量入库</td>
            <td>稳定文档 ID、内容哈希、版本管理、更新跳过、旧 chunk 清理；支持 --full-scan 归档已删除文档</td>
          </tr>
          <tr>
            <td>Web 前端</td>
            <td>React + Vite + Tailwind + TypeScript 问答与入库 UI，独立于 FastAPI 后端</td>
          </tr>
          <tr>
            <td>容器化部署</td>
            <td>多阶段构建 Dockerfile + docker-compose.yml，精简生产镜像</td>
          </tr>
          <tr>
            <td>评估体系</td>
            <td>检索评估（recall@5/10、MRR、precision@5、覆盖率、权限拦截准确率）、回答评估、端到端评估、合规评估、对话评估、权限冒烟检查</td>
          </tr>
          <tr>
            <td>服务化封装</td>
            <td>FastAPI 完整 REST API：问答接口、会话管理、入库管理、OpenAPI / Swagger UI</td>
          </tr>
        </tbody>
      </table>

      <h2>技术亮点</h2>
      <ul>
        <li>
          <strong>服务端身份绑定</strong>：所有接口要求 Authorization: Bearer token，服务端根据 token 派生用户和角色，不信任客户端传入的身份信息
        </li>
        <li>
          <strong>嵌套图架构</strong>：外层 StateGraph 负责业务流程（认证 → 会话 → 检索 → 推理 → 验证 → 合规 → 审计），reason 节点内部是一次编译的 ReAct 子图，负责工具调用决策
        </li>
        <li>
          <strong>7 种 Agent 工具</strong>：检索、计算器、适当性检查（suitability）、行情、SQL、财务指标、重排——按角色动态开放，不是所有角色都能调用所有工具
        </li>
        <li>
          <strong>独立合规检查</strong>：回答生成前经过合规检查节点，和引用验证、数字验证是独立的校验逻辑
        </li>
        <li>
          <strong>增量入库引擎</strong>：ingestion/ 模块支持稳定文档 ID、内容哈希比对、版本管理、更新跳过、旧 chunk 清理，不是每次全量重建
        </li>
        <li>
          <strong>多 LLM Provider</strong>：支持 OpenAI-compatible provider 和本地 Ollama，embedding 使用 BAAI/bge-small-zh-v1.5
        </li>
        <li>
          <strong>真实证券数据</strong>：通过 akshare / efinance / baostock 抓取公开来源的财报、研报和结构化证券数据样本，不是纯模拟数据
        </li>
        <li>
          <strong>完整 Web 前端</strong>：React + Vite + Tailwind + TypeScript，提供问答和文档入库 UI，不是只有 API
        </li>
      </ul>

      <h2>可验证的代码事实</h2>
      <p>这个项目的可信度建立在代码本身，不是设计文档：</p>
      <ul>
        <li><strong>106 次独立 commit</strong>，功能按模块逐步落地（数据管道 → 基础RAG → Agent编排 → 检索优化 → 金融工具 → 身份权限 → 合规 → 前端 → 容器化）</li>
        <li>
          <code>src/</code> 共 <strong>11,540 行</strong> Python 代码，10 个模块：<code>agents/</code>（LangGraph 工作流）、<code>api/</code>（FastAPI 路由 + 身份绑定 + Web UI）、<code>ingestion/</code>（文档解析 + 增量入库）、<code>rag/</code>（基础 RAG 链）、<code>retrieval/</code>（多源检索 + 权限过滤）、<code>tools/</code>（7 种 Agent 工具）、<code>utils/</code>（引用验证 + 合规 + 会话 + 审计）、<code>evaluation/</code>、<code>schemas/</code>、<code>config.py</code>
        </li>
        <li>
          <code>tests/</code> 共 <strong>4,987 行</strong>，<strong>256 个测试用例</strong>，23 个测试文件，覆盖 Agent 节点与路由、身份和权限、检索、数据摄入、会话、合规、工具以及 API
        </li>
        <li>
          <code>scripts/</code> 共 19 个脚本：入库、演示、权限检查、检索评估、回答评估、端到端评估、合规评估、对话评估、数据抓取、chunk 检查
        </li>
        <li>
          <code>frontend/</code> 独立 React 应用：App.tsx、pages/、components/、api.ts、types.ts，使用 Vite + Tailwind + TypeScript
        </li>
        <li>
          <code>Dockerfile</code> 多阶段构建 + <code>docker-compose.yml</code> 一键部署
        </li>
      </ul>

      <h2>技术栈</h2>
      <p>已在代码中落地：</p>
      <ul>
        <li><strong>Agent 编排</strong>：LangGraph / LangChain</li>
        <li><strong>Web 框架</strong>：FastAPI + Pydantic</li>
        <li><strong>向量检索</strong>：ChromaDB + Sentence Transformers（BAAI/bge-small-zh-v1.5）</li>
        <li><strong>数据持久化</strong>：SQLite（会话、审计、入库任务状态）</li>
        <li><strong>前端</strong>：React + Vite + Tailwind CSS + TypeScript</li>
        <li><strong>部署</strong>：Docker 多阶段构建 + docker-compose</li>
        <li><strong>LLM Provider</strong>：OpenAI-compatible / 本地 Ollama</li>
        <li><strong>包管理</strong>：uv</li>
      </ul>

      <h2>设计取舍</h2>
      <table>
        <thead>
          <tr>
            <th>方案</th>
            <th>取舍</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>朴素 RAG</td>
            <td>实现简单，但无法表达角色权限、验证分支、合规检查和审计轨迹</td>
          </tr>
          <tr>
            <td>固定 Chain</td>
            <td>流程清晰，但检索不足或验证失败时缺少自然回退路径</td>
          </tr>
          <tr>
            <td>LangGraph StateGraph + ReAct 子图</td>
            <td>显式表达节点、状态和条件路由；reason 节点内部保留工具调用的灵活性，外层保持业务流程的可控性</td>
          </tr>
          <tr>
            <td>生成后过滤权限</td>
            <td>改动轻，但模型已经看过越权材料，不适合权限敏感场景</td>
          </tr>
          <tr>
            <td>检索前置权限过滤</td>
            <td>实现成本更高，但能从源头限制可见材料范围；多层校验（Planner + 检索执行 + chunk 元数据）进一步降低越权风险</td>
          </tr>
          <tr>
            <td>Reranker 作为标准检索步骤</td>
            <td>召回质量稳定，但增加固定延迟和成本</td>
          </tr>
          <tr>
            <td>Reranker 作为 Agent 工具</td>
            <td>是否调用由推理过程决定，灵活但不保证每次都重排；适合成本敏感场景</td>
          </tr>
          <tr>
            <td>内存 checkpointer</td>
            <td>实现简单，但服务重启后不恢复图执行状态；适合原型验证，生产需要持久化 checkpointer</td>
          </tr>
        </tbody>
      </table>

      <h2>项目边界说明</h2>
      <p>这是一个验证架构可行性的个人项目，不是生产系统。需要明确的是：</p>
      <ul>
        <li>
          标准检索链路是角色感知的多源向量检索，不包含 BM25、RRF 等稀疏检索融合；Reranker 作为 Agent 工具提供，不是标准检索阶段的固定步骤
        </li>
        <li>LangGraph checkpointer 使用内存存储；服务重启后不会恢复图执行状态</li>
        <li>会话、审计和入库任务使用本地 SQLite，后台入库基于单机进程，不支持多实例任务调度</li>
        <li>引用准确率、幻觉率、响应延迟等指标，在评估脚本中作为可复现的评估链路输出，<strong>未经生产环境实测验证</strong>，不引用这些数字作为已达成的成果</li>
        <li>内部知识库的数据源使用模拟/公开数据，未接入任何机构的真实内部数据；真实证券数据样本来自公开来源（akshare / efinance / baostock）</li>
        <li>demo token、样例数据和小规模评估集只能证明流程，不能证明生产安全性、吞吐量或回答质量</li>
        <li>项目重点展示 Agentic RAG 架构、权限建模、验证链路、合规检查和审计机制，不声称已经覆盖生产级灰度发布、全量监控和多实例调度</li>
      </ul>

      <h2>与客户端背景的关联</h2>
      <p>10 年证券客户端工程经验没有被当成履历装饰，而是直接映射到多个系统决策：</p>
      <table>
        <thead>
          <tr>
            <th>业务经验</th>
            <th>SecRAG 中的设计</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>交易链路中身份和权限必须服务端验证，不信任客户端传入</td>
            <td>Bearer token 服务端派生角色，不信任请求体身份信息；多层检索权限校验</td>
          </tr>
          <tr>
            <td>不同角色从一开始就拥有不同的信息边界</td>
            <td>RBAC 在 Retriever 前生效，模型不会先看到越权材料；非公开内容缺 allowed_roles 默认拒绝</td>
          </tr>
          <tr>
            <td>数字错误与引用错误的风险性质不同，需要独立校验</td>
            <td>Verifier 将数字校验与来源校验拆成独立检查逻辑；合规检查是第三个独立校验节点</td>
          </tr>
          <tr>
            <td>交易操作必须有完整审计轨迹，出问题可复盘</td>
            <td>Auditor 节点 SQLite 持久化完整问答轨迹，审计只在服务端保存，不通过接口返回</td>
          </tr>
          <tr>
            <td>客户端发布需要灰度、可回滚、版本管理</td>
            <td>增量入库支持稳定文档 ID、内容哈希、版本管理、更新跳过、旧 chunk 清理</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
