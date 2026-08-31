import { Link } from "react-router-dom";

export function KnowledgeGovernanceSopContent() {
  return (
    <>
      <h2>为什么需要知识治理 SOP</h2>
      <p>
        AI 工程学习的最大风险不是"学得慢"，而是"学了错的东西还不知道"。当学习内容来自 GitHub 源码、官方文档、行业文章和视频笔记时，如果没有可追溯的校准机制，就会出现：API 已经弃用但笔记还在教旧用法、本地代码 HEAD 与文档引用的 commit 不一致、网页摘要被当成源码事实。
      </p>
      <p>
        我在 <Link to="/projects/ai-engineering-hub">ai-engineering-hub</Link> 中建立了一套严格的知识治理 SOP，核心目标是：<strong>每一条写入学习文档的技术事实，都能追溯到具体源码路径和 commit hash</strong>。
      </p>

      <h2>核心原则：停止门禁优先于执行</h2>
      <p>
        SOP 的第一原则是"停止门禁"——任何一步发现条件不满足，必须立即停止，不得用猜测、临时替代或网页摘要绕过。具体停止条件：
      </p>
      <ul>
        <li>找不到或无法确认目标源码路径、目标 commit、运行环境或依赖锁定</li>
        <li>本地工作树 HEAD 与源索引记录的 branch_commit 不一致</li>
        <li>源码读取工具不可用或无法读取已确认提交的目标源码</li>
        <li>目标生态的项目环境无法建立，或锁定依赖与源码存在无法解释的冲突</li>
        <li>候选 API、示例或文档已被标记为弃用，且找不到当前受支持的公共替代方案</li>
      </ul>
      <p>
        停止时只报告可复现的具体问题、已完成的只读检查和需要用户决定的事项。不得以猜测路径、未锁定依赖或网页摘要绕过门禁。
      </p>

      <h2>三阶段流程：Search → Execute → Verify</h2>

      <h3>阶段 1：Search — 识别边界与已有资产</h3>
      <p>写入前完成只读检查：阅读项目 AGENTS.md、README、配置、示例和测试；检查已有文档目录、生态配置、队列和快照；读取源索引文件确认本地源码路径和唯一可信基线 commit。</p>
      <p>
        关键纪律：对每个参与仓库，逐字记录 branch_commit，并用本地工作树 HEAD 校验其 @ 后的 commit hash。队列和快照必须复用该完整字符串，不得自行只记录 hash、改写分支名或采用其他提交。
      </p>

      <h3>阶段 2：Execute — 源码校准与内容写入</h3>
      <p>
        学习文档中的技术事实必须以源索引映射的本地源码为依据。正常情况下使用 RepoPrompt MCP 读取并检索当前公共导出、核心实现、项目配置、最小示例和相关测试；同时核验弃用标记、迁移说明和当前替代入口。
      </p>
      <p>
        <strong>README、网页文档、发布说明和模型记忆只能用于定位候选内容，不能单独证明公共 API 或运行行为。</strong>已弃用的 API、弃用文档和迁移文档不得作为实现与事实依据，必须改用当前受支持的公共 API。
      </p>

      <h3>阶段 3：Verify — 可运行性验证与交付检查</h3>
      <p>
        写入后必须验证：教程中的代码示例能在锁定环境中运行；API 导入路径、参数和行为与源码一致；弃用标记已正确标注；源索引引用完整且可追溯。验证不通过时回到对应阶段修复，不得交付未验证的内容。
      </p>

      <h2>源码校准机制</h2>
      <p>
        整个 SOP 的核心是<strong>唯一可信源码基线</strong>机制：
      </p>
      <ul>
        <li><code>local-source-repos.json</code> 是 Wiki 源索引的软链接，记录每个仓库的本地源码路径和 branch_commit（分支@hash 完整字符串）</li>
        <li>每次写入前必须校验本地 HEAD 与索引中的 hash 一致，不一致则停止</li>
        <li>教程正文只引用根目录 JSON，不重复记录 hash，避免双写不一致</li>
        <li>队列和快照逐字记录完整 branch_commit 字符串</li>
      </ul>
      <p>
        这套机制的设计灵感来自证券交易系统的"唯一可信数据源"原则：交易系统中价格、持仓、权限都必须有唯一权威来源，不能多个系统各自维护然后"互相对齐"。知识治理同理——源码事实只能有一个权威来源，其他地方只能引用，不能复制。
      </p>

      <h2>我的实践</h2>
      <p>
        这套 SOP 不是理论设计，而是我在 ai-engineering-hub 中实际执行的工作流。具体落地：
      </p>
      <ul>
        <li><strong>4 个生态目录</strong>（langchain/llamaindex/autogpt/comfyui）各自维护独立的 pyproject.toml 和 uv.lock，不在根目录合并框架依赖</li>
        <li><strong>56 篇 langchain 学习文档</strong>每篇都经过源码校准，从 01-messages 到 56-server-auth-security</li>
        <li><strong>7 个 Agent Engineering 专题教程</strong>基于官方文档和行业调研，每篇标注 source_type、source_urls、retrieved_at、status</li>
        <li><strong>validate_tutorial.py</strong> 自动验证教程结构和引用完整性</li>
        <li><strong>ops/ecosystems.json</strong> 定义已启用生态及其运行环境</li>
      </ul>
      <p>
        与 <Link to="/projects/secrag">SecRAG</Link> 的关联：SecRAG 的文档管理和知识库入库也遵循类似的"增量+校验"原则——稳定文档 ID、内容哈希比对、版本管理、更新跳过，本质上和知识治理 SOP 的"唯一可信基线+变更校验"是同一套工程思维。
      </p>

      <h2>适用边界</h2>
      <ul>
        <li>这套 SOP 适用于需要源码级准确性的技术学习文档，不适用于概念科普或观点文章</li>
        <li>停止门禁可能降低内容产出速度，但能防止"学了错的东西还不知道"的更大风险</li>
        <li>RepoPrompt MCP 不可用时需要用户明确选择"继续"才能降级为本地文件读取，且必须记录该例外</li>
      </ul>

      <h2>相关笔记</h2>
      <ul>
        <li>
          <Link to="/notes/harness-engineering">Harness Engineering</Link> — Agent 运行环境的工程约束
        </li>
        <li>
          <Link to="/notes/eval-engineering">Eval Engineering</Link> — 把质量变成可回归的工程信号
        </li>
      </ul>
    </>
  );
}
