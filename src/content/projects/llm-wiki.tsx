import { Link } from "react-router-dom";

export function LlmWikiContent() {
  return (
    <>
      <h2>项目一句话</h2>
      <p>
        <code>llm-wiki</code> 不是一个笔记仓库，也不是每次提问时临时检索一堆文件的资料夹。它把{" "}
        <code>raw/</code> 里的原始证据在<strong>入库阶段</strong>编译成结构化的正式页面，
        查询时直接读页面——编译一次，复用多次。
      </p>
      <p>
        判断标准只有一条：一条结论能不能说清<strong>它来自哪份证据、什么时候核验、置信度如何</strong>。
        说不清的，就不算正式页。
      </p>

      <h2>为什么不在查询时拼接</h2>
      <p>
        直接让 Agent 读原始资料，看起来省事，但会反复踩同一组坑：
      </p>
      <ul>
        <li>同一份证据被反复解析，每次得出的结论可能不一样；</li>
        <li>重复内容没有合并，同一个事实散在五个文件里；</li>
        <li>来源、日期、置信度没有固定字段，无法判断哪一版可信；</li>
        <li>文档过期或 API 弃用后，旧结论仍在被引用，没人负责清理。</li>
      </ul>
      <p>
        所以这里采用“<strong>入库即编译</strong>”：raw 只做证据保全，结论沉淀到正式页，
        每次维护都要更新来源与日志。代价是前期慢，收益是后面每次查询都稳定、可追溯。
      </p>

      <h2>知识流水线</h2>
      <figure className="arch-figure">
        <svg
          viewBox="0 0 820 250"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="llm-wiki 知识流水线：raw 证据经编译与源校准生成正式页面，写入 index 权威目录后被 Agent 与 llm-wiki-mcp 查询；审计缺口台账决定下一轮补证"
        >
          <defs>
            <marker
              id="lw2-arr"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L8,4 L0,8" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            </marker>
            <marker
              id="lw2-arr-a"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L8,4 L0,8" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
            </marker>
          </defs>
          <style>{`
            .lw2-n { fill: none; stroke: var(--line-strong); stroke-width: 1; }
            .lw2-na { fill: none; stroke: var(--accent); stroke-width: 1.2; }
            .lw2-t { font-family: var(--mono); font-size: 12px; fill: var(--ink); }
            .lw2-s { font-family: var(--sans); font-size: 10px; fill: var(--muted); }
            .lw2-a { font-family: var(--mono); font-size: 10px; fill: var(--accent); font-weight: 600; }
            .lw2-l { stroke: var(--ink); stroke-width: 1; fill: none; }
            .lw2-la { stroke: var(--accent); stroke-width: 1; fill: none; stroke-dasharray: 4 3; }
          `}</style>

          <rect className="lw2-n" x="20" y="40" width="160" height="60" />
          <text className="lw2-t" x="100" y="64" textAnchor="middle">RAW</text>
          <text className="lw2-s" x="100" y="82" textAnchor="middle">raw / workshop raw</text>
          <text className="lw2-s" x="100" y="96" textAnchor="middle">387 份登记来源</text>

          <line className="lw2-l" x1="180" y1="70" x2="216" y2="70" markerEnd="url(#lw2-arr)" />

          <rect className="lw2-na" x="220" y="40" width="180" height="60" />
          <text className="lw2-t" x="310" y="64" textAnchor="middle">COMPILE</text>
          <text className="lw2-s" x="310" y="82" textAnchor="middle">回一手来源校准</text>
          <text className="lw2-s" x="310" y="96" textAnchor="middle">合并 · 拆页 · 补来源</text>

          <line className="lw2-l" x1="400" y1="70" x2="436" y2="70" markerEnd="url(#lw2-arr)" />

          <rect className="lw2-n" x="440" y="40" width="160" height="60" />
          <text className="lw2-t" x="520" y="64" textAnchor="middle">PAGES</text>
          <text className="lw2-s" x="520" y="82" textAnchor="middle">concepts / queries</text>
          <text className="lw2-s" x="520" y="96" textAnchor="middle">comparisons / references</text>

          <line className="lw2-l" x1="600" y1="70" x2="636" y2="70" markerEnd="url(#lw2-arr)" />

          <rect className="lw2-n" x="640" y="40" width="160" height="60" />
          <text className="lw2-t" x="720" y="64" textAnchor="middle">INDEX</text>
          <text className="lw2-s" x="720" y="82" textAnchor="middle">index.md</text>
          <text className="lw2-s" x="720" y="96" textAnchor="middle">185 页 · 唯一目录</text>

          <rect className="lw2-n" x="220" y="160" width="180" height="54" />
          <text className="lw2-t" x="310" y="183" textAnchor="middle">AUDIT</text>
          <text className="lw2-s" x="310" y="200" textAnchor="middle">缺口台账 · 待处理 157 份</text>

          <rect className="lw2-n" x="440" y="160" width="360" height="54" />
          <text className="lw2-t" x="620" y="183" textAnchor="middle">CONSUMER</text>
          <text className="lw2-s" x="620" y="200" textAnchor="middle">Agent 查询 · llm-wiki-mcp 工具层</text>

          <line className="lw2-l" x1="720" y1="100" x2="720" y2="156" markerEnd="url(#lw2-arr)" />
          <path className="lw2-la" d="M 310 160 L 310 104" markerEnd="url(#lw2-arr-a)" />
          <text className="lw2-a" x="322" y="140">补证 → 重新编译</text>
        </svg>
        <figcaption>
          编译是唯一的产出环节：raw 不直接对外，结论只从正式页出。审计台账记录“哪块知识还缺、缺哪份证据”，
          下一轮按它补，而不是凭印象加页。
        </figcaption>
      </figure>

      <h2>能力证据矩阵</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">维度</th>
            <th scope="col">事实（仓库 HEAD）</th>
            <th scope="col">怎么核对</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>提交历史</td>
            <td>971 commits，跨会话持续维护</td>
            <td>
              <code>git rev-list --count HEAD</code>
            </td>
          </tr>
          <tr>
            <td>来源登记</td>
            <td>387 份来源：230 份已编译、157 份待处理</td>
            <td>
              <code>_meta/source-map.json</code> 的 <code>summary</code>
            </td>
          </tr>
          <tr>
            <td>正式页面</td>
            <td>185 个 Catalog 页面：concepts 147 · queries 11 · comparisons 10 · references 10</td>
            <td>
              <code>index.md</code> 头部 Total pages + 页面类型统计
            </td>
          </tr>
          <tr>
            <td>领域覆盖</td>
            <td>10 个领域目录（AI Agent、iOS SDK、鸿蒙、证券业务、认知与表达等）+ 7 个项目包</td>
            <td>
              <code>domains/</code>、<code>workshop/</code>
            </td>
          </tr>
          <tr>
            <td>内容契约</td>
            <td>
              <code>SCHEMA.md</code> 定目录、frontmatter、页面类型、sources 与 confidence；
              执行流程放 <code>AGENTS.md</code>，两份文件不重复同一规则
            </td>
            <td>两份文件开头的职责声明</td>
          </tr>
          <tr>
            <td>审计机制</td>
            <td>
              <code>_meta/audit/knowledge-gaps.md</code> 用 ☐ / ◐ / ☑ 跟踪缺口，
              补页必须回一手来源，未核验项标 Unverified
            </td>
            <td>
              <code>_meta/audit/</code>
            </td>
          </tr>
          <tr>
            <td>变更留痕</td>
            <td>
              <code>log.md</code> 记录规则与事实变更；页面 frontmatter 带 sources，正文不设“校准记录”章节
            </td>
            <td>
              <code>log.md</code>、页面头部
            </td>
          </tr>
        </tbody>
      </table>

      <h2>几条硬规则</h2>
      <ul>
        <li>
          <strong>一个页面只回答一件事</strong>：页面合并、拆分与 reference 下沉有单独规则文档，
          不靠临场判断。
        </li>
        <li>
          <strong>事实必须回一手来源</strong>：校准技术事实时实时访问官方文档或源码；
          搜索摘要、缓存、模型记忆只能定位候选，不能当作证据。
        </li>
        <li>
          <strong>置信度要写出来</strong>：已核实、部分核实、未核实三档分开标，冲突未解决就留白，
          不挑一个说法写成结论。
        </li>
        <li>
          <strong>规则与流程分家</strong>：内容契约在 <code>SCHEMA.md</code>，执行步骤在{" "}
          <code>AGENTS.md</code>；两边冲突必须同一轮修完并记 <code>log.md</code>，不许静默择一。
        </li>
        <li>
          <strong>路径不写死</strong>：文档统一用 <code>~</code> 缩写，不写本机绝对路径，
          换机器后引用仍然成立。
        </li>
      </ul>

      <h2>和 llm-wiki-mcp 的关系</h2>
      <p>
        这个仓库是<strong>存储与内容契约</strong>，<Link to="/projects/llm-wiki-mcp">llm-wiki-mcp</Link>{" "}
        是<strong>操作层</strong>：Agent 通过 MCP 工具搜索、读取、提交候选，候选经人工评审后才落盘。
        两层分开的好处是：换客户端不用改知识库，改规则也不用改工具。
      </p>

      <h2>项目边界</h2>
      <ul>
        <li>仓库为私有，面试时可现场演示目录、页面契约、审计台账与提交历史。</li>
        <li>157 份来源仍在待处理状态，覆盖率写在页面上，不当成“已完成”。</li>
        <li>知识库是某一时刻的编译结果，不承诺实时正确；引用前仍需按页面 sources 复核。</li>
        <li>“置信度”是维护时的判断标签，不等于外部权威背书。</li>
      </ul>
    </>
  );
}
