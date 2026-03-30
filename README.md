# skills-dashboard

Claude Code / Agent / Codex Skills 可视化管理面板。

自动解析 `~/.claude/skills`、`~/.agents/skkills`、`~/.codex/skills` 三个目录下的所有 skill，生成含来源标注的 CSV 清单，并在本地启动可视化看板。

![Skills Dashboard](https://raw.githubusercontent.com/Anna-YC/skills-dashboard/main/screenshot.png)

## 功能特性

- **统计概览** — Skill 总数、已接入数、来源数量、分类数
- **接入进度条** — 动态显示已接入率
- **分类柱状图** + **来源环形图**
- **来源多选筛选** — ClaudeCode / Agent / Codex 组合过滤
- **同名合并** — 同一 skill 在多平台存在时合并为一行，来源用逗号分隔
- **详情抽屉** — 点击查看完整描述、分类、来源
- **深色模式** — 自动记住偏好
- **一键刷新** — 重新解析目录并刷新面板
- **导出 CSV** — 下载当前数据

## 安装

```bash
# 克隆到本地 skills 目录
git clone https://github.com/Anna-YC/skills-dashboard.git ~/.claude/skills/skills-dashboard

# 启动看板
node ~/.claude/skills/skills-dashboard/scripts/main.js
```

## 通过 Claude Code 唤醒

```
/-skills-dashboard
```

## 项目结构

```
skills-dashboard/
├── SKILL.md          # Claude Code skill 元数据
├── README.md
├── index.html        # 仪表盘页面（纯静态，无依赖）
└── scripts/
    └── main.js       # 解析器 + HTTP 服务（Node.js ESM）
```

## 技术栈

- **Node.js** — 解析器 + HTTP 服务
- **纯 HTML/JS/CSS** — 仪表盘前端，Chart.js CDN
- **无需构建** — 直接 node 运行，打开浏览器即可

## 解析的目录

| 目录 | 来源标签 |
|------|---------|
| `~/.claude/skills/` | ClaudeCode |
| `~/.agents/skills/` | Agent |
| `~/.codex/skills/` | Codex |

同名 skill（如 `baoyu-post-to-x` 同时存在于 ClaudeCode 和 Agent）合并为一行。

## 输出

- **看板地址**: http://localhost:3847
- **CSV 清单**: `~/.claude/skills-inventory.csv`

## License

MIT
