# 关于我

**Jaron Lu（陆建荣）** — 10 年+ 证券金融行业客户端开发工程师，正在向 AI Agent 工程方向拓展。

## 一句话画像

我做过长期证券客户端工程交付，现在把这部分业务理解和工程治理经验，迁移到 Agentic RAG、LangGraph 工作流、MCP 工具化和知识库工程中。

## 核心经历

### 客户端开发（iOS / HarmonyOS）

- 长期参与证券客户端项目交付，覆盖行情、交易、账户、安全、路由、发布等核心模块。
- 参与 HarmonyOS 证券项目开发，负责过闪电交易等高交互、高校验业务链路。
- 有模块化、配置化、构建发布、自动化脚本和线上稳定性治理经验。

### AI Agent 工程实践

- 独立设计并实现 **SecRAG**：面向证券投研场景的 Agentic RAG 个人项目。
  - 使用 LangGraph StateGraph 编排 Planner → Retriever → Reasoner → Verifier → Composer → Auditor 六节点工作流。
  - 将角色权限过滤前置到 Retriever 节点，避免答案生成后再做表层过滤。
  - 将数字校验、来源校验独立为 Verifier 节点，降低金融问答中的幻觉和引用风险。
  - 使用 ChromaDB、BGE Reranker、FastAPI 等组件完成最小系统闭环。
- 维护个人 `llm-wiki` 知识库，把学习材料、源码阅读、项目复盘沉淀成可检索、可复用的工程知识。

## 技术栈

- **客户端**：Objective-C / iOS，HarmonyOS（ArkTS / ArkUI），Flutter
- **AI / Agent**：LangGraph，LangChain，RAG，MCP，ChromaDB，FastAPI
- **工程化**：Python / uv，自动化脚本，模块化治理，CI/CD，知识库工程

## 这个站点

这个站点用于公开展示我转向 AI Agent 工程过程中的作品、笔记和工程判断。内容会持续从个人知识库中筛选、脱敏和重写，不追求数量，优先保证可读、可信、能体现工程能力。

## 联系

- GitHub: [github.com/jaronlu](https://github.com/jaronlu)
- 邮箱: jr.lu.jobs@gmail.com
- LinkedIn: [个人主页](https://www.linkedin.com/in/建荣-陆-a5a10a400/)
