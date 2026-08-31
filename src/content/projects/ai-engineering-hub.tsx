import { Link } from "react-router-dom";

export function AiEngineeringHubContent() {
  return (
    <>
      <h2>项目定位</h2>
      <p>
        ai-engineering-hub 是我的 AI 工程知识治理与学习系统。它不是一个产品项目，而是一个<strong>知识工程项目</strong>——用工程化的方法管理 AI 技术学习内容，确保每一条技术事实都可追溯、可验证、可更新。
      </p>
      <p>
        项目的核心目标是：<strong>把"学 AI"从零散的网页收藏和笔记，变成有版本控制、有源码校准、有验证脚本的工程系统</strong>。
      </p>

      <h2>能力证据矩阵</h2>
      <table>
        <thead>
          <tr>
            <th>维度</th>
            <th>事实</th>
            <th>来源</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>提交历史</td>
            <td>116 commits，持续迭代</td>
            <td>git log --oneline | wc -l</td>
          </tr>
          <tr>
            <td>生态覆盖</td>
            <td>4 个生态：LangChain、LlamaIndex、AutoGPT、ComfyUI</td>
            <td>docs/ 目录结构</td>
          </tr>
          <tr>
            <td>专题教程</td>
            <td>7 个 Agent Engineering 专题，每篇 11-24KB</td>
            <td>tutorial/ 目录</td>
          </tr>
          <tr>
            <td>学习文档</td>
            <td>56 篇 LangChain 源码校准文档，从 01-messages 到 56-server-auth-security</td>
            <td>docs/langchain/ 目录</td>
          </tr>
          <tr>
            <td>可运行代码</td>
            <td>langchain/examples/ 下 model/agent/stream/runnable 示例 + deepagents/langgraph 子目录</td>
            <td>langchain/examples/</td>
          </tr>
          <tr>
            <td>验证脚本</td>
            <td>validate_tutorial.py 自动验证教程结构和引用完整性</td>
            <td>scripts/validate_tutorial.py</td>
          </tr>
          <tr>
            <td>工程工具</td>
            <td>build_nav.py、ecosystem.py、tutorial_loop.py 等自动化脚本</td>
            <td>scripts/ 目录</td>
          </tr>
          <tr>
            <td>知识治理</td>
            <td>workflow.md 定义严格的 Search→Execute→Verify SOP，含停止门禁和源码校准机制</td>
            <td>workflow.md</td>
          </tr>
          <tr>
            <td>生态配置</td>
            <td>ops/ecosystems.json 定义已启用生态及其运行环境</td>
            <td>ops/ecosystems.json</td>
          </tr>
          <tr>
            <td>依赖管理</td>
            <td>每个生态独立 pyproject.toml + uv.lock，不在根目录合并框架依赖</td>
            <td>各生态目录</td>
          </tr>
        </tbody>
      </table>

      <h2>7 个 Agent Engineering 专题</h2>
      <p>
        教程按 Agent 工程系统的工作链排列，不是随机的概念集合：
      </p>
      <ol>
        <li><strong>Context Engineering</strong>（看什么）：上下文装配、压缩、渐进式披露</li>
        <li><strong>Tool Engineering</strong>（做什么）：工具设计、边界、返回值、错误处理</li>
        <li><strong>Memory Engineering</strong>（记什么）：状态、记忆、生命周期、纠错机制</li>
        <li><strong>Harness Engineering</strong>（在哪里做）：运行环境、沙箱、权限、hooks、back-pressure</li>
        <li><strong>Loop Engineering</strong>（怎么循环做）：Agent loop、错误恢复、停止条件、状态机</li>
        <li><strong>Graph Engineering</strong>（怎么组织复杂过程）：LangGraph、子图、动态转移、人机协作</li>
        <li><strong>Eval Engineering</strong>（怎么判断好坏）：能力定义、黄金数据、verifier 设计、失败回归</li>
      </ol>
      <p>
        每篇教程都有元数据标注：source_type（官方工程文章/API文档/行业调研）、source_urls（具体来源链接）、retrieved_at（检索日期）、status（research-compiled）。这保证了内容的可追溯性。
      </p>

      <h2>知识治理 SOP</h2>
      <p>
        整个项目最有特色的部分是 <code>workflow.md</code> 定义的严格知识治理 SOP。核心原则：
      </p>
      <ul>
        <li><strong>停止门禁优先于执行</strong>：任何一步发现条件不满足（源码路径不确定、HEAD 与索引不一致、RepoPrompt MCP 不可用、依赖冲突、API 已弃用），必须立即停止，不得用猜测或网页摘要绕过</li>
        <li><strong>唯一可信源码基线</strong>：local-source-repos.json 记录每个仓库的本地源码路径和 branch_commit（分支@hash 完整字符串），每次写入前必须校验本地 HEAD 与索引中的 hash 一致</li>
        <li><strong>Search → Execute → Verify 三阶段</strong>：先只读检查边界和已有资产，再用 RepoPrompt MCP 读取源码校准技术事实，最后验证可运行性和引用完整性</li>
        <li><strong>README/网页/模型记忆只能定位候选，不能证明事实</strong>：已弃用的 API 不得作为实现依据，必须改用当前受支持的公共 API</li>
      </ul>
      <p>
        这套 SOP 的设计灵感来自证券交易系统的"唯一可信数据源"原则——价格、持仓、权限都必须有唯一权威来源，不能多个系统各自维护然后"互相对齐"。知识治理同理。
      </p>

      <h2>与其他项目的关联</h2>
      <ul>
        <li>
          <Link to="/projects/secrag">SecRAG</Link>：知识治理 SOP 的"增量+校验"原则与 SecRAG 的知识库入库引擎（稳定文档 ID、内容哈希比对、版本管理、更新跳过）是同一套工程思维
        </li>
        <li>
          <Link to="/projects/agent-skills">agent-skills</Link>：Harness Engineering 的"能力分发"维度在 agent-skills 中具体落地——Skills 单一源码、配置驱动分发、冲突保护、幂等同步
        </li>
        <li>
          <Link to="/projects/llm-wiki-mcp">llm-wiki-mcp</Link>：知识治理的"候选评审"机制在 llm-wiki-mcp 中具体落地——Agent 不直接写入正式知识，而是创建候选，经评审后合并
        </li>
      </ul>

      <h2>从客户端工程到知识工程的迁移</h2>
      <p>
        这个项目体现了我从 iOS/鸿蒙客户端工程向 AI 工程转型时的一个关键判断：<strong>客户端工程中"可维护性、可测试性、可追溯性"的核心能力，可以直接迁移到 AI 知识管理领域</strong>。
      </p>
      <ul>
        <li>客户端的"版本管理 + 变更日志" → 知识治理的"branch_commit 校验 + 来源追溯"</li>
        <li>客户端的"单元测试 + UI 测试" → 知识治理的"validate_tutorial.py + 可运行性验证"</li>
        <li>客户端的"模块化 + 依赖注入" → 知识治理的"生态独立目录 + 独立依赖锁定"</li>
        <li>客户端的"崩溃监控 + 热修复" → 知识治理的"失败样例回归 + 文档新鲜度 CI"</li>
      </ul>
      <p>
        这不是"为了学习而学习"，而是用我已有的工程能力去解决 AI 学习中的真实问题——内容过时、来源不可追溯、API 弃用后笔记还在教旧用法。
      </p>

      <h2>适用边界</h2>
      <ul>
        <li>这是一个学习/知识工程项目，不是产品项目，不面向终端用户</li>
        <li>tutorial/ 中的内容 status 为 research-compiled（研究编译），基于官方文档和行业调研，不是个人原创实战</li>
        <li>docs/langchain/ 中的 56 篇文档经过源码校准，但 LangChain API 变化较快，具体用法需结合当前版本验证</li>
        <li>项目主要服务于我个人的学习和知识管理，开源后可作为"知识工程方法论"的参考，但不保证适合所有人的学习风格</li>
      </ul>
    </>
  );
}
