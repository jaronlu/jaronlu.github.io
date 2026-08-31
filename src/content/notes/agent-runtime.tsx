import { Link } from "react-router-dom";
import { CodeBlock } from "../../components/CodeBlock";

export function AgentRuntimeContent() {
  return (
    <>
      <h2>核心概念</h2>
      <p>LangChain 的 Runtime 机制是理解 Agent 内部运行状态的关键。</p>
      <table>
        <thead>
          <tr>
            <th>概念</th>
            <th>说明</th>
            <th>生命周期</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>State</td>
            <td>短期记忆，存储当前对话信息、任务状态</td>
            <td>单次请求</td>
          </tr>
          <tr>
            <td>Store</td>
            <td>长期记忆，包含用户偏好、失败经验等</td>
            <td>跨会话</td>
          </tr>
          <tr>
            <td>Context</td>
            <td>运行时上下文，传递配置参数</td>
            <td>单次请求</td>
          </tr>
        </tbody>
      </table>

      <h2>State（短期记忆）</h2>
      <p>State 是 Agent 的短期记忆，存储当前会话的历史消息、任务状态等信息。</p>

      <h3>自定义 State</h3>
      <p>继承 AgentState，添加自定义属性：</p>
      <CodeBlock
        title="python"
        code={`from langchain.agents import AgentState
from typing import NotRequired

class CustomState(AgentState):
    """Agent 的任务状态"""
    model_call_count: NotRequired[int]  # 模型调用次数
    session_start: NotRequired[str]     # 会话开始时间`}
      />
      <p>AgentState 已有 messages 属性（历史消息列表），自定义后可记录更多信息。</p>

      <h3>操作 State</h3>
      <p>在 Tool 或 Middleware 中操作 State：</p>
      <CodeBlock
        title="python"
        code={`@tool
def my_tool(runtime: ToolRuntime):
    # 读取 state
    count = runtime.state.get("model_call_count", 0)

    # 修改 state（返回 Command 指令）
    return Command(update={
        "model_call_count": count + 1,
        "messages": [ToolMessage("Success!", tool_call_id=runtime.tool_call_id)]
    })`}
      />
      <p>注意：runtime 是 LangChain 中 tool 的限定参数，自定义参数不能叫这个名字。</p>

      <h2>Store（长期记忆）</h2>
      <p>Store 是 Agent 的长期记忆，跨会话持久化存储。</p>
      <p>用途：</p>
      <ul>
        <li>用户偏好</li>
        <li>失败经验</li>
        <li>学习到的知识</li>
        <li>历史交互记录</li>
      </ul>

      <h2>Context（运行时上下文）</h2>
      <p>Context 传递配置参数，单次请求生命周期。</p>
      <p>用途：</p>
      <ul>
        <li>模型配置</li>
        <li>工具配置</li>
        <li>环境参数</li>
        <li>调试标志</li>
      </ul>

      <h2>三者关系</h2>
      <CodeBlock
        code={`用户请求
    ↓
┌─────────────────────────────────┐
│ Context（配置参数）              │
│    ↓                            │
│ State（当前会话状态）            │
│    ↓                            │
│ Store（长期记忆）                │
└─────────────────────────────────┘
    ↓
Agent 处理
    ↓
返回结果 + 更新 State/Store`}
      />

      <h2>适用场景</h2>
      <table>
        <thead>
          <tr>
            <th>概念</th>
            <th>适用场景</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>State</td>
            <td>当前对话上下文、任务进度、临时数据</td>
          </tr>
          <tr>
            <td>Store</td>
            <td>用户画像、历史偏好、学习记录</td>
          </tr>
          <tr>
            <td>Context</td>
            <td>模型选择、工具配置、环境变量</td>
          </tr>
        </tbody>
      </table>

      <h2>实战案例</h2>
      <p>
        <Link to="/projects/secrag">SecRAG</Link> 的 <code>state.py</code>{" "}
        定义了贯穿六节点的 <code>AssistantState</code>：用户上下文、查询理解、检索计划/结果、推理过程、验证结果、合规信息、最终答案、审计轨迹全部作为 State 字段在节点间传递，是 State 机制在真实业务场景下的落地。
      </p>

      <h2>相关笔记</h2>
      <ul>
        <li>
          <Link to="/notes/agent-principles">Agent 原理</Link>
        </li>
        <li>
          <Link to="/notes/loop-engineering">Loop Engineering</Link>
        </li>
      </ul>
    </>
  );
}
