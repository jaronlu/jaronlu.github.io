# RAG 原理

> confidence: high

RAG（Retrieval-Augmented Generation）离线准备链路、在线问答链路、核心组件与优化点。

---

## 离线链路

1. 文档解析 → 分块 → 向量化 → 存入向量库
2. 索引优化：元数据过滤、多路召回

## 在线链路

1. 查询向量化 → 召回 Top-K → 重排序 → 注入 Prompt
2. LLM 基于上下文生成回答

## 优化方向

- 分块策略
- Embedding 选型
- 混合检索（向量 + 关键词）
- Reranker

---

*待从 wiki 补充完整内容*
