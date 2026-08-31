import { Link } from "react-router-dom";

export function EvalEngineeringContent() {
  return (
    <>
      <h2>Eval 不是给模型打分</h2>
      <p>
        Eval engineering 不是"给模型打一个分"，而是把 Agent 应该完成的能力、真实运行环境、验证器和持续改进流程做成可重复执行的测试系统。
      </p>
      <p>
        传统软件测试针对确定性函数；Agent 的输出会受模型、提示、工具结果、上下文和随机性影响，因此需要同时验证：
      </p>
      <blockquote>
        输入样例 + 期望行为 → 被测 Agent/节点/工具链 → 最终结果、轨迹、成本和错误 → 规则或 LLM 验证器 → 失败分析 → 新 eval → 修复 → 回归运行
      </blockquote>
      <p>
        一个完整 eval 至少包含三部分：<strong>Task</strong>（给 Agent 的具体任务和输入）、<strong>Environment</strong>（任务运行时可见的数据、工具、权限、状态和故障模式）、<strong>Verifier</strong>（判断任务是否完成，以及为什么通过或失败）。
      </p>
      <p>
        <strong>不要把最终答案正确当成 Agent 正确。</strong>Agent 可能碰巧答对，却调用了错误工具、重复调用、引用了不存在的来源，或执行了不应执行的写操作。
      </p>

      <h2>什么时候开始做 Eval</h2>
      <p>
        当系统具备一个稳定能力，就应建立最小 eval：例如"回答文档问题并引用正确文档""把工单路由到正确队列""退款前确认订单""代码修改必须通过测试"。
      </p>
      <p>先不要追求大数据集。第一轮应覆盖：</p>
      <ul>
        <li><strong>正常样例</strong>：最常见的成功路径</li>
        <li><strong>边界样例</strong>：缺字段、歧义、空结果、超长输入</li>
        <li><strong>失败样例</strong>：历史上已经失败的真实请求</li>
        <li><strong>安全样例</strong>：越权写入、提示注入、敏感数据和不可逆动作</li>
      </ul>
      <p>
        如果"成功"无法写成可观察的条件，先定义产品契约，不要先调 prompt。一个不能稳定判断的目标无法成为有效 eval。
      </p>

      <h2>五阶段落地路线</h2>

      <h3>阶段 1：定义能力与黄金数据</h3>
      <p>
        为每项能力建立输入、参考结果和验收标准。数据可以是 JSONL、数据库表或代码 fixture，但必须可版本化。参考结果不必总是一段标准答案——对于 Agent，结构化期望往往更稳：目标路由、必须调用的工具、禁止调用的工具、允许的状态变化和必须引用的证据。
      </p>
      <p>
        数据集应包含真实分布，而不是只挑容易通过的例子。每条失败样例保留来源、时间、产品版本和失败原因，避免以后无法解释分数变化。
      </p>

      <h3>阶段 2：先做可观测性</h3>
      <p>没有轨迹就无法做失败分析。至少记录：</p>
      <ul>
        <li>输入、输出和会话上下文摘要</li>
        <li>模型与提示版本</li>
        <li>节点进入和退出时间</li>
        <li>工具名称、参数、返回值摘要、错误和重试次数</li>
        <li>关键状态变更、权限判断和人工审批</li>
        <li>token、延迟、费用和最终结果</li>
      </ul>

      <h3>阶段 3：从简单指标开始</h3>
      <p>指标按确定性从高到低排列：</p>
      <table>
        <thead>
          <tr>
            <th>指标</th>
            <th>适用问题</th>
            <th>推荐验证方式</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Exact match / string check</td>
            <td>分类、状态、工具名、路由</td>
            <td>程序比较</td>
          </tr>
          <tr>
            <td>JSON schema / domain-range</td>
            <td>结构化输出和参数合法性</td>
            <td>Schema 校验</td>
          </tr>
          <tr>
            <td>Tool call check</td>
            <td>是否调用、调用次数、参数和顺序</td>
            <td>轨迹规则</td>
          </tr>
          <tr>
            <td>State transition check</td>
            <td>是否越权写入或跳过审批</td>
            <td>状态机规则</td>
          </tr>
          <tr>
            <td>Reference-based judge</td>
            <td>开放式回答的事实和完整性</td>
            <td>参考答案 + rubric</td>
          </tr>
          <tr>
            <td>Pairwise judge</td>
            <td>两个版本哪个更好</td>
            <td>同输入成对比较</td>
          </tr>
        </tbody>
      </table>
      <p>
        先用规则覆盖能规则化的部分，再使用 LLM judge 处理开放式质量。LLM judge 必须有明确 rubric、结构化输出和少量人工校准；不能把"看起来不错"作为指标。
      </p>

      <h3>阶段 4：分别评估答案、单步和完整轨迹</h3>
      <p>对 Agent 至少建立三类 eval：</p>
      <ol>
        <li><strong>最终答案评估</strong>：正确性、相关性、完整性、引用质量和风格</li>
        <li><strong>单步评估</strong>：分类节点是否选对分支，工具选择是否合理，参数是否符合契约</li>
        <li><strong>轨迹评估</strong>：节点和工具的顺序、额外步骤、遗漏步骤、重试和状态变化</li>
      </ol>
      <p>
        轨迹对顺序敏感。使用了相同工具但顺序错误，可能导致错误上下文或不必要成本，不能只统计"工具是否出现过"。
      </p>

      <h3>阶段 5：接入开发与发布流程</h3>
      <blockquote>
        每次提交：小型 smoke eval，快速发现明显回归<br />
        每次合并：完整能力集，比较质量、轨迹、延迟和成本<br />
        发布前：历史失败集 + 安全集 + 代表性真实样本<br />
        线上运行：采样轨迹、告警、人工反馈回流为新 eval
      </blockquote>
      <p>
        发布门槛不要只设一个总分。至少分别设置关键能力通过率、禁止动作次数、引用正确率、p95 延迟和费用上限。<strong>任何不可逆写操作的安全违规都应作为阻断条件，而不是被平均分抵消。</strong>
      </p>

      <h2>Verifier 设计</h2>
      <p>Verifier 也会犯错，必须像 Agent 一样被观察和迭代。一个 verifier 应回答：</p>
      <blockquote>
        任务是否完成？ pass / fail<br />
        违反了哪条标准？ reason_code<br />
        证据在哪里？ evidence_refs<br />
        判断是否确定？ confidence
      </blockquote>
      <p>
        检查 reward hacking：Agent 是否能通过堆砌无关引用、声称执行过不存在的动作、暴露答案材料或满足代理指标来拿高分。为此要同时查看 Agent 轨迹和 verifier 轨迹。
      </p>
      <p>
        对 LLM judge 做人工抽样，计算混淆矩阵。安全相关指标优先控制 false positive，因为把危险行为判成成功的代价通常更高。
      </p>

      <h2>从失败到新 Eval</h2>
      <p>持续改进的最小闭环是：</p>
      <blockquote>
        采集轨迹 → 聚类失败 → 选择高价值失败 → 写成可重复任务 → 修复 Agent → 重跑原失败集和回归集 → 评估副作用
      </blockquote>
      <p>
        失败分析不要只按"回答错了"分类。建议区分：路由错误、检索错误、工具参数错误、工具失败处理错误、状态错误、证据不足、引用错误、过度行动、超时和成本异常。
      </p>

      <h2>我的实践</h2>
      <p>
        <Link to="/projects/secrag">SecRAG</Link> 的评估体系是 Eval Engineering 原则在金融问答场景的具体落地：
      </p>
      <ul>
        <li><strong>检索评估</strong>（scripts/eval_retrieval.py）：recall@5/10、MRR、precision@5，用真实证券问题和标注文档片段测试</li>
        <li><strong>回答评估</strong>（scripts/eval_answers.py）：基于预设问题集和参考答案，检查引用来源、数字准确性和合规性</li>
        <li><strong>端到端评估</strong>（scripts/eval_e2e.py）：模拟真实用户请求，测量完整回答质量、延迟和 token 消耗</li>
        <li><strong>合规评估</strong>（scripts/eval_compliance.py）：测试风险揭示、免责声明、适当性检查是否在需要时触发</li>
        <li><strong>权限冒烟检查</strong>（scripts/smoke_permissions.py）：验证每种角色能看到什么、不能看到什么，防止越权</li>
        <li><strong>256 个测试用例</strong>（4987 行测试代码，23 个测试文件）：覆盖检索、工具、安全、合规、状态、增量入库等模块</li>
      </ul>
      <p>
        这套评估体系的核心判断是：<strong>金融问答的"正确"不只是答案对，还包括来源可追溯、数字可验证、合规有揭示、权限不越界</strong>。因此 SecRAG 的 eval 不是单一分数，而是检索质量、回答质量、合规性、权限隔离四个维度的独立评估。
      </p>

      <h2>来源与边界</h2>
      <p>
        本文基于 Galileo Eval Engineering 五课教程、LangChain Eval Engineering Skill 介绍和 OpenAI evals 文档整理，保留框架无关的方法。具体工具和平台变化较快（如 OpenAI Evals 平台计划关闭），架构原则需结合当前文档验证。
      </p>

      <h2>相关笔记</h2>
      <ul>
        <li>
          <Link to="/notes/harness-engineering">Harness Engineering</Link> — Agent 运行环境的工程约束
        </li>
        <li>
          <Link to="/notes/loop-engineering">Loop Engineering</Link> — Agent 循环的设计与失败模式
        </li>
        <li>
          <Link to="/notes/rag-principles">RAG 工程原理</Link> — 检索增强生成的核心设计取舍
        </li>
      </ul>
    </>
  );
}
