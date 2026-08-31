import { Link } from "react-router-dom";
import { CodeBlock } from "../../components/CodeBlock";

export function AgentPrinciplesContent() {
  return (
    <>
      <h2>什么是 Agent</h2>
      <p>
        Agent（智能体）解决的核心问题：
        <strong>当任务步骤不是提前写死的，而是需要模型根据目标和中间结果动态判断下一步动作时，普通固定流程不够用了。</strong>
      </p>
      <p>解决的问题：</p>
      <ul>
        <li>固定 Chain / Workflow 难覆盖开放任务</li>
        <li>是否调用工具、调用哪个工具、调用几次无法预先完全写死</li>
        <li>任务需要边观察、边决策、边执行</li>
      </ul>

      <h2>核心组成</h2>
      <CodeBlock
        code={`Agent（智能体）
├── Goal（目标）
├── Planner / Reasoner（规划/推理）
├── Tool（工具）
├── Memory / State（状态）
└── Executor（执行循环）`}
      />
      <p>
        标准公式（LLM 时代）：<strong>Agent = LLM（大脑） + Planning（规划） + Tool Use（执行） + Memory（记忆）</strong>
      </p>

      <h2>AI Agent vs Agentic AI</h2>
      <table>
        <thead>
          <tr>
            <th>维度</th>
            <th>AI Agent</th>
            <th>Agentic AI</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>词性</td>
            <td>名词：具体执行实体</td>
            <td>形容词/名词：系统能力属性或架构范式</td>
          </tr>
          <tr>
            <td>比喻</td>
            <td>单兵/工具人</td>
            <td>项目经理/生态系统</td>
          </tr>
          <tr>
            <td>系统构成</td>
            <td>单体架构（一个 LLM + 一组工具）</td>
            <td>多智能体架构（编排层 + 共享记忆池 + 多角色 Agent）</td>
          </tr>
          <tr>
            <td>任务复杂度</td>
            <td>单一、短链路、结构化</td>
            <td>复杂、长链路、非结构化</td>
          </tr>
          <tr>
            <td>协作能力</td>
            <td>有限或无</td>
            <td>深度协作，通过 A2A、MCP 等协议通信</td>
          </tr>
          <tr>
            <td>自主性</td>
            <td>受限，需用户触发</td>
            <td>强自主性，端到端执行，具备自我纠错</td>
          </tr>
        </tbody>
      </table>
      <p>
        Agentic AI 由吴恩达（Andrew Ng）提出，核心公式：<strong>Agent = Model + Harness</strong>。AI Agent 是实现 Agentic AI 的基础，但只有具备高度自主性、能通过多 Agent 协作解决复杂问题的系统才属于 Agentic AI。
      </p>

      <h2>标准执行循环</h2>
      <ol>
        <li>接收任务</li>
        <li>理解目标</li>
        <li>判断是否调用工具</li>
        <li>执行工具</li>
        <li>读取结果</li>
        <li>决定下一步</li>
        <li>输出最终答案</li>
      </ol>

      <h2>与其他概念的区别</h2>
      <table>
        <thead>
          <tr>
            <th>概念</th>
            <th>特点</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Chain</td>
            <td>固定流程，步骤预定义</td>
          </tr>
          <tr>
            <td>Workflow</td>
            <td>有向图，分支可预定义</td>
          </tr>
          <tr>
            <td>Tool Calling</td>
            <td>单次工具调用</td>
          </tr>
          <tr>
            <td>Agent</td>
            <td>动态决策，边执行边判断</td>
          </tr>
          <tr>
            <td>RAG</td>
            <td>检索增强生成，Agent 的一种应用</td>
          </tr>
        </tbody>
      </table>

      <h2>能力来源</h2>
      <ul>
        <li><strong>LLM</strong>：理解与推理能力</li>
        <li><strong>Tool</strong>：外部能力扩展</li>
        <li><strong>Memory</strong>：状态延续</li>
        <li><strong>Prompt</strong>：行为约束</li>
      </ul>

      <h2>适用场景</h2>
      <ul>
        <li>开放式任务</li>
        <li>多工具协同</li>
        <li>步骤不固定的任务</li>
        <li>需要边执行边判断的任务</li>
      </ul>

      <h2>核心风险</h2>
      <table>
        <thead>
          <tr>
            <th>风险</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>幻觉决策</td>
            <td>LLM 编造不存在的工具或结果</td>
          </tr>
          <tr>
            <td>工具乱调</td>
            <td>调用错误工具或传错参数</td>
          </tr>
          <tr>
            <td>死循环</td>
            <td>无法终止的推理循环</td>
          </tr>
          <tr>
            <td>成本失控</td>
            <td>多轮调用导致 token 消耗过大</td>
          </tr>
        </tbody>
      </table>

      <h2>最小实践路径</h2>
      <ol>
        <li>准备一个明确目标的单任务场景</li>
        <li>只接 1 个工具（搜索或查询）</li>
        <li>验证“判断 → 调用 → 读取 → 输出”循环</li>
      </ol>
      <p>如果最小循环没跑稳，不要急着扩展多工具、长期记忆或复杂自治能力。</p>

      <h2>常见误学路径</h2>
      <ul>
        <li>不要把 Agent 当成“更高级的聊天”</li>
        <li>不要一上来就多工具堆满</li>
        <li>不要忽略终止条件和边界</li>
        <li>不要把灵活性误当成稳定性</li>
      </ul>

      <h2>AI 工程四层栈（L1→L4）</h2>
      <table>
        <thead>
          <tr>
            <th>层级</th>
            <th>范式</th>
            <th>核心动作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>L1</td>
            <td>Prompt Engineering</td>
            <td>优化单次交互输入（角色扮演、Few-shot、CoT）</td>
          </tr>
          <tr>
            <td>L2</td>
            <td>Context Engineering</td>
            <td>通过 RAG、向量数据库将项目文档和代码库喂给模型</td>
          </tr>
          <tr>
            <td>L3</td>
            <td>Harness Engineering</td>
            <td>引入沙箱、工具调用和权限控制，赋予 Agent 执行能力</td>
          </tr>
          <tr>
            <td>L4</td>
            <td>Loop Engineering</td>
            <td>设计反馈回路、状态持久化和自动化触发，让 Agent 自主迭代</td>
          </tr>
        </tbody>
      </table>
      <p>四层递进，每层包含前层。当前 Agent 工程的核心竞争力在 L3（约束控制）和 L4（循环自动化）。</p>

      <h2>相关笔记</h2>
      <ul>
        <li>
          <Link to="/notes/rag-principles">RAG 原理</Link> — 检索增强生成
        </li>
      </ul>
    </>
  );
}
