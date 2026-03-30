# Skills Dashboard 使用教程 — 黄金圈指南

> **Why → How → What** 思维框架，帮你从本质理解到上手使用。

---

## Why — 为什么需要这个看板？

你装了 40+ 个 skill，却经常想不起来：
- **有没有现成的 skill 能做这件事？**
- **这个 skill 在哪个平台（Claude Code / Agent / Codex）能用？**
- **哪些 skill 还没接入，只是躺在文件夹里？**

**Skills Dashboard** 解决的就是这个"看不见、管不住、用不上"的问题——让你对所有 skill 一目了然。

---

## How — 它是怎么工作的？

1. **自动扫描** 三个目录下的所有 skill 文件：
   - `~/.claude/skills/` → Claude Code
   - `~/.agents/skills/` → Agent
   - `~/.codex/skills/` → Codex

2. **同名合并**：同一个 skill 在多个平台存在时，自动合并为一行，标注所有来源

3. **生成本地清单**：
   - CSV 文件 → `~/.claude/skills-inventory.csv`
   - 可视化看板 → http://localhost:3847

4. **交互式筛选**：按来源、分类、关键词搜索，实时过滤

---

## What — 具体怎么用？

### 启动看板

```bash
# 方式一：命令行直接运行
node ~/.claude/skills/skills-dashboard/scripts/main.js

# 方式二：通过 Claude Code 唤醒（输入 /skills-dashboard）
```

浏览器自动打开 → http://localhost:3847

### 核心功能一览

| 功能 | 操作 |
|------|------|
| 查看所有 skill | 直接浏览表格 |
| 按来源筛选 | 点击顶部来源标签（ClaudeCode / Agent / Codex），支持多选 |
| 按分类筛选 | 点击分类标签，组合过滤 |
| 关键词搜索 | 顶部搜索框，实时匹配名称和描述 |
| 查看详情 | 点击任意一行，右侧抽屉展示完整描述 |
| 切换深色模式 | 点击右上角 🌙/☀️ 按钮 |
| 导出 CSV | 点击右上角「导出 CSV」按钮 |
| 刷新数据 | 点击右上角「🔄 加载最新」按钮 |

### 典型使用场景

**场景 1：找功能**
> "我要把 Markdown 转成 HTML"
1. 打开看板 → 搜索框输入"html"
2. 找到 `baoyu-markdown-to-html`，点击查看详情
3. 了解调用方式和参数 → 直接使用

**场景 2：盘点接入情况**
> "我装了多少 skill，哪些还没接入 Claude Code？"
1. 来源筛选 → 去掉 ClaudeCode，只看 Agent / Codex
2. 统计数量 → 确认是否需要迁移

**场景 3：整理团队 skill 资产**
> "我想把所有 skill 导出成清单发给同事"
1. 筛选到需要导出的数据
2. 点击「导出 CSV」→ 下载 `skills-inventory-YYYY-MM-DD.csv`

---

## 黄金圈复盘

```
Why → 解决 skill 看不见、管不住、用不上的问题
How → 自动扫描三个平台目录，同名合并，生成交互式看板
What → 45 个 skill 可视化 + 筛选 + 详情 + 导出
```

---

## 进阶用法

### 定时更新清单
配合 cron 或 launchd，定时运行脚本自动刷新 CSV：

```bash
# 每天早上 9 点自动刷新
0 9 * * * node ~/.claude/skills/skills-dashboard/scripts/main.js
```

### 自定义分类
直接编辑 `scripts/main.js` 中的 `CATEGORY_KEYWORDS` 对象，按你的需求调整分类规则。

### 接入其他数据源
参考 `skillDirs` 数组的定义方式，添加更多目录来源：

```javascript
const skillDirs = [
  { dir: '~/.claude/skills/', source: 'ClaudeCode' },
  { dir: '~/.agents/skills/', source: 'Agent' },
  { dir: '~/.codex/skills/', source: 'Codex' },
  // 添加更多来源...
];
```
