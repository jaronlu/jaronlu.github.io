# 项目路径与同步清单

本网站展示的项目来自本地其他仓库。这些项目会持续更新，每次项目有重大变更时，需要同步更新本网站的对应内容。

## 项目路径

| 项目 | 本地路径 | 网站对应内容文件 |
|---|---|---|
| SecRAG | `~/Desktop/SecRAG/` | `src/content/projects/secrag.tsx`、`src/data/projects.ts`（ev/q/tagline） |
| agent-skills | `~/Desktop/00-projects/agent-skills/` | `src/content/projects/agent-skills.tsx`、`src/data/projects.ts`（ev/q/tagline） |

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
