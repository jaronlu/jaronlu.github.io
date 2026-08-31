import { Link } from "react-router-dom";
import { CodeBlock } from "../../components/CodeBlock";

export function AgentSkillsContent() {
  return (
    <>
      <h2>项目一句话</h2>
      <p>
        <code>agent-skills</code> 解决的不是“再写几个 Prompt”，而是自研能力如何跨多个 Agent 客户端保持同一份源码、明确版本边界和可验证的安装状态。
      </p>

      <h2>为什么做这个项目</h2>
      <p>
        多个 Agent 客户端各自维护一份 Skill 副本，会快速出现三个问题：内容漂移、修复不同步、运行时到底加载了哪一版无法确认。这个项目把源码、分发配置和验证工具收敛到一个仓库中。
      </p>

      <h2>分发模型</h2>
      <CodeBlock
        title="distribution model"
        code={`skills/（唯一源码）
        ↓ 读取配置 + 校验
manage_skill_links.py
        ↓ 计划 / 冲突检查 / 增量同步
Codex        Claude        Hermes
        ↓ 最终路径验证
本地状态记录`}
      />

      <h2>工程落点</h2>
      <table>
        <thead>
          <tr>
            <th>能力</th>
            <th>实现</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>单一来源</td>
            <td>所有运行包统一维护在 <code>skills/&lt;name&gt;/</code></td>
          </tr>
          <tr>
            <td>配置驱动</td>
            <td><code>config/skill-links.toml</code> 定义目标客户端与 allowlist</td>
          </tr>
          <tr>
            <td>确定性管理</td>
            <td><code>status</code>、<code>check</code>、<code>sync</code>、<code>unlink</code> 与 dry-run</td>
          </tr>
          <tr>
            <td>冲突保护</td>
            <td>不覆盖未受管文件、外部软链接和重复配置</td>
          </tr>
          <tr>
            <td>可验证同步</td>
            <td>增量修复旧链接，验证最终解析路径并记录状态</td>
          </tr>
        </tbody>
      </table>

      <h2>当前证据</h2>
      <ul>
        <li>仓库公开 4 个自研 Skill：<code>design-convergence-review</code>、<code>first-principles</code>、<code>git-commit</code>、<code>llm-wiki</code>。</li>
        <li>链接管理器已覆盖增量同步、路径迁移、重复检测、冲突保护和幂等行为测试。</li>
        <li>项目文档以 <code>llm-wiki</code> 为真实来源，工程仓库通过受管链接暴露，避免文档双写。</li>
      </ul>

      <h2>技术判断</h2>
      <p>
        Skills 的价值不只在说明文件本身，而在“说明、脚本、参考资料和输出资产”作为一个可发现、可按需加载的运行包。分发层必须保持克制：只同步配置中明确选择的 Skill，并在真实目录或外部链接冲突时停止，而不是自动覆盖。
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
