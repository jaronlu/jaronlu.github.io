# agent-skills — 跨 Agent 的能力分发基座

> 自研 Agent Skills 的单一源码仓库，用确定性工具分发到 Codex、Claude 与 Hermes。

[查看 GitHub 源码 ↗](https://github.com/jaronlu/awesome-opc-skills)

## 项目一句话

`agent-skills` 解决的不是“再写几个 Prompt”，而是自研能力如何跨多个 Agent 客户端保持同一份源码、明确版本边界和可验证的安装状态。

## 为什么做这个项目

多个 Agent 客户端各自维护一份 Skill 副本，会快速出现三个问题：内容漂移、修复不同步、运行时到底加载了哪一版无法确认。这个项目把源码、分发配置和验证工具收敛到一个仓库中。

## 分发模型

```text
skills/（唯一源码）
        ↓ 读取配置 + 校验
manage_skill_links.py
        ↓ 计划 / 冲突检查 / 增量同步
Codex        Claude        Hermes
        ↓ 最终路径验证
本地状态记录
```

## 工程落点

| 能力 | 实现 |
|---|---|
| 单一来源 | 所有运行包统一维护在 `skills/<name>/` |
| 配置驱动 | `config/skill-links.toml` 定义目标客户端与 allowlist |
| 确定性管理 | `status`、`check`、`sync`、`unlink` 与 dry-run |
| 冲突保护 | 不覆盖未受管文件、外部软链接和重复配置 |
| 可验证同步 | 增量修复旧链接，验证最终解析路径并记录状态 |

## 当前证据

- 仓库公开 4 个自研 Skill：`design-convergence-review`、`first-principles`、`git-commit`、`llm-wiki`。
- 链接管理器已覆盖增量同步、路径迁移、重复检测、冲突保护和幂等行为测试。
- 项目文档以 `llm-wiki` 为真实来源，工程仓库通过受管链接暴露，避免文档双写。

## 技术判断

Skills 的价值不只在说明文件本身，而在“说明、脚本、参考资料和输出资产”作为一个可发现、可按需加载的运行包。分发层必须保持克制：只同步配置中明确选择的 Skill，并在真实目录或外部链接冲突时停止，而不是自动覆盖。

## 项目边界

- 当前验证重点是本地多客户端分发，不声称已经解决远程注册表、语义化版本或团队权限管理。
- 文件系统链接同步成功，不等于每个客户端运行时都一定完成发现；运行时加载仍需持续验收。
- 项目不把个人配置、凭据或客户端私有状态纳入仓库。

## 相关页面

- [Agent Runtime](../agent/concepts/agent-runtime.md)
- [llm-wiki-mcp](llm-wiki-mcp.md)
