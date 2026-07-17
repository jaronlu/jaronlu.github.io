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

<section class="lens">
  <header class="feature-head">
    <span class="kicker accent">ENGINEERING LENS / 01</span>
    <h2>把工程约束放在模型之前</h2>
    <p>从证券客户端到 Agent 系统，核心判断没有变：边界必须先于能力，关键动作必须可验证。</p>
  </header>
  <div class="lens-grid">
    <article>
      <span class="lens-label">ACCESS</span>
      <h3>权限在检索前生效</h3>
      <p>模型只接触当前角色可见的材料，不依赖提示词补救。</p>
      <a class="lens-proof" href="projects/secrag/"><b>SecRAG</b><span>RBAC 检索隔离</span><i>↗</i></a>
    </article>
    <article>
      <span class="lens-label">WRITE</span>
      <h3>写入先候选，后发布</h3>
      <p>Agent 产出先进入评审层，不直接覆盖正式知识。</p>
      <a class="lens-proof" href="projects/llm-wiki-mcp/"><b>llm-wiki-mcp</b><span>Candidate-first</span><i>↗</i></a>
    </article>
    <article>
      <span class="lens-label">DELIVERY</span>
      <h3>能力分发保持确定性</h3>
      <p>用单一源码、冲突保护和幂等验证替代手工同步。</p>
      <a class="lens-proof" href="projects/agent-skills/"><b>agent-skills</b><span>配置驱动分发</span><i>↗</i></a>
    </article>
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
  </div>
  <a class="notes-all" href="agent/">查看全部工程笔记 <span>→</span></a>
</section>

<section class="contact-strip">
  <div class="contact-inner">
    <span class="kicker accent">CONTACT / 03</span>
    <p class="contact-lede">正在寻找 AI Agent / LLM 应用工程机会。</p>
    <div class="contact-links">
      <a href="mailto:jr.lu.jobs@gmail.com">jr.lu.jobs@gmail.com →</a>
    </div>
  </div>
</section>
