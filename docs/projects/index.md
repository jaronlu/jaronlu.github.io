# 项目

前三个项目构成一条 Agent 工程链路：**SecRAG** 解决垂直场景中的可信问答，**llm-wiki-mcp** 解决知识如何被安全读写，**agent-skills** 解决能力如何在多个 Agent 客户端之间一致分发。**ClipFlow** 补充跨平台桌面客户端的产品与工程实践。

<div class="proj-list">
  <a href="secrag/">
    <span class="proj-name">SecRAG</span>
    <span class="proj-q">金融知识问答如何把权限、验证和审计变成结构约束</span>
    <span class="proj-ev">LangGraph 六节点 · 36+ 单测（1524 行测试代码）· 权限验收与小样本检索评估</span>
  </a>
  <a href="llm-wiki-mcp/">
    <span class="proj-name">llm-wiki-mcp</span>
    <span class="proj-q">Agent 如何在不获得无限文件权限的前提下维护知识库</span>
    <span class="proj-ev">Candidate-first · raw create-only · 路径防护 · 94 tests passing</span>
  </a>
  <a href="agent-skills/">
    <span class="proj-name">agent-skills</span>
    <span class="proj-q">自研 Skills 如何跨 Codex、Claude、Hermes 保持单一来源</span>
    <span class="proj-ev">配置驱动分发 · 冲突保护 · 幂等同步 · 4 个公开 Skills</span>
  </a>
  <a href="clip-flow/">
    <span class="proj-name">ClipFlow</span>
    <span class="proj-q">多格式剪贴板历史如何在桌面端完成识别、检索与本地管理</span>
    <span class="proj-ev">macOS 已验证 · OCR 三平台适配 · AES-256-GCM 本地加密 · 真实界面截图</span>
  </a>
</div>

所有数字均来自当前项目源码或 Wiki 中的已核对记录；设计目标与已完成能力分开表达。

## 设计中

### KnowledgeOS — AI Knowledge Workspace

**状态：设计阶段，尚未交付**

受 NotebookLM 启发的开源知识工作台，第一阶段是 Document Knowledge Agent：文档管理、多文档联合问答、Citation、AI 总结与学习资料生成。

- MVP 仅覆盖 PDF、DOCX、Markdown、TXT，暂不包含多模态、网页、MCP、Deep Research 或协作功能。
- 技术基线为 Python 3.12、FastAPI、LangGraph、ChromaDB、SQLite / PostgreSQL。
- 设计与实现验证完成前，不作为已交付项目展示。
