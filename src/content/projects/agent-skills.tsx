import { Link } from "react-router-dom";

export function AgentSkillsContent() {
  return (
    <>
      <h2>项目一句话</h2>
      <p>
        <code>agent-skills</code> 解决的不是"再写几个 Prompt"，而是自研能力如何跨多个 Agent 客户端保持同一份源码、明确版本边界和可验证的安装状态。
      </p>

      <h2>为什么做这个项目</h2>
      <p>
        多个 Agent 客户端各自维护一份 Skill 副本，会快速出现三个问题：内容漂移（同一个 Skill 在不同客户端内容不一致）、修复不同步（改了源码但某个客户端没更新）、运行时到底加载了哪一版无法确认。这个项目把源码、分发配置和验证工具收敛到一个仓库中。
      </p>

      <h2>系统架构</h2>
      <p>
        分发链路拆成四层：唯一源码 → 配置校验 → 冲突检测与增量同步 → 多客户端落地，每一步都可独立验证，而不是"把文件复制过去"了事。
      </p>
      <figure className="arch-figure">
        <svg
          viewBox="0 0 820 300"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="agent-skills 分发架构：skills 唯一源码经配置校验、冲突检测、增量同步分发到 Codex、Claude、Hermes，最终验证路径并记录状态"
        >
          <defs>
            <marker id="asarr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            </marker>
            <marker id="asarra" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
            </marker>
          </defs>
          <style>{`
            .asn { fill: none; stroke: var(--line-strong); stroke-width: 1; }
            .asn-a { fill: none; stroke: var(--accent); stroke-width: 1.2; }
            .ast { font-family: var(--mono); font-size: 12px; fill: var(--ink); font-weight: 600; }
            .ass { font-family: var(--sans); font-size: 10px; fill: var(--muted); }
            .asa { font-family: var(--mono); font-size: 10px; fill: var(--accent); font-weight: 600; }
            .asl { stroke: var(--ink); stroke-width: 1; fill: none; }
            .asla { stroke: var(--accent); stroke-width: 1; fill: none; }
          `}</style>

          {/* 唯一源码层 */}
          <rect className="asn" x="310" y="12" width="200" height="44" />
          <text className="ast" x="410" y="32" textAnchor="middle">skills/</text>
          <text className="ass" x="410" y="48" textAnchor="middle">唯一源码 · SKILL.md + 脚本 + 参考资料</text>

          {/* 箭头：读取配置 + 校验 */}
          <line className="asl" x1="410" y1="56" x2="410" y2="74" markerEnd="url(#asarr)" />
          <text className="asa" x="424" y="68">读取配置 + 校验</text>

          {/* 分发引擎层 */}
          <rect className="asn-a" x="260" y="78" width="300" height="52" />
          <text className="ast" x="410" y="100" textAnchor="middle">manage_skill_links.py</text>
          <text className="ass" x="410" y="118" textAnchor="middle">计划生成 · 冲突检测 · 增量同步 · dry-run</text>

          {/* 箭头分三路 */}
          <line className="asl" x1="410" y1="130" x2="410" y2="148" markerEnd="url(#asarr)" />
          <path className="asl" d="M 410 148 L 200 148 L 200 166" markerEnd="url(#asarr)" />
          <path className="asl" d="M 410 148 L 410 166" markerEnd="url(#asarr)" />
          <path className="asl" d="M 410 148 L 620 148 L 620 166" markerEnd="url(#asarr)" />

          {/* 客户端层 */}
          <rect className="asn" x="120" y="170" width="160" height="44" />
          <text className="ast" x="200" y="190" textAnchor="middle">Codex</text>
          <text className="ass" x="200" y="206" textAnchor="middle">~/.codex/skills/</text>

          <rect className="asn" x="330" y="170" width="160" height="44" />
          <text className="ast" x="410" y="190" textAnchor="middle">Claude</text>
          <text className="ass" x="410" y="206" textAnchor="middle">~/.claude/skills/</text>

          <rect className="asn" x="540" y="170" width="160" height="44" />
          <text className="ast" x="620" y="190" textAnchor="middle">Hermes</text>
          <text className="ass" x="620" y="206" textAnchor="middle">配置驱动路径</text>

          {/* 箭头：最终路径验证 */}
          <line className="asla" x1="200" y1="214" x2="200" y2="236" markerEnd="url(#asarra)" />
          <line className="asla" x1="410" y1="214" x2="410" y2="236" markerEnd="url(#asarra)" />
          <line className="asla" x1="620" y1="214" x2="620" y2="236" markerEnd="url(#asarra)" />
          <text className="asa" x="410" y="230" textAnchor="middle">最终路径验证 + 状态记录</text>

          {/* 状态记录层 */}
          <rect className="asn" x="280" y="244" width="260" height="40" />
          <text className="ast" x="410" y="262" textAnchor="middle">本地状态记录</text>
          <text className="ass" x="410" y="278" textAnchor="middle">受管链接清单 · 源路径 · 目标路径 · 校验时间</text>
        </svg>
        <figcaption>红色标注的是两个确定性约束点：分发引擎的冲突检测，以及落地后的最终路径验证。状态记录保证幂等——重复运行不会产生重复链接。</figcaption>
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
            <td>单一来源</td>
            <td>所有运行包统一维护在 <code>skills/&lt;name&gt;/</code>，包含 SKILL.md、脚本、参考资料和输出资产</td>
          </tr>
          <tr>
            <td>配置驱动分发</td>
            <td><code>config/skill-links.toml</code> 定义目标客户端与 allowlist，只同步明确选择的 Skill</td>
          </tr>
          <tr>
            <td>冲突检测</td>
            <td>同步前检查目标路径是否已存在、是否是受管链接、是否是外部软链接、是否有重复配置</td>
          </tr>
          <tr>
            <td>幂等同步</td>
            <td>状态文件记录已管理的链接，重复运行只修复差异，不产生重复链接；支持路径迁移</td>
          </tr>
          <tr>
            <td>可验证性</td>
            <td><code>status</code> 查看受管状态、<code>check</code> 校验路径一致性、<code>sync --dry-run</code> 预览变更</td>
          </tr>
          <tr>
            <td>安全边界</td>
            <td>不覆盖未受管文件、不覆盖外部软链接、冲突时停止而不是自动覆盖、不纳入个人配置和凭据</td>
          </tr>
        </tbody>
      </table>

      <h2>冲突检测与幂等机制</h2>
      <p>
        分发引擎的核心不是"创建软链接"，而是在创建之前做完整的冲突检测，在创建之后做可验证的状态记录。具体流程：
      </p>
      <ol>
        <li><strong>计划生成</strong>：读取 TOML 配置，为每个 (skill, client) 对生成目标路径，与当前状态文件对比，计算新增 / 更新 / 删除 / 无变化四类操作</li>
        <li><strong>冲突检测</strong>：对每个计划操作检查目标路径——如果路径已存在且不是受管链接（用户自己创建的文件或目录），停止并报告；如果是外部软链接（指向非 skills/ 源码的路径），停止并报告；如果配置中存在重复目标，停止并报告</li>
        <li><strong>增量同步</strong>：只执行无冲突的操作。已存在且指向正确源码的链接跳过（幂等），指向旧路径的链接修复（路径迁移），配置中移除的链接清理</li>
        <li><strong>最终验证</strong>：同步后逐个校验链接的最终解析路径是否等于预期源码路径，校验结果写入状态文件，包括时间戳</li>
      </ol>
      <p>
        这套机制的设计原则来自证券客户端的发布工程：<strong>更新前必须检查目标状态，更新后必须验证最终状态，全程可回滚</strong>。不能因为是"本地工具"就跳过这些步骤——Skill 内容漂移和客户端发布版本漂移的风险性质是一样的。
      </p>

      <h2>当前证据</h2>
      <ul>
        <li><strong>69 次 commit</strong>，持续迭代分发引擎和 Skill 内容</li>
        <li>仓库公开 <strong>5 个自研 Skill</strong>：<code>design-convergence-review</code>（设计就绪检查）、<code>first-principles</code>（第一性原理重建决策）、<code>git-commit</code>（仓库感知 Conventional Commit）、<code>hermes-context-review</code>（Hermes 上下文审计）、<code>llm-wiki</code>（知识库搜索与维护）</li>
        <li><strong>696 行测试代码</strong>，4 个测试文件：链接管理器、Skill 验证、git-commit Skill 契约、llm-wiki 脚本</li>
        <li>独立的 <code>validate_skills.py</code> 验证脚本，检查每个 Skill 的结构完整性和契约一致性</li>
        <li>项目文档以 <code>llm-wiki</code> 为真实来源，工程仓库通过受管链接暴露，避免文档双写；中英文双语 README</li>
      </ul>

      <h2>技术判断</h2>
      <p>
        Skills 的价值不只在说明文件本身，而在"说明、脚本、参考资料和输出资产"作为一个可发现、可按需加载的运行包。分发层必须保持克制：只同步配置中明确选择的 Skill，并在真实目录或外部链接冲突时停止，而不是自动覆盖。
      </p>
      <p>
        为什么不用符号链接管理器（如 GNU stow）？因为 stow 解决的是"把文件链接到目标位置"，而 agent-skills 解决的是"跨多个异构客户端的 Skill 版本一致性和可验证性"——不同客户端的 Skill 目录结构不同、加载机制不同、配置格式不同，需要一个理解 Skill 语义的分发层，而不是通用文件链接工具。
      </p>

      <h2>项目边界</h2>
      <ul>
        <li>当前验证重点是本地多客户端分发，不声称已经解决远程注册表、语义化版本或团队权限管理。</li>
        <li>文件系统链接同步成功，不等于每个客户端运行时都一定完成发现；运行时加载仍需持续验收。</li>
        <li>项目不把个人配置、凭据或客户端私有状态纳入仓库。</li>
      </ul>

      <h2>相关页面</h2>
      <ul>
        <li>
          <Link to="/notes/agent-runtime">Agent Runtime</Link>
        </li>
        <li>
          <Link to="/projects/llm-wiki-mcp">llm-wiki-mcp</Link>
        </li>
      </ul>
    </>
  );
}
