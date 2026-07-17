# jaronlu.github.io

个人站点，基于 [MkDocs](https://www.mkdocs.org/) + [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) 构建，托管于 GitHub Pages。

## 本地运行

```bash
# 安装依赖
python3 -m pip install mkdocs mkdocs-material

# 启动本地预览（默认 http://127.0.0.1:8000）
./run-local.sh
```

可通过环境变量修改监听地址，例如：`HOST=0.0.0.0 PORT=8080 ./run-local.sh`。

## 目录结构

```
mkdocs.yml              # 站点配置（导航、主题、字体）
run-local.sh            # 本地预览脚本
deploy-github.sh        # GitHub Pages 部署脚本
docs/
├── index.md            # 首页
├── about.md            # 关于
├── agent/              # 笔记
├── projects/           # 项目
└── stylesheets/
    └── extra.css       # 全站自定义样式
```

## 部署

先提交所有修改，然后运行：

```bash
./deploy-github.sh
```

脚本会检查当前分支与工作区状态，执行严格构建校验，再将 `master` 推送到 GitHub。推送后，`.github/workflows/deploy.yml` 会自动构建并发布到 GitHub Pages。
