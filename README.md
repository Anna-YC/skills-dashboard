# skills-dashboard

Claude Code / Agent / Codex Skills 可视化管理面板。

自动解析 `~/.claude/skills`、`~/.agents/skills`、`~/.codex/skills` 三个目录下的所有 skill，生成含来源标注的 CSV 清单，并在本地启动可视化看板。
<img width="3382" height="1736" alt="image" src="https://github.com/user-attachments/assets/c64b72ed-16c7-4efe-8916-58f8f1605db5" />
<img width="3840" height="1986" alt="image" src="https://github.com/user-attachments/assets/4e8b64fb-14a8-4b3e-b451-0e71afa3b730" />

---

## 为什么需要这个看板？

> **Why — 解决"看不见、管不住、用不上"的问题**

装了几十个skill，用的时候却经常想不起来：
- **有没有现成的 skill 能做这件事？**
- **这个 skill 在哪个平台（Claude Code / Agent / Codex）能用？**
- **哪些 skill 还没接入，只是躺在文件夹里？**

---

## 它是怎么工作的？

> **How — 自动扫描 + 同名合并 + 可视化看板**

1. **扫描三个目录**：
   - `~/.claude/skills/` → Claude Code
   - `~/.agents/skills/` → Agent
   - `~/.codex/skills/` → Codex

2. **同名合并**：同一 skill 在多平台存在时，自动合并为一行，标注所有来源

3. **生成两份输出**：
   - **看板地址**: http://localhost:3847
   - **CSV 清单**: `~/.claude/skills-inventory.csv`

---

## 快速上手

> **What — 具体怎么用？**

### 启动看板

```bash
# 方式一：命令行直接运行
node ~/.claude/skills/skills-dashboard/scripts/main.js

# 方式二：通过 Claude Code 唤醒
/-skills-dashboard
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

**场景 3：导出团队清单**
> "我想把所有 skill 导出成清单发给同事"
1. 筛选到需要导出的数据
2. 点击「导出 CSV」→ 下载 `skills-inventory-YYYY-MM-DD.csv`

---

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

---

## 解析的目录

| 目录 | 来源标签 |
|------|---------|
| `~/.claude/skills/` | ClaudeCode |
| `~/.agents/skills/` | Agent |
| `~/.codex/skills/` | Codex |

同名 skill（如 `baoyu-post-to-x` 同时存在于 ClaudeCode 和 Agent）合并为一行。

---

## 项目结构

```
skills-dashboard/
├── SKILL.md          # Claude Code skill 元数据
├── README.md         # 本文档
├── TUTORIAL.md       # 详细使用教程（黄金圈视角）
├── index.html        # 仪表盘页面（纯静态，无依赖）
└── scripts/
    └── main.js       # 解析器 + HTTP 服务（Node.js ESM）
```

---

## 技术栈

- **Node.js** — 解析器 + HTTP 服务
- **纯 HTML/JS/CSS** — 仪表盘前端，Chart.js CDN
- **无需构建** — 直接 node 运行，打开浏览器即可

---

## 进阶用法

### 定时更新清单

```bash
# 每天早上 9 点自动刷新
0 9 * * * node ~/.claude/skills/skills-dashboard/scripts/main.js
```

### 自定义分类

编辑 `scripts/main.js` 中的 `CATEGORY_KEYWORDS` 对象，按需调整分类规则。

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

---

## License

MIT
