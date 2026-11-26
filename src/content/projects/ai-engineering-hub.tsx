import { Link } from "react-router-dom";

export function AiEngineeringHubContent() {
  return (
    <>
      <h2>项目定位</h2>
      <p>
        ai-engineering-hub 是我的 AI 工程知识仓库：<strong>纯文档</strong>，不含
        pyproject、虚拟环境或示例代码——可运行实践一律放在相邻的独立仓库里。它要解决的问题不是
        “多存几篇笔记”，而是让一条技术事实在被引用之前，能说清版本、来源和证据强度。
      </p>
      <p>
        仓库分两层：<code>docs/</code> 是教程与资料，<code>learning/</code>{" "}
        是主动学习运行层——记录当前只推进的那一个知识点、教学记录与验收证据。两层分开，是为了避免
        “看过一篇教程”被当成“已经掌握”。
      </p>

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
            <td>424 commits，2026 年内持续迭代</td>
            <td>
              <code>git rev-list --count HEAD</code>
            </td>
          </tr>
          <tr>
            <td>文档规模</td>
            <td>241 篇 Markdown；其中 LangChain 源码校准文档 62 篇</td>
            <td>
              <code>git ls-files "*.md"</code> / <code>ls docs/langchain</code>
            </td>
          </tr>
          <tr>
            <td>生态覆盖</td>
            <td>
              LangChain / LangGraph、LlamaIndex、AutoGPT、ComfyUI、pi、Langfuse、TradingAgents，
              另有 cross-framework 对比与 interview 资料
            </td>
            <td>
              <code>docs/</code> 目录结构
            </td>
          </tr>
          <tr>
            <td>专题教程</td>
            <td>7 个 Agent Engineering 专题 + Hermes Agent 源码系列 + 其他专题</td>
            <td>
              <code>docs/tutorial/chore/</code>、<code>docs/tutorial/hermesAgent/</code>
            </td>
          </tr>
          <tr>
            <td>学习运行层</td>
            <td>
              <code>14-day-plan.md</code> 排单元、<code>progress.md</code> 作为进度唯一事实来源、{" "}
              <code>learning-protocol.md</code> 定义教学与验收
            </td>
            <td>
              <code>learning/</code>
            </td>
          </tr>
          <tr>
            <td>源码基线</td>
            <td>
              <code>local-source-repos.json</code> 记录上游仓库的本地路径与{" "}
              <code>branch@commit</code>，写入前核对 HEAD
            </td>
            <td>仓库根目录</td>
          </tr>
          <tr>
            <td>工作规则</td>
            <td>
              <code>AGENTS.md</code> 定义常驻必读、文档分流、引用格式与停止条件；{" "}
              <code>ops/</code> 保存生态配置与标准
            </td>
            <td>
              <code>AGENTS.md</code>、<code>ops/</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>7 个 Agent Engineering 专题</h2>
      <p>教程按 Agent 的工作链排列，不是随机概念集合：</p>
      <ol>
        <li>
          <strong>Context Engineering</strong>（看什么）：上下文装配、压缩、渐进式披露
        </li>
        <li>
          <strong>Tool Engineering</strong>（做什么）：工具设计、边界、返回值、错误处理
        </li>
        <li>
          <strong>Memory Engineering</strong>（记什么）：状态、记忆、生命周期、纠错机制
        </li>
        <li>
          <strong>Harness Engineering</strong>（在哪里做）：运行环境、沙箱、权限、hooks、回压
        </li>
        <li>
          <strong>Loop Engineering</strong>（怎么循环）：Agent loop、错误恢复、停止条件、状态机
        </li>
        <li>
          <strong>Graph Engineering</strong>（怎么组织）：LangGraph、子图、动态转移、人机协作
        </li>
        <li>
          <strong>Eval Engineering</strong>（怎么判断好坏）：能力定义、黄金数据、verifier、失败回归
        </li>
      </ol>
      <p>
        每篇开头先给结论与边界，再讲“谁产生什么、数据怎么走”，最后才是参数。事实按来源标注，
        未核实的写成待核，不塞成确定结论。
      </p>

      <h2>学习运行层：把“学过”与“会用”分开</h2>
      <p>
        <code>learning/</code> 记录的是可验收的学习状态，而不是阅读清单。三条规则决定它怎么运转：
      </p>
      <ul>
        <li>
          <strong>一次只推进一个知识点</strong>：<code>14-day-plan.md</code> 排单元，{" "}
          <code>progress.md</code> 是唯一事实来源；旧笔记与“已完成”不自动算通过。
        </li>
        <li>
          <strong>教学记录不等于验收证据</strong>：教学过程的{" "}
          <code>notes/teaching/</code> 文件头标注“AI 讲授记录，不是验收证据”，学习者的复述、
          举例与实作另存，验收分数只认后者。
        </li>
        <li>
          <strong>结论允许被推翻</strong>：冲突未解决时标为 <code>Uncertain</code>、暂停泛化，
          等新证据，而不是挑一个说法写成结论。
        </li>
      </ul>

      <h2>知识治理 SOP</h2>
      <p>
        仓库里最有约束力的部分是 <code>AGENTS.md</code> 与{" "}
        <code>learning/source-trace.md</code> 定义的写入规则。核心几条：
      </p>
      <ul>
        <li>
          <strong>停止门禁优先于执行</strong>：源码路径不确定、HEAD 与索引不一致、依赖冲突、
          API 已弃用——任一条命中就停，不用网页摘要或模型记忆绕过。
        </li>
        <li>
          <strong>唯一可信源码基线</strong>：<code>local-source-repos.json</code> 记录{" "}
          <code>branch@commit</code>；同步、hash 回写与台账流程单独成文，第三方开源库只读，
          不改 remote、不 push。
        </li>
        <li>
          <strong>引用格式固定</strong>：用 <code>repo:path::symbol</code>，不写行号、commit 或
          本机绝对路径——文档被移动后引用仍然成立。
        </li>
        <li>
          <strong>文档分流</strong>：教程、memo、面试资料各有格式自由与事实标注要求，
          冲突时以 <code>AGENTS.md</code> 为准，旧的产出流程不再强制。
        </li>
      </ul>
      <p>
        这套规则的来源是证券系统的“唯一可信数据源”：价格、持仓、权限都必须有单一权威来源，
        不能多个系统各自维护再互相对齐。知识治理同理——同一事实只允许一个可核对的基线。
      </p>

      <h2>与其他项目的关联</h2>
      <ul>
        <li>
          <Link to="/projects/secrag">SecRAG</Link>：增量入库的“稳定 ID + 内容哈希 + 跳过未变更”
          与本仓库的源码基线校验是同一套思路
        </li>
        <li>
          <Link to="/projects/agent-skills">agent-skills</Link>：Harness 维度的能力分发在这里落地——
          单一源码、配置驱动、冲突停止、幂等同步
        </li>
        <li>
          <Link to="/projects/llm-wiki-mcp">llm-wiki-mcp</Link>：知识写入的“候选 → 评审 → 落盘”
          机制在这里成为工具契约
        </li>
      </ul>

      <h2>从客户端工程迁移过来的判断</h2>
      <p>
        这个仓库体现的是我从 iOS / 鸿蒙客户端转向 AI 工程时的一个判断：
        <strong>可维护、可测试、可追溯，这三件事在哪个领域都决定系统能不能长期跑</strong>。
      </p>
      <ul>
        <li>客户端的版本管理 + 变更日志 → 源码基线 + 台账</li>
        <li>客户端的单元测试 + 回归 → 验收证据 + 失败样例回归</li>
        <li>客户端的模块化 + 依赖锁定 → 生态独立目录 + 独立依赖</li>
        <li>客户端的崩溃监控 + 热修复 → 文档新鲜度检查 + 弃用 API 停用</li>
      </ul>

      <h2>适用边界</h2>
      <ul>
        <li>这是个人知识工程仓库，不是产品，也没有面向终端用户的功能。</li>
        <li>仓库为私有，面试时可现场演示目录、规则与提交历史。</li>
        <li>
          <code>docs/langchain/</code> 的 62 篇文档经过源码校准，但 LangChain API 变化快，
          具体用法仍需按当前版本复核。
        </li>
        <li>
          教程的 <code>status</code> 多为 research-compiled（研究编译），基于官方文档与源码，
          不是原创实战案例；边界写在各篇开头。
        </li>
      </ul>
    </>
  );
}
