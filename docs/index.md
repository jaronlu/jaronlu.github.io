---
hide:
  - navigation
  - toc
---

<section class="masthead">
  <div class="masthead-rule">
    <span class="kicker">PORTFOLIO — AI AGENT ENGINEERING</span>
    <span class="masthead-meta">ISSUE 2026 · SHENZHEN / REMOTE</span>
  </div>
  <h1 class="masthead-name">Jaron Lu</h1>
  <p class="masthead-deck">把金融客户端的工程约束，<br>编译成<em>可信</em>的 AI Agent 系统。</p>
  <div class="masthead-foot">
    <p class="masthead-intro">10 年证券客户端工程经验。现在专注 Agentic RAG、LangGraph、MCP 与知识工程，关注权限、验证和可审计性，而不只是让模型“能回答”。</p>
    <div class="masthead-actions">
      <a href="projects/" class="btn-primary">查看项目 <span>↗</span></a>
      <a href="about/" class="btn-ghost">了解经历 <span>→</span></a>
    </div>
  </div>
</section>

<section class="feature">
  <header class="feature-head">
    <span class="kicker accent">SELECTED WORK / 01</span>
    <h2>从场景应用到 Agent 工程基础设施</h2>
    <p>从垂直场景应用，到知识操作协议，再到跨 Agent 的能力分发。</p>
  </header>

  <div class="work-list">
    <a class="work-item" href="projects/secrag/">
      <span class="work-no">01</span>
      <div class="work-main">
        <div class="tags"><span>AGENTIC RAG</span><span>LANGGRAPH</span><span>FINANCE</span></div>
        <h3>SecRAG</h3>
        <p>面向机构投研的可信知识问答 Agent。把角色权限前置到检索链路，把来源与数字验证做成独立节点。</p>
      </div>
      <ul class="work-proof">
        <li>6 节点工作流</li>
        <li>RBAC 检索隔离</li>
        <li>引用与数字验证</li>
      </ul>
      <span class="work-arrow">↗</span>
    </a>

    <a class="work-item" href="projects/llm-wiki-mcp/">
      <span class="work-no">02</span>
      <div class="work-main">
        <div class="tags"><span>MCP</span><span>KNOWLEDGE OPS</span></div>
        <h3>llm-wiki-mcp</h3>
        <p>给 Agent 一个受治理的知识操作层：候选优先、原始证据不可覆盖、路径边界和结构化质量检查。</p>
      </div>
      <ul class="work-proof">
        <li>Candidate-first</li>
        <li>94 tests passing</li>
        <li>Human in the loop</li>
      </ul>
      <span class="work-arrow">↗</span>
    </a>

    <a class="work-item" href="projects/agent-skills/">
      <span class="work-no">03</span>
      <div class="work-main">
        <div class="tags"><span>AGENT SKILLS</span><span>TOOLING</span></div>
        <h3>agent-skills</h3>
        <p>一份 Skill 源码，确定性分发到 Codex、Claude 与 Hermes；带冲突保护、状态追踪和幂等验证。</p>
      </div>
      <ul class="work-proof">
        <li>4 个公开 Skills</li>
        <li>3 个 Agent 客户端</li>
        <li>配置驱动分发</li>
      </ul>
      <span class="work-arrow">↗</span>
    </a>
  </div>
</section>

<section class="notes">
  <header class="feature-head">
    <span class="kicker accent">FIELD NOTES / 02</span>
    <h2>把学习编译成可复用的工程判断</h2>
  </header>
  <div class="notes-list">
    <a href="agent/concepts/agent-runtime/">
      <span class="notes-idx">N1</span>
      <span class="notes-body"><strong>Agent Runtime</strong><em>State、Store、Context 的职责边界</em></span>
      <span class="notes-go">→</span>
    </a>
    <a href="agent/concepts/rag-principles/">
      <span class="notes-idx">N2</span>
      <span class="notes-body"><strong>RAG 原理</strong><em>检索、生成、引用与评估链路</em></span>
      <span class="notes-go">→</span>
    </a>
    <a href="agent/concepts/mcp-protocol/">
      <span class="notes-idx">N3</span>
      <span class="notes-body"><strong>MCP 协议</strong><em>Host、Client、Server 与工具边界</em></span>
      <span class="notes-go">→</span>
    </a>
    <a href="agent/concepts/loop-engineering/">
      <span class="notes-idx">N4</span>
      <span class="notes-body"><strong>Loop Engineering</strong><em>从提示词到反馈循环系统</em></span>
      <span class="notes-go">→</span>
    </a>
  </div>
</section>
