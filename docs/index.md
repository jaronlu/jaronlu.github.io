---
hide:
  - navigation
  - toc
---

<section class="portfolio-hero">
  <div class="hero-signal"><span></span> OPEN TO AI AGENT ROLES · SHENZHEN / REMOTE</div>
  <h1>Jaron Lu</h1>
  <p class="hero-title">把金融客户端的工程约束，<br>编译成可信的 AI Agent 系统。</p>
  <p class="hero-intro">10 年证券客户端工程经验。现在专注 Agentic RAG、LangGraph、MCP 与知识工程，关注权限、验证和可审计性，而不只是让模型“能回答”。</p>
  <div class="hero-actions">
    <a href="projects/" class="primary-action">查看项目 <span>↗</span></a>
    <a href="about/" class="text-action">了解经历 <span>→</span></a>
  </div>
  <div class="hero-proof" aria-label="能力概览">
    <div><strong>10+</strong><span>年客户端工程</span></div>
    <div><strong>3</strong><span>个可验证项目</span></div>
    <div><strong>100+</strong><span>SecRAG 单元测试</span></div>
  </div>
</section>

<section class="work-section">
  <div class="section-heading">
    <span>SELECTED WORK / 01</span>
    <h2>不是 Demo 列表，是三层工程闭环</h2>
    <p>从垂直场景应用，到知识操作协议，再到跨 Agent 的能力分发。</p>
  </div>

  <div class="project-list">
    <a class="project-row project-featured" href="projects/secrag/">
      <div class="project-index">01</div>
      <div class="project-copy">
        <div class="project-meta"><span>AGENTIC RAG</span><span>LANGGRAPH</span><span>FINANCE</span></div>
        <h3>SecRAG</h3>
        <p>面向机构投研的可信知识问答 Agent。把角色权限前置到检索链路，把来源与数字验证做成独立节点。</p>
      </div>
      <div class="project-proof">
        <span>6 节点工作流</span>
        <span>RBAC 检索隔离</span>
        <span>引用与数字验证</span>
      </div>
      <span class="row-arrow">↗</span>
    </a>

    <a class="project-row" href="projects/llm-wiki-mcp/">
      <div class="project-index">02</div>
      <div class="project-copy">
        <div class="project-meta"><span>MCP</span><span>KNOWLEDGE OPS</span></div>
        <h3>llm-wiki-mcp</h3>
        <p>给 Agent 一个受治理的知识操作层：候选优先、原始证据不可覆盖、路径边界和结构化质量检查。</p>
      </div>
      <div class="project-proof">
        <span>Candidate-first</span>
        <span>94 tests passing</span>
        <span>Human in the loop</span>
      </div>
      <span class="row-arrow">↗</span>
    </a>

    <a class="project-row" href="projects/agent-skills/">
      <div class="project-index">03</div>
      <div class="project-copy">
        <div class="project-meta"><span>AGENT SKILLS</span><span>TOOLING</span></div>
        <h3>agent-skills</h3>
        <p>一份 Skill 源码，确定性分发到 Codex、Claude 与 Hermes；带冲突保护、状态追踪和幂等验证。</p>
      </div>
      <div class="project-proof">
        <span>4 个公开 Skills</span>
        <span>3 个 Agent 客户端</span>
        <span>配置驱动分发</span>
      </div>
      <span class="row-arrow">↗</span>
    </a>
  </div>
</section>

<section class="principles-section">
  <div class="section-heading">
    <span>ENGINEERING LENS / 02</span>
    <h2>我关注系统在哪些地方会失真</h2>
  </div>
  <div class="principle-grid">
    <article>
      <span>01</span>
      <h3>权限要在检索前生效</h3>
      <p>生成后过滤已经太晚。模型不该先看到越权材料，再被要求“不要说”。</p>
    </article>
    <article>
      <span>02</span>
      <h3>验证要成为工作流节点</h3>
      <p>金融问答中的数字错误和引用错误需要独立检查，不能交给一次笼统自评。</p>
    </article>
    <article>
      <span>03</span>
      <h3>写入要留下评审边界</h3>
      <p>Agent 可以提出候选变更，但正式知识页仍由人确认后落盘。</p>
    </article>
  </div>
</section>

<section class="notes-band">
  <div>
    <span>FIELD NOTES</span>
    <h2>把学习编译成可复用的工程判断</h2>
  </div>
  <div class="notes-links">
    <a href="agent/concepts/agent-runtime/">Agent Runtime <span>→</span></a>
    <a href="agent/concepts/rag-principles/">RAG 原理 <span>→</span></a>
    <a href="agent/concepts/mcp-protocol/">MCP 协议 <span>→</span></a>
    <a href="agent/concepts/loop-engineering/">Loop Engineering <span>→</span></a>
  </div>
</section>
