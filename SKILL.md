---
name: skills-dashboard
description: >
  Skills 可视化管理面板。自动解析 ~/.claude/skills、~/.agents/skills 和 ~/.codex/skills 下所有 skill，
  同名 skill 自动合并来源标注，生成含来源（ClaudeCode / Agent / Codex）标注的 CSV 清单，
  启动本地 HTTP 服务并打开浏览器面板。支持来源多选筛选、分类筛选、搜索、深色模式、详情抽屉和一键刷新。
  Use when user asks to "open skills dashboard", "show skills panel", "skills 可视化", "skill 管理面板",
  "查看 skill 列表", "skill dashboard", or wants to see all available skills across platforms.
user-invocable: true
version: 1.2.0
metadata:
  openclaw:
    homepage: https://github.com/JimLiu/skills-dashboard
    requires:
      anyBins:
        - node
---

# Skills Dashboard

可视化管理面板，展示所有 Claude Code skills 的状态、分类、来源和详情。

## Project Structure

```
skills-dashboard/
├── SKILL.md          ← Claude Code skill 元数据
├── index.html        ← 仪表盘页面（纯静态）
└── scripts/
    └── main.js       ← 解析器 + HTTP 服务（Node.js）
```

## Script Directory

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `{baseDir}`
2. Script path = `{baseDir}/scripts/main.js`
3. Run: `node "{baseDir}/scripts/main.js"`

## Usage

```bash
# 直接运行
node ~/.claude/skills/skills-dashboard/scripts/main.js

# 通过 skill 唤醒
/skills-dashboard
```

## What It Does

1. 解析以下三个目录的所有 skill：
   - `~/.claude/skills/` → **ClaudeCode**
   - `~/.agents/skills/` → **Agent**
   - `~/.codex/skills/` → **Codex**
2. 同名 skill 合并为一行，来源用逗号分隔标注
3. 生成 `~/.claude/skills-inventory.csv`（含当日日期）
4. 启动本地 HTTP 服务（端口 3847）
5. 自动打开浏览器 → http://localhost:3847

## Dashboard Features

- **统计概览**：Skill 总数、已接入数、来源数量、分类数
- **接入进度条**：动态滑入，显示接入率
- **分类柱状图** + **来源环形图**（ClaudeCode / Agent / Codex）
- **来源多选筛选**：可同时选择多个来源，组合过滤
- **搜索 + 分类标签 + 状态筛选**
- **来源列**：同名 skill 合并后显示多个来源标签
- **详情抽屉**：点任意 skill 查看来源、分类、完整描述
- **深色模式**：一键切换，自动记住偏好
- **加载最新**：一键重新解析所有 skill 目录并刷新面板
- **导出 CSV**：下载当前数据为 `skills-inventory-YYYY-MM-DD.csv`

## Output

- CSV 文件：`~/.claude/skills-inventory.csv`
- 面板地址：http://localhost:3847

## Notes

- 端口 3847 = "3S-D" 谐音（3 Skills Dashboard）
- 面板右上角「🔄 加载最新」会重新解析三个 skill 目录并刷新数据
- 同名 skill（如 baoyu-* 系列同时存在于 ClaudeCode 和 Agent）合并为一行
