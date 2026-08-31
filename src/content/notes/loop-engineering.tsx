import { Link } from "react-router-dom";

export function LoopEngineeringContent() {
  return (
    <>
      <h2>核心框架：Harness（基础设施）+ Loop（循环）</h2>
      <p>Loop Engineering 分为两个层次：</p>
      <ul>
        <li>
          <strong>Harness（基础设施）</strong>：固定配置文件，定义规则和权限，不随运行改变
        </li>
        <li>
          <strong>Loop（循环）</strong>：在基础设施之上运行的迭代流程，包含目标、行动、验证、记忆写入、继续/停止决策
        </li>
      </ul>
      <blockquote>
        关键洞察：厨房与食谱的比喻，两者缺一不可。多数失败源于混淆层次，在基础设施层问题中错误地重写提示词。
      </blockquote>

      <h2>三阶段演进</h2>
      <table>
        <thead>
          <tr>
            <th>阶段</th>
            <th>模式</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>第一阶段</td>
            <td>逐行驾驶</td>
            <td>模型自动补全，人 Tab Tab Tab</td>
          </tr>
          <tr>
            <td>第二阶段</td>
            <td>并行手动</td>
            <td>同时开多个 Agent 会话，人当调度员</td>
          </tr>
          <tr>
            <td>第三阶段</td>
            <td>Loop 驱动</td>
            <td>设计循环系统，让 Agent 自主决定该干什么</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Loop Engineering = 第三阶段。</strong> 不再亲手写每条提示词，去设计那个替你写提示词的系统。
      </p>

      <h2>七层基础设施（Harness）</h2>
      <table>
        <thead>
          <tr>
            <th>层</th>
            <th>文件/目录</th>
            <th>核心作用</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td><code>CLAUDE.md</code></td>
            <td>常驻上下文，越精简越好，需定期修剪。过大的常驻上下文会显著拉低任务完成率</td>
          </tr>
          <tr>
            <td>2</td>
            <td><code>settings.json</code></td>
            <td>权限白名单 + hook 配置；机密单独隔离存放</td>
          </tr>
          <tr>
            <td>3</td>
            <td><code>hooks/</code></td>
            <td>PreToolUse / PostToolUse / Stop 三事件；成功静默、失败 loud（策略底线）</td>
          </tr>
          <tr>
            <td>4</td>
            <td><code>agents/</code></td>
            <td>子代理，在<strong>全新上下文</strong>中调用，解决自我确认偏差</td>
          </tr>
          <tr>
            <td>5</td>
            <td><code>skills/</code></td>
            <td>渐进加载，<strong>同一任务出现第三次时才建</strong>，避免技能堆积消耗 token</td>
          </tr>
          <tr>
            <td>6</td>
            <td><code>.mcp.json</code></td>
            <td>MCP 工具声明；只用当前需要的，启用写权限前必须有 audit hook</td>
          </tr>
          <tr>
            <td>7</td>
            <td><code>MEMORY.md</code> + <code>vault/</code></td>
            <td>分层持久化：跨会话变化 vs 跨会话不变；<strong>必须每会话修剪</strong></td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>单向依赖</strong>：基础设施定义规则 → 循环在规则内运行。
      </p>

      <h2>Loop 的 5 个组件 + 1 根脊柱</h2>
      <table>
        <thead>
          <tr>
            <th>组件</th>
            <th>作用</th>
            <th>关联技术</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>心跳（Heartbeat）</td>
            <td>定时触发，自动发现任务</td>
            <td>cron, scheduler</td>
          </tr>
          <tr>
            <td>工作树（Work Tree）</td>
            <td>多智能体隔离的 Git 分支目录</td>
            <td>git worktree</td>
          </tr>
          <tr>
            <td>技能（Skill）</td>
            <td>项目规则写一次，每个 Agent 每次都读</td>
            <td>SKILL.md</td>
          </tr>
          <tr>
            <td>连接器（Connector）</td>
            <td>通过 MCP 接到真实工具</td>
            <td>
              <Link to="/notes/mcp-protocol">MCP 协议</Link>
            </td>
          </tr>
          <tr>
            <td>子智能体（Sub-agents）</td>
            <td>写代码和审代码拆开</td>
            <td>职责隔离、独立上下文</td>
          </tr>
          <tr>
            <td><strong>记忆（Memory）</strong></td>
            <td>持久化状态：做过什么、试过什么、还差什么</td>
            <td>
              <Link to="/notes/agent-runtime">Agent Runtime</Link>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>五步循环（Loop）</h2>

      <h3>步骤 1：Goal spec（目标规格）</h3>
      <p>
        存于磁盘，循环每轮重新读取。明确定义“完成标准”和“停止条件”。
        <strong>没有它的后果</strong>：代码在写、测试在过，但解决的不是你的问题，失败看起来像进展。
      </p>

      <h3>步骤 2：Plan → Act → Verify</h3>
      <p>
        最小可行循环：计划 → 执行 → <strong>独立验证</strong>。省略验证的后果：错误输出成为下一轮输入，
        <strong>自信垃圾（confident garbage）复利增长</strong>。
      </p>

      <h3>步骤 3：Sub-agent fan-out（子代理扇出）</h3>
      <p>
        单一目标分支为多个独立子任务（如分析多篇文章、修复多个文件）。一个臃肿上下文做不到，多个小型上下文可以。
      </p>

      <h3>步骤 4：Scheduler and persistence（调度与持久化）</h3>
      <p>
        调度器<strong>故意比代理更笨</strong>，只负责定时触发，不做状态判断。每次迭代必须序列化“做了什么、尝试了什么、下一步是什么”。
      </p>

      <h3>步骤 5：三大失败模式识别</h3>
      <table>
        <thead>
          <tr>
            <th>失败模式</th>
            <th>本质</th>
            <th>根因</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Confident garbage</strong></td>
            <td>错误输出通过验证并跨轮复利</td>
            <td>验证步骤缺失或薄弱</td>
          </tr>
          <tr>
            <td><strong>Context rot</strong></td>
            <td>模型在累积历史超过阈值后退化</td>
            <td>单长上下文持续膨胀</td>
          </tr>
          <tr>
            <td><strong>Ralph Wiggum loops</strong></td>
            <td>同一迭代重复执行</td>
            <td>磁盘状态未捕获进度，代理重新计划已完成步骤</td>
          </tr>
        </tbody>
      </table>

      <h2>单轮迭代完整流程</h2>
      <ol>
        <li>cron 触发运行脚本</li>
        <li>调用 Agent</li>
        <li>读取常驻上下文与权限配置（基础设施 1、2）</li>
        <li>每次编辑应用 PostToolUse hook（基础设施 3）</li>
        <li>读取目标规格与状态文件（循环步骤 1）</li>
        <li>计划并执行（循环步骤 2）</li>
        <li>调度 verifier 子代理到全新上下文验证（基础设施 4 + 循环验证）</li>
        <li>写回状态文件（循环步骤 3/状态同步）</li>
        <li>如有新偏好，更新记忆文件（基础设施 7）</li>
        <li>退出，等待下一次触发（循环步骤 4）</li>
      </ol>
      <p>
        <strong>缺失任一基础设施文件的后果</strong>：无常驻上下文文件 → 每轮重新推导项目结构；无 verifier 子代理 → 主上下文内验证，永远通过；无记忆文件 → 同一修正每周重复应用。
      </p>

      <h2>/goal vs /loop 区别</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>/goal</th>
            <th>/loop</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>触发方式</td>
            <td>立即执行</td>
            <td>按时间表定时执行</td>
          </tr>
          <tr>
            <td>结束条件</td>
            <td>目标达成后自动停止</td>
            <td>不判断完成与否，只负责准时执行</td>
          </tr>
          <tr>
            <td>类比</td>
            <td>跑一个任务</td>
            <td>心跳（Heartbeat）</td>
          </tr>
          <tr>
            <td>适用场景</td>
            <td>一次性但可自动判断的批量任务</td>
            <td>每日重复的内容收集、监控等</td>
          </tr>
        </tbody>
      </table>

      <h2>适用条件（四条全中才值得搭）</h2>
      <ol>
        <li><strong>每周以上都会重复</strong> — 一次性活不值得</li>
        <li><strong>验证能自动化</strong> — 测试、类型检查、Linter 能挡坏结果</li>
        <li><strong>Token 预算扛得住</strong> — Loop 反复读上下文、重试、试探</li>
        <li><strong>Agent 手里有资深工程师那套工具</strong> — 日志、能跑代码看崩哪里的环境</li>
      </ol>

      <h2>风险与提醒</h2>
      <ul>
        <li><strong>理解鸿沟</strong>：Loop 越快交付，你没亲手写的代码和你真正搞懂的东西差距越大</li>
        <li><strong>最危险的姿态</strong>：舒舒服服接受 Loop 吐出来的一切</li>
        <li><strong>Over-baking（发酵过头）</strong>：无人盯着的 Loop 也在无人盯着地犯错</li>
        <li>验证永远在人手上，需要在适合的时间点具备自我验证能力</li>
      </ul>

      <h2>我的实践</h2>
      <p>
        <Link to="/projects/secrag">SecRAG</Link> 的六节点工作流是 Loop Engineering 在单 Agent 场景下的落地：Planner → Retriever → Reasoner → Verifier → Composer 构成 Plan → Act → Verify 循环，检索不足时回退 Planner 是"失败模式识别 + 状态持久化"的具体实现——State 中记录了已完成的检索计划和结果，回退时不会重新规划已完成的步骤。
      </p>
      <p>
        在 Harness 层面，我维护的个人知识库使用了七层基础设施中的核心几层：<code>CLAUDE.md</code> 作为常驻上下文（定期修剪，避免上下文膨胀）、<code>skills/</code> 渐进加载（<Link to="/projects/agent-skills">agent-skills</Link> 解决的是 skills 层的分发和版本一致性问题）、<code>.mcp.json</code> 声明工具（<Link to="/projects/llm-wiki-mcp">llm-wiki-mcp</Link> 提供知识操作层）、<code>MEMORY.md</code> 跨会话持久化（每会话修剪，避免记忆腐烂）。
      </p>
      <p>
        三大失败模式中我最警惕的是 <strong>confident garbage</strong>：这也是 SecRAG 必须有独立 Verifier 节点的原因——验证不能和推理在同一个上下文中做，否则模型会"自己验证自己通过"。这和证券交易里"下单和风控必须分离"是同一个工程原则。
      </p>

      <h2>相关笔记</h2>
      <ul>
        <li>
          <Link to="/notes/agent-principles">Agent 原理</Link>
        </li>
        <li>
          <Link to="/notes/agent-runtime">Agent Runtime</Link>
        </li>
        <li>
          <Link to="/notes/mcp-protocol">MCP 协议</Link>
        </li>
      </ul>
    </>
  );
}
