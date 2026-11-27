import { Link } from "react-router-dom";

export function DoubaoCronContent() {
  return (
    <>
      <h2>项目一句话</h2>
      <p>
        <code>doubao-cron</code> 不是“让模型每天写一篇新闻”。它要验证的是另一件事：
        <strong>定时任务能不能长期跑，跑出来的东西能不能回查</strong>。两个任务每天固定时点触发，
        从采集、去重、写盘、推送、归档走一条固定链路，规则文件进版本控制，产物按日期留痕。
      </p>

      <h2>为什么做这个</h2>
      <p>
        一次性的脚本很容易，难的是每天都跑、每天都有人看、出错时能查。定时 Agent 的失败方式和
        交互式对话不一样：
      </p>
      <ul>
        <li>没人盯着，模型编一条不存在的消息也不会被当场发现；</li>
        <li>规则写在任务提示词里，改一次就丢一次历史，没法 diff；</li>
        <li>产物散落在聊天记录里，一个月后无法回答“那天到底写了什么”；</li>
        <li>链接失效、板块串味、跨天重复——单次看不出，连续跑一周就暴露。</li>
      </ul>
      <p>
        所以这个项目的重点不在“生成”，在<strong>把生成过程变成可运营的流程</strong>：规则可版本化、
        每步有落点、产物可归档、失败可定位。
      </p>

      <h2>运行架构</h2>
      <figure className="arch-figure">
        <svg
          viewBox="0 0 820 232"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="doubao-cron 一次执行的链路：定时触发后先同步仓库规则，再采集、成稿、评审、发布归档；评审不通过可退回补采，任一步失败即停止留痕"
        >
          <defs>
            <marker
              id="dc-arr"
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
              id="dc-arr-a"
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
            .dc-n { fill: none; stroke: var(--line-strong); stroke-width: 1; }
            .dc-na { fill: none; stroke: var(--accent); stroke-width: 1.2; }
            .dc-t { font-family: var(--mono); font-size: 12px; fill: var(--ink); }
            .dc-s { font-family: var(--sans); font-size: 10px; fill: var(--muted); }
            .dc-a { font-family: var(--mono); font-size: 10px; fill: var(--accent); font-weight: 600; }
            .dc-l { stroke: var(--ink); stroke-width: 1; fill: none; }
            .dc-la { stroke: var(--accent); stroke-width: 1; fill: none; }
          `}</style>

          <text className="dc-a" x="44" y="44">TRIGGER — cron 05:50 AI 早报 ／ 15:09 股市日报</text>
          <line className="dc-l" x1="114" y1="52" x2="114" y2="72" markerEnd="url(#dc-arr)" />

          <rect className="dc-na" x="44" y="72" width="140" height="56" />
          <text className="dc-t" x="114" y="95" textAnchor="middle">RULE SYNC</text>
          <text className="dc-s" x="114" y="112" textAnchor="middle">git pull + 读规则</text>

          <line className="dc-l" x1="184" y1="100" x2="204" y2="100" markerEnd="url(#dc-arr)" />
          <rect className="dc-n" x="208" y="72" width="140" height="56" />
          <text className="dc-t" x="278" y="95" textAnchor="middle">COLLECT</text>
          <text className="dc-s" x="278" y="112" textAnchor="middle">检索 + 抓取原文</text>

          <line className="dc-l" x1="348" y1="100" x2="368" y2="100" markerEnd="url(#dc-arr)" />
          <rect className="dc-n" x="372" y="72" width="140" height="56" />
          <text className="dc-t" x="442" y="95" textAnchor="middle">COMPOSE</text>
          <text className="dc-s" x="442" y="112" textAnchor="middle">临时文件 + 分板块</text>

          <line className="dc-l" x1="512" y1="100" x2="532" y2="100" markerEnd="url(#dc-arr)" />
          <rect className="dc-na" x="536" y="72" width="140" height="56" />
          <text className="dc-t" x="606" y="95" textAnchor="middle">REVIEW</text>
          <text className="dc-s" x="606" y="112" textAnchor="middle">去重裁决 + 链接校验</text>

          <line className="dc-l" x1="676" y1="100" x2="696" y2="100" markerEnd="url(#dc-arr)" />
          <rect className="dc-n" x="700" y="72" width="104" height="56" />
          <text className="dc-t" x="752" y="95" textAnchor="middle">PUBLISH</text>
          <text className="dc-s" x="752" y="112" textAnchor="middle">飞书 + 归档</text>

          <text className="dc-a" x="114" y="152" textAnchor="middle">规则不一致即停</text>

          <path className="dc-la" d="M 606 132 L 606 168 L 442 168 L 442 132" markerEnd="url(#dc-arr-a)" />
          <text className="dc-a" x="524" y="190" textAnchor="middle">去重或断链 → 退回补采</text>
        </svg>
        <figcaption>
          一次执行固定六段。前两段是约束：任务触发后先同步仓库并重读规则，仓库版本覆盖任务侧提示词；
          后四段是产出：采集、成稿、评审、发布，每段都落盘，失败时能看到停在哪一段。
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
            <td>运行产出</td>
            <td>61 期日报归档：47 期 AI 早报 + 14 期股市日报，首期 2026-09-13</td>
            <td>
              <code>ls docs | grep -c "^cron-"</code> / <code>stock-</code>
            </td>
          </tr>
          <tr>
            <td>提交历史</td>
            <td>445 commits，含每日逐板块提交 + 收尾归档</td>
            <td>
              <code>git rev-list --count HEAD</code>
            </td>
          </tr>
          <tr>
            <td>定时任务</td>
            <td>AI 早报 <code>50 5 * * *</code>；股市日报 <code>9 15 * * *</code></td>
            <td>
              <code>ai-prompt.md</code>、<code>stock-prompt.md</code> 头部
            </td>
          </tr>
          <tr>
            <td>规则结构</td>
            <td>
              <code>AGENTS.md</code> 做任务路由，分发到 <code>cron-morning</code> /{" "}
              <code>cron-stock</code> / <code>cron-common</code> / <code>knowledge-docs</code> 四份子规则
            </td>
            <td>
              <code>rules/</code>
            </td>
          </tr>
          <tr>
            <td>产出规范</td>
            <td>5 个固定板块（行业动态 / 技巧与话题 / Agent 论文 / 技术与教程 / 变现案例），条目数与字段固定</td>
            <td>
              <code>ai-prompt.md</code>
            </td>
          </tr>
          <tr>
            <td>知识层</td>
            <td>14 个带示例的教程目录（编号 01–13 + framework-landscape）、87 个 Python 示例文件、142 个测试定义（14 个测试文件）</td>
            <td>
              <code>knowledge/tutorials/</code>、<code>grep -rho 'def test_'</code>
            </td>
          </tr>
          <tr>
            <td>交付链路</td>
            <td>写 Markdown → 建飞书文档并设公开权限 → 推送核心摘要 → Git 归档</td>
            <td>
              <code>rules/cron-common.md</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>规则版本化：仓库是唯一执行依据</h2>
      <p>
        任务侧保存的提示词只当触发器。每次执行的第一步是 <code>git pull</code>，然后重新读取仓库内的{" "}
        <code>ai-prompt.md</code> 与 <code>rules/</code>；两者不一致时以仓库版本为准。这样改一次规则
        就是一次 commit，能看 diff、能回滚，不会出现“任务里写的和仓库里写的不是一回事”。
      </p>
      <p>
        <code>AGENTS.md</code> 不写具体流程，只做路由：触发哪个场景，就读哪份子规则。规则本身分层——
        通用约束（溯源链接、输出规范、飞书权限、Git 提交）放 <code>cron-common.md</code>，
        两个任务各自的范围与字段放各自的文件，避免一份长提示词到处复制。
      </p>

      <h2>一次执行的细节</h2>
      <ol>
        <li>
          <strong>先同步再执行</strong>：<code>git pull origin main</code>，重读规则；读不到或工作区不干净
          就停止，不在旧规则上跑。
        </li>
        <li>
          <strong>按板块逐段落盘</strong>：先写临时文件 <code>docs/.cron-tmp-YYYYMMDD-HHMMSS.md</code>，
          每个板块单独 commit（commit message 记录板块与自评分），避免一次大提交掩盖某段的内容质量。
        </li>
        <li>
          <strong>去重要裁决，不是删掉了事</strong>：同一事件出现在多个板块时，按归属硬约束表保留一处，
          其余删除并用新候选补位，替补同样要过审核。
        </li>
        <li>
          <strong>链接逐条校验</strong>：每条结论带可点击的溯源链接，失效或打不开的换掉；只给标题不给
          链接的条目不放行。
        </li>
        <li>
          <strong>成稿与归档</strong>：临时文件重命名为 <code>docs/cron-YYYYMMDD-HHMMSS.md</code>，
          建飞书文档、设公开权限、推送摘要，最后提交并 push。
        </li>
      </ol>

      <h2>知识层：日报之外的第二类产物</h2>
      <p>
        <code>knowledge/</code> 里有 15 个教程主题，其中 14 个配可运行示例与测试——
        多智能体辩论、上下文工程、沙箱权限、RAG 评估、记忆取舍、Agentic 支付等。教程写的是判断，
        示例用来验证判断，测试用来防止示例在依赖升级后悄悄坏掉。
      </p>
      <p>
        这块和日报共用同一套纪律：结论要能回到来源，演示要能跑，跑不了就写明边界，不把“看起来对”
        写成“已验证”。
      </p>

      <h2>与其他项目的关联</h2>
      <ul>
        <li>
          <Link to="/projects/ai-engineering-hub">ai-engineering-hub</Link>：两端共用“唯一可信来源 +
          停止门禁”的写法，一个管知识库，一个管每日产物
        </li>
        <li>
          <Link to="/projects/llm-wiki-mcp">llm-wiki-mcp</Link>：日报里核实过的结论要进正式知识时，
          走的是候选评审那条路，而不是直接写页
        </li>
        <li>
          <Link to="/projects/secrag">SecRAG</Link>：引用校验与审计留痕的思路，在这里落到“每期可回查”
        </li>
      </ul>

      <h2>项目边界</h2>
      <ul>
        <li>仓库为私有，面试时可现场演示规则、提交历史与产出文件。</li>
        <li>
          日报是<strong>线索汇总</strong>，不是事实认定：模型可能误读原文，链接可能当天有效、隔月失效，
          重要结论仍需回到原始来源核对。
        </li>
        <li>检索结果不可复现：同一时点搜到的内容会变，归档只能证明“当时写了什么、依据哪条链接”。</li>
        <li>自动化只覆盖采集与整理，选题判断和价值取舍仍是人工设定的规则，不声称自主决策。</li>
      </ul>
    </>
  );
}
