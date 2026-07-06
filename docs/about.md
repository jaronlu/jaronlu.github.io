# 关于我

**Jaron Lu (陆建荣)** — 10年+ 客户端开发工程师，正在向 AI Agent 工程方向拓展。

## 一句话画像

10年证券金融行业客户端开发经验（iOS/HarmonyOS），近期独立设计实现了 Agentic RAG 系统，正把客户端工程经验延伸到 AI Agent 方向。

## 核心经历

### 客户端开发（iOS / HarmonyOS）
- 独立维护 3 个证券 iOS 项目，支撑 3 个以上券商客户的平台化基座，覆盖 11 个核心业务模块
- 参与多家头部券商客户的 HarmonyOS 证券项目交付（3个），独立负责闪电交易模块全流程开发（需求分析 → UI → 逻辑实现 → SDK 联调），支持 A 股、科创板、创业板、债券、融资融券等多类交易场景
- 推进模块化拆分与配置化管理，公共代码复用率从 30% 提升到 70%
- 重构自动化发布链路（打包/加固/重签名/dSYM上传），发版时间从 4 小时降到 1.5 小时，累计发版 100+ 次无重大事故

### AI Agent 工程实践
- 基于证券行业背景，独立设计并实现 **SecRAG**——面向券商内部投研场景的 Agentic RAG 系统
  - 用 LangGraph StateGraph 编排六节点工作流：Planner → Retriever → Reasoner → Verifier → Composer → Auditor
  - 实现基于角色的检索权限过滤（RBAC），覆盖投顾/机构销售/合规/运营/技术 5 种角色的分级数据访问
  - 集成 ChromaDB 向量检索 + BGE Reranker 语义重排，FastAPI 提供问答接口
  - 36+ 单元测试覆盖节点、路由与图构建逻辑
- 日常用 AI 辅助旧代码理解、问题定位和脚本处理，千行级历史 Objective-C 代码理解耗时从半天缩短到 1-2 小时

## 技术栈

- **客户端**：Objective-C / iOS，HarmonyOS (ArkTS/ArkUI)，Flutter
- **AI / Agent**：LangGraph、LangChain、RAG、ChromaDB、FastAPI
- **工程化**：CocoaPods 模块化、CI/CD 自动化发布、Python/uv

## 这个站点

记录我从客户端工程师向 AI Agent 方向拓展过程中的学习笔记与实践思考，基于实践和源码验证，不搬运文档。

## 联系

- GitHub: [github.com/jaronlu](https://github.com/jaronlu)
- 邮箱: jr.lu.jobs@gmail.com
- LinkedIn: [个人主页](https://www.linkedin.com/in/建荣-陆-a5a10a400/)
