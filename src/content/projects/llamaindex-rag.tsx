import { Link } from "react-router-dom";

export function LlamaIndexRagContent() {
  return (
    <>
      <h2>项目一句话</h2>
      <p>
        <code>LlamaIndex RAG</code> 不是一条端到端问答流水线，而是六个可以单独运行的阶段：
        加载 → 切片 → 索引 → 检索 → 重排 → 回答。每个阶段的输出都带 PDF 物理页码和来源标识，
        可以回到原文件核对；检索与回答的结果不脱离原文单独存在。
      </p>
      <blockquote>
        把 RAG 拆开，是因为「答错了」这个结论没有定位价值——需要知道错在哪一段。
      </blockquote>

      <h2>为什么做这个项目</h2>
      <p>
        端到端跑通一个 RAG Demo 只需要几十行代码，但出问题时它能给出的信息只有「答得不好」。
        到底是切片切断了依据、索引没召回到目标页，还是模型自己编的，从最终回答里看不出来：
      </p>
      <ul>
        <li>中间产物（页面文本、片段、索引清单、候选排名、引用）本身就是证据，但通常写进日志或直接丢掉。</li>
        <li>重排、hybrid、分数阈值这类优化项，没有固定问题集和基线，就只能凭单次观感判断是否有效。</li>
        <li>回答里的 <code>[n]</code> 引用如果没有对应的证据列表，读者无法确认这句话是否真由原文支持。</li>
      </ul>
      <p>这个项目的核心判断是：</p>
      <blockquote>
        先把每一段做成可单独执行、可人工验证的单元，再谈优化；先有基线，再谈提升。
      </blockquote>

      <h2>六段链路与可核对物</h2>
      <p>
        每条命令只负责一段，输出完整正文、页码与统计，失败页单独列出并使命令返回非零状态——
        失败是可见的，不会被静默吞掉。
      </p>

      <figure className="arch-figure">
        <svg
          viewBox="0 0 820 250"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="LlamaIndex RAG 六阶段链路：加载、切片、索引、检索、重排、回答，下方为贯穿全链路的溯源层，再向上提供局域网接口与 iOS 客户端"
        >
          <defs>
            <marker
              id="lw-arr"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L8,4 L0,8" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            </marker>
          </defs>
          <style>{`
            .lwn { fill: none; stroke: var(--line-strong); stroke-width: 1; }
            .lwt { font-family: var(--mono); font-size: 10.5px; fill: var(--ink); font-weight: 600; letter-spacing: 0.06em; }
            .lws { font-family: var(--sans); font-size: 9.5px; fill: var(--muted); }
            .lwa { font-family: var(--mono); font-size: 9.5px; fill: var(--accent); font-weight: 600; letter-spacing: 0.08em; }
            .lwl { stroke: var(--ink); stroke-width: 1; fill: none; }
            .lwband { fill: none; stroke: var(--accent); stroke-width: 1; }
          `}</style>

          {/* 六个阶段 */}
          <rect className="lwn" x="40" y="14" width="110" height="58" />
          <text className="lwt" x="52" y="38">LOAD</text>
          <text className="lws" x="52" y="55">PDF 逐页</text>

          <rect className="lwn" x="166" y="14" width="110" height="58" />
          <text className="lwt" x="178" y="38">CHUNK</text>
          <text className="lws" x="178" y="55">Node 切片</text>

          <rect className="lwn" x="292" y="14" width="110" height="58" />
          <text className="lwt" x="304" y="38">INDEX</text>
          <text className="lws" x="304" y="55">向量 + 清单</text>

          <rect className="lwn" x="418" y="14" width="110" height="58" />
          <text className="lwt" x="430" y="38">RETRIEVE</text>
          <text className="lws" x="430" y="55">dense Top-K</text>

          <rect className="lwn" x="544" y="14" width="110" height="58" />
          <text className="lwt" x="556" y="38">RERANK</text>
          <text className="lws" x="556" y="55">CrossEncoder</text>

          <rect className="lwn" x="670" y="14" width="110" height="58" />
          <text className="lwt" x="682" y="38">ANSWER</text>
          <text className="lws" x="682" y="55">[n] 引用</text>

          <line className="lwl" x1="150" y1="43" x2="164" y2="43" markerEnd="url(#lw-arr)" />
          <line className="lwl" x1="276" y1="43" x2="290" y2="43" markerEnd="url(#lw-arr)" />
          <line className="lwl" x1="402" y1="43" x2="416" y2="43" markerEnd="url(#lw-arr)" />
          <line className="lwl" x1="528" y1="43" x2="542" y2="43" markerEnd="url(#lw-arr)" />
          <line className="lwl" x1="654" y1="43" x2="668" y2="43" markerEnd="url(#lw-arr)" />

          {/* 溯源层：贯穿全部阶段的关键约束 */}
          <line className="lwl" x1="220" y1="72" x2="220" y2="90" markerEnd="url(#lw-arr)" />
          <rect className="lwband" x="40" y="92" width="740" height="40" />
          <text className="lwa" x="56" y="117">PROVENANCE</text>
          <text className="lws" x="150" y="117">
            物理页码 · 来源标识 · 模型快照与配置校验 · 引用 [n] 逐条核对
          </text>

          {/* 对外接口与客户端 */}
          <line className="lwl" x1="220" y1="132" x2="220" y2="148" markerEnd="url(#lw-arr)" />
          <rect className="lwn" x="40" y="150" width="360" height="52" />
          <text className="lwt" x="52" y="172">API</text>
          <text className="lws" x="52" y="189">局域网 · /v1/chat/completions · 一次性 JSON 或 SSE</text>

          <line className="lwl" x1="400" y1="176" x2="456" y2="176" markerEnd="url(#lw-arr)" />
          <rect className="lwn" x="460" y="150" width="320" height="52" />
          <text className="lwt" x="472" y="172">iOS CLIENT</text>
          <text className="lws" x="472" y="189">SwiftUI · 流式回答 · 引用与证据列表</text>
        </svg>
        <figcaption>
          红色为关键约束：页码与来源必须穿过全部六个阶段，不能在某一层被替换成「第几条结果」；
          HTTP 层只做参数校验、鉴权和序列化，检索与生成仍调用同一套模块。
        </figcaption>
      </figure>

      <table>
        <thead>
          <tr>
            <th scope="col">阶段</th>
            <th scope="col">产物</th>
            <th scope="col">用来核对什么</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>加载</td>
            <td>逐页 <code>Document</code>：正文 + 文件路径 + 物理页码</td>
            <td>中文与段落顺序是否正确、哪些页提取为空</td>
          </tr>
          <tr>
            <td>切片</td>
            <td>带页码集合的 <code>Node</code>（单页或跨页）</td>
            <td>片段边界是否切断了条目、跨页是否被正确拼接</td>
          </tr>
          <tr>
            <td>索引</td>
            <td>向量 + <code>manifest.json</code>（模型快照、配置、文档标识）</td>
            <td>索引与嵌入模型版本是否匹配</td>
          </tr>
          <tr>
            <td>检索</td>
            <td>Top-K 候选，保留 dense 原始排名与分数</td>
            <td>答案页有没有被召回、排在第几位</td>
          </tr>
          <tr>
            <td>重排</td>
            <td>重排后的 top-5，同时保留两类分数</td>
            <td>重排在这道题上是否真的更好</td>
          </tr>
          <tr>
            <td>回答</td>
            <td>带 <code>[n]</code> 的回答 + 证据列表</td>
            <td>每条引用是否真的支持对应句子</td>
          </tr>
        </tbody>
      </table>

      <h2>可验证证据</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">证据</th>
            <th scope="col">落点</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>自动化测试</td>
            <td>9 个测试文件、171 个用例，覆盖六个阶段、HTTP 接口与日志</td>
          </tr>
          <tr>
            <td>固定问题集</td>
            <td>8 个问题（7 个文档内 + 1 个书外），答案页由人工逐页阅读 PDF 后标注</td>
          </tr>
          <tr>
            <td>检索评测</td>
            <td>同一索引、同一问题，只切换 dense 与 rerank 两种模式对比名次</td>
          </tr>
          <tr>
            <td>运行日志</td>
            <td>每次命令独立 <code>run_id</code>，可串联各阶段事件、耗时与异常堆栈</td>
          </tr>
          <tr>
            <td>真实客户端</td>
            <td>iOS 端流式回答、Markdown 渲染、引用与证据列表、局域网健康检查</td>
          </tr>
        </tbody>
      </table>

      <h3>自己测出的反例：重排让一题变差</h3>
      <p>
        重排常被当成「加上就更准」的开关。这里先用 7 个文档内问题建立基线，再在同一索引上开启
        CrossEncoder 重排，结果并不一致：
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">模式</th>
            <th scope="col">答案页进入前 5</th>
            <th scope="col">失效点</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>dense</td>
            <td>7 / 7</td>
            <td>该组问题上未见失效</td>
          </tr>
          <tr>
            <td>dense + 重排</td>
            <td>6 / 7</td>
            <td>
              「拖欠加班费怎么办」从第 4 名掉出前五，被两条清单页顶掉：重排偏好与问句字面高度重合的
              条目索引页
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        因此命令行保留 <code>--dense-only</code> 开关，重排不是默认更优。书外问题（文档里没有答案）
        的最高重排分为 0.0065，文档内七题在 0.78–0.97 之间，相差两个数量级；但程序目前没有阈值逻辑，
        仍会照常返回候选——分数能区分，不等于系统已经会拒答。
      </p>

      <h2>设计取舍</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">方案</th>
            <th scope="col">取舍</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>一条端到端 pipeline</td>
            <td>跑通快、代码少，但中间物不可见，无法定位失效阶段；改成六个阶段命令，代价是步骤变多</td>
          </tr>
          <tr>
            <td>自己写切片器</td>
            <td>完全可控，但要独立维护句子边界与 token 计数；改为复用 <code>SentenceSplitter</code> 并记录字符偏移，代价是依赖内部接口，升级需复验</td>
          </tr>
          <tr>
            <td>先上重排再调参</td>
            <td>省事，但没有基线就无法判断收益甚至退步；改为先固定问题集、再逐个开关对比</td>
          </tr>
          <tr>
            <td>只做命令行</td>
            <td>足够验证，但不像真实使用；补局域网接口与 iOS 客户端，验证跨设备的真实链路与流式渲染</td>
          </tr>
        </tbody>
      </table>

      <h2>项目边界说明</h2>
      <p>这个项目面向学习与分阶段验证，不是生产方案：</p>
      <ul>
        <li>只处理单份 PDF，无 OCR，扫描件与图片中的文字可能提取不到；无多用户与权限体系。</li>
        <li>
          问题集是在读过正文之后、按书中标题措辞拟的，与正文词汇重合度偏高，可能高估真实提问下的召回；
          第二份 PDF 的扩展验证尚未完成。
        </li>
        <li>分数阈值、hybrid 检索、引用忠实度的自动判定都还没做，引用核对目前仍以人工比对为主。</li>
        <li>切片依赖 LlamaIndex 内部合并步骤，升级版本时必须重新验证。</li>
      </ul>

      <h2>与其他项目的关系</h2>
      <p>
        <Link to="/projects/secrag">SecRAG</Link>{" "}
        解决的是生产侧的权限、引用校验与审计，回答「这套东西能不能上线」；
        这个项目解决的是研发侧的可观测性，回答「它在哪一段失效」。同一个判断在两边都成立：
        没有可核对的证据，就没有可信的检索。
      </p>

      <h2>相关页面</h2>
      <ul>
        <li>
          <Link to="/notes/rag-principles">RAG 原理</Link>
        </li>
        <li>
          <Link to="/notes/eval-engineering">Eval Engineering</Link>
        </li>
      </ul>
    </>
  );
}
