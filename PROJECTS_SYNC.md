# 项目路径与同步清单

本网站展示的项目来自本地其他仓库。这些项目会持续更新，每次项目有重大变更时，需要同步更新本网站的对应内容。

## 项目路径

| 项目 | 本地路径 | 网站对应内容文件 |
|---|---|---|
| SecRAG | `~/Desktop/SecRAG/` | `src/content/projects/secrag.tsx`、`src/data/projects.ts`（ev/q/tagline） |
| agent-skills | `~/Desktop/00-projects/agent-skills/` | `src/content/projects/agent-skills.tsx`、`src/data/projects.ts`（ev/q/tagline） |
| ai-engineering-hub | `~/Desktop/ai-engineering-hub/` | `src/content/notes/*.tsx`（工程笔记内容来源）、`src/data/notes.ts` |

## 同步时需要提取的数据点

### SecRAG

在 `~/Desktop/SecRAG/` 下执行：

```bash
# commit 数
git rev-list --count HEAD

# 源码行数（src/ 下所有 .py）
find src -name "*.py" | xargs wc -l | tail -1

# 测试行数
find tests -name "*.py" | xargs wc -l | tail -1

# 测试用例数
grep -r "def test_" tests/ --include="*.py" | wc -l

# 测试文件数
find tests -name "test_*.py" | wc -l

# src 模块列表
ls src/

# tools 列表
ls src/tools/

# scripts 列表
ls scripts/

# 前端是否存在/更新
ls frontend/src/

# README 核心能力章节
grep -A 20 "## 核心能力" README.md
```

需要同步到网站的内容：
- `src/data/projects.ts` 中 secrag 的 `ev`（证据行）、`q`（一句话）、`tagline`
- `src/content/projects/secrag.tsx` 中的：
  - "可验证的代码事实"章节的数字（commits / 源码行数 / 测试行数 / 测试用例数 / 模块数 / scripts 数）
  - "能力证据矩阵"是否有新增能力模块
  - "技术亮点"是否有新增功能（前端、Docker、身份验证、合规、评估等）
  - "技术栈"是否有新增依赖
  - "设计取舍"是否有架构变更
  - "项目边界说明"是否有新的限制
  - SVG 架构图是否需要更新（节点变化时）

### agent-skills

在 `~/Desktop/00-projects/agent-skills/` 下执行：

```bash
# commit 数
git rev-list --count HEAD

# Skill 数量
ls skills/ | wc -l

# Skill 列表
ls skills/

# 测试行数
find tests -name "*.py" | xargs wc -l | tail -1

# 测试文件列表
ls tests/

# scripts 列表
ls scripts/

# 实际配置的目标客户端
grep "^\[targets" config/skill-links.toml
```

需要同步到网站的内容：
- `src/data/projects.ts` 中 agent-skills 的 `ev`（证据行）
- `src/content/projects/agent-skills.tsx` 中的：
  - "当前证据"章节的数字（commits / Skill 数 / 测试行数 / 测试文件数）
  - Skill 列表是否有新增/删除
  - "能力证据矩阵"是否有新增能力
  - 架构图中的客户端数量是否变化（config/skill-links.toml 中的 [targets]）

### ai-engineering-hub

> 注意：这是 AI 工程学习工作区，不是项目展示。同步的是"工程笔记"内容，不是项目页。

在 `~/Desktop/ai-engineering-hub/` 下执行：

```bash
# commit 数
git rev-list --count HEAD

# 已启用生态目录
ls -d */ | grep -E "langchain|llamaindex|autogpt|comfyui"

# Agent Engineering 教程专题
ls tutorial/

# 学习文档目录
ls docs/

# 各生态的 README（看状态和进度）
cat langchain/README.md 2>/dev/null | head -20
cat llamaindex/README.md 2>/dev/null | head -20
cat autogpt/README.md 2>/dev/null | head -20
cat comfyui/README.md 2>/dev/null | head -20

# 跨框架比较
ls docs/cross-framework/ 2>/dev/null

# workflow.md（工作流定义）
head -40 workflow.md
```

需要同步到网站的内容：
- `src/data/notes.ts` 中笔记列表是否需要新增（当 tutorial/ 或 docs/ 中有新的成熟专题时）
- `src/content/notes/*.tsx` 中已有笔记的内容是否需要更新（当对应教程/文档有重大修订时）
- 网站笔记的 confidence 标签是否需要调整（当教程从"学习中"变为"已验证"时）
- 如果某个生态完成了最小示例和独立校验，可以考虑在跨框架比较笔记中新增内容

当前网站笔记与 ai-engineering-hub 的对应关系（参考）：
| 网站笔记 | 可能的来源 |
|---|---|
| Agent 原理 | tutorial/ 中 Context/Tool/Graph 专题、docs/langchain/ |
| Agent Runtime | tutorial/ 中 Memory/Harness 专题、langchain/ 运行时 |
| Loop Engineering | tutorial/ 中 Loop 专题、workflow.md |
| MCP 协议 | docs/langchain/ 中 MCP 相关、langchain/ 可运行代码 |
| RAG 原理 | docs/langchain/ 中 RAG 文档、langchain/ 可运行代码 |

## 同步流程

1. 进入对应项目目录，执行上面的命令提取最新数据
2. 对比网站当前内容，找出差异
3. 更新 `src/data/projects.ts` 中的证据行和描述
4. 更新 `src/content/projects/<project>.tsx` 中的对应章节
5. 如果项目有重大架构变更，更新 SVG 架构图
6. 如果笔记中引用了项目数据（如"六节点"、测试数），同步修正笔记内容
7. 运行 `npm run build` 验证
8. 提交并推送

## 注意事项

- **数据必须来自实际项目**，禁止编造 commits 数、代码行数、测试数
- 项目边界说明要诚实，项目未实现的功能不要写成已实现
- 如果项目 README 中的描述和代码实际不一致，以代码为准
- 首页核心能力卡片（`src/pages/Home.tsx`）中的数字也要同步更新
