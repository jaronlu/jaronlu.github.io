import { Link } from "react-router-dom";

export function HarnessEngineeringContent() {
  return (
    <>
      <h2>Harness 是什么</h2>
      <p>
        Harness 是所有不属于模型本身、但决定模型如何工作的代码、配置、数据和执行逻辑：
      </p>
      <blockquote>
        Agent = Model + Harness<br />
        Harness = 上下文装配 + 工具执行 + 文件/沙箱 + 状态/记忆 + 编排 + hooks + 验证 + 权限 + 观测 + 恢复
      </blockquote>
      <p>
        模型负责在当前上下文中生成判断和下一步；harness 负责把判断变成真实动作，并把环境事实返回给模型。文件读写、命令执行、浏览器、MCP、测试、日志、快照、审批、重试和退出状态都属于 harness 的职责。
      </p>
      <p>
        这也解释了为什么相同底层模型在 Codex、Claude Code、Cursor 或自建 runtime 中表现不同：模型、工具、上下文、状态和反馈回路不同。
      </p>

      <h2>什么时候需要专门构建 Harness</h2>
      <p>适合构建专用 harness 的信号：</p>
      <ul>
        <li>同一工作流反复发生，输入和交付物可以定义</li>
        <li>Agent 需要读写文件、运行代码、查询系统或持续多轮行动</li>
        <li>结果必须可回放、可审计、可评估或可恢复</li>
        <li>任务包含明确的只读、提议、执行权限层级</li>
        <li>人类希望描述目标，而不是每轮手动搬运上下文和工具结果</li>
      </ul>
      <p>
        原则是从最小可运行版本开始。每增加一个 planner、sub-agent、hook 或记忆层，都要能说明它解决了哪个已经观察到的失败。
      </p>

      <h2>最小 Harness 架构</h2>
      <blockquote>
        入口（CLI/TUI/Web/API）<br />
        → Run 管理（task、run_id、状态、日志、取消、恢复）<br />
        → Agent loop（模型调用、工具调用、上下文更新）<br />
        → Policy（权限、审批、轮数、预算、网络和文件边界）<br />
        → Tools（函数、MCP、Shell、浏览器、代码执行）<br />
        → Environment（worktree、容器、数据库、测试、观测栈）<br />
        → Artifacts（计划、证据、报告、补丁、测试结果）
      </blockquote>
      <p>
        一次 run 应有明确的输入、配置快照、状态机、事件日志、最终产物和退出原因。不要把这些信息只留在聊天记录中。
      </p>

      <h2>核心工程判断</h2>

      <h3>1. 让环境对 Agent 可读</h3>
      <p>
        Agent 只能使用它能发现和读取的知识。存在于人的脑中、聊天记录、未索引的文档或模糊约定中的规则，对 Agent 来说基本不存在。因此应把关键知识放入版本化、可搜索、可验证的项目空间：短入口文件（AGENTS.md）负责导航，详细规则放在 docs/ 目录，知识库要有 owner、更新时间、验证状态和 CI 检查。
      </p>
      <p>
        <strong>过期文档不是无害噪声，它会持续诱导 Agent 采取错误动作。</strong>
      </p>

      <h3>2. Back-pressure：让错误回到循环</h3>
      <p>
        Agent 不能只根据自己的回答判断"已经完成"。Harness 应提供 back-pressure：让外部验证结果阻止错误继续扩散。
      </p>
      <blockquote>
        模型声称完成 → 运行测试/类型检查/lint/schema 校验 → 失败信息重新注入 → Agent 修改 → 重新验证
      </blockquote>
      <p>
        验证器要尽量独立于生成器，避免 Agent 自己生成、自己宣布成功。这和 <Link to="/projects/secrag">SecRAG</Link> 中 Verifier 节点独立于 Reasoner 节点的设计是同一个原则。
      </p>

      <h3>3. 权限做成运行模式，不是 prompt 里的愿望</h3>
      <blockquote>
        investigate：只读、收集证据、生成报告<br />
        propose：生成补丁或操作草稿，不执行副作用<br />
        execute：执行经过授权的动作<br />
        deploy：发布到指定环境，需要更高等级批准
      </blockquote>
      <p>
        服务端和 harness 都要检查：用户、资源、动作、环境、审批和状态。模型不能自行提升权限，也不能通过修改提示、工具参数或状态文件绕过审批。将发送、删除、退款、部署、公开发布和权限变更放到人工 gate 之后。
      </p>

      <h3>4. Hooks：把"提醒"变成"执行约束"</h3>
      <p>可用 hook 位置：</p>
      <ul>
        <li>工具调用前：检查命令、路径、目标资源和权限</li>
        <li>文件写入后：运行格式化、类型检查或局部测试</li>
        <li>提交前：运行安全和结构校验</li>
        <li>推送或发布前：要求人工批准</li>
        <li>会话接近上限：压缩并生成交接文件</li>
      </ul>
      <p>
        成功路径尽量安静，失败路径返回具体、可行动的错误。测试通过时不必把大量输出重新塞给 Agent；测试失败时要返回失败命令、文件、断言和修复方向。
      </p>

      <h3>5. 通过失败不断加固</h3>
      <p>
        Harness Engineering 的核心反馈方式是：每次真实失败都问"环境缺少什么能力或约束"，然后把解决方案固化为可执行资产。
      </p>
      <ul>
        <li>失败：Agent 修改了相对路径导致错文件 → 改进：工具要求绝对路径，并在服务端校验</li>
        <li>失败：Agent 跳过测试就宣布完成 → 改进：完成 hook 必须运行测试，失败则回灌错误</li>
        <li>失败：规则文件越来越长且过期 → 改进：拆成文档目录，入口只保留导航，CI 检查新鲜度</li>
        <li>失败：并行 Agent 互相覆盖文件 → 改进：独立 worktree + 单 writer + artifact 合并</li>
      </ul>

      <h2>我的实践</h2>
      <p>
        <Link to="/projects/secrag">SecRAG</Link> 是 Harness Engineering 原则在金融问答场景的具体落地：
      </p>
      <ul>
        <li><strong>身份与权限</strong>：Bearer token 服务端派生角色，不信任请求体身份；5 种角色决定可检索材料和可调用工具</li>
        <li><strong>Back-pressure</strong>：Verifier 节点独立校验来源和数字，不通过则回退 Reasoner 重新推理；合规检查是第三个独立校验节点</li>
        <li><strong>状态与审计</strong>：SQLite 持久化会话、审计记录和入库任务状态；完整审计只在服务端保存，不通过问答接口返回</li>
        <li><strong>沙箱与隔离</strong>：Docker 多阶段构建 + docker-compose 一键部署；增量入库引擎支持内容哈希比对和版本管理</li>
        <li><strong>观测与评估</strong>：检索评估（recall@5/10、MRR、precision@5）、回答评估、端到端评估、合规评估、权限冒烟检查</li>
      </ul>
      <p>
        <Link to="/projects/agent-skills">agent-skills</Link> 则体现了 Harness 的"能力分发"维度：Skills 单一源码、配置驱动分发、冲突保护、幂等同步——让不同 Agent 客户端在同一套能力定义下运行，避免能力漂移。
      </p>

      <h2>来源与边界</h2>
      <p>
        本文基于 OpenAI Harness Engineering、LangChain Agent Harness 解剖、Martin Fowler 和 Addy Osmani 的工程文章，以及 AI Harness 实战视频笔记整理，保留框架无关的方法。具体工具景观变化较快，架构原则需结合当前文档验证。
      </p>

      <h2>相关笔记</h2>
      <ul>
        <li>
          <Link to="/notes/eval-engineering">Eval Engineering</Link> — 把质量变成可回归的工程信号
        </li>
        <li>
          <Link to="/notes/loop-engineering">Loop Engineering</Link> — Agent 循环的设计与失败模式
        </li>
        <li>
          <Link to="/notes/knowledge-governance-sop">知识治理 SOP</Link> — 可追溯的学习文档工作流
        </li>
      </ul>
    </>
  );
}
