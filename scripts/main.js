#!/usr/bin/env node
/**
 * skills-dashboard 入口脚本
 *
 * 功能：
 * 1. 解析 ~/.claude/skills 和 ~/.agents/skills 下所有 skill
 * 2. 生成 skills-inventory.csv（含当日日期）
 * 3. 启动本地 HTTP 服务（端口 3847），托管 dashboard
 * 4. 提供 GET  /api/skills   → 返回 skill 数据 JSON（含当日日期）
 *    提供 POST /api/reload    → 重新解析 skill → 覆盖 CSV → 返回新数据
 *    提供 GET  /api/csv      → 下载 CSV 文件
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOME = process.env.HOME || '/Users/ai-agent';
// index.html 与 main.js 同级，都放在 skill 根目录下
const SKILL_ROOT = resolve(__dirname, '..');
const CSV_PATH = resolve(HOME, '.claude/skills-inventory.csv');
const HTML_PATH = resolve(SKILL_ROOT, 'index.html');
const PORT = 3847;

// 三个来源目录映射
const skillDirs = [
  { dir: resolve(HOME, '.claude/skills'), source: 'ClaudeCode' },
  { dir: resolve(HOME, '.agents/skills'), source: 'Agent' },
  { dir: resolve(HOME, '.codex/skills'), source: 'Codex' },
];

// ── Skill 解析 ────────────────────────────────────────────────
const CATEGORY_MAP = {
  'update-config': '配置与自动化',
  'keybindings-help': '配置与自动化',
  'simplify': '代码质量',
  'loop': '配置与自动化',
  'schedule': '配置与自动化',
  'claude-api': 'Claude / API 开发',
  'agent-browser': '浏览器与网页',
  'anything-to-notebooklm': '内容处理与知识管理',
  'baoyu-article-illustrator': '图像与视觉生成',
  'baoyu-comic': '图像与视觉生成',
  'baoyu-compress-image': '图像与视觉处理',
  'baoyu-cover-image': '图像与视觉生成',
  'baoyu-format-markdown': '文档与格式转换',
  'baoyu-image-gen': '图像与视觉生成',
  'baoyu-infographic': '图像与视觉生成',
  'baoyu-markdown-to-html': '文档与格式转换',
  'baoyu-post-to-wechat': '内容发布',
  'baoyu-post-to-x': '内容发布',
  'baoyu-slide-deck': '演示与幻灯片',
  'baoyu-translate': '翻译与本地化',
  'baoyu-url-to-markdown': '网页抓取与转换',
  'baoyu-xhs-images': '图像与视觉生成',
  'baoyu-youtube-transcript': '音视频下载与转写',
  'bilibili-downloader-transcriber': '音视频下载与转写',
  'find-skills': 'Skills 生态',
  'frontend-slides': '演示与幻灯片',
  'github': 'Git / GitHub',
  'image-assistant': '图像与视觉生成',
  'my-skill': '开发工作流',
  'opencli-skill': '浏览器与网页',
  'pdf2word': '文档与格式转换',
  'pptx': '演示与幻灯片',
  'prd-doc-writer': '产品与文档',
  'prompt-writer': '提示词与内容创作',
  'release-skills': '发布与版本管理',
  'req-change-workflow': '开发工作流',
  'skill-creator': 'Skills 生态',
  'summarize': '总结与提取',
  'thought-mining': '提示词与内容创作',
  'ui-design-optimizer': '设计与体验',
  'xiaoyuzhou-podcast-downloader': '音视频下载与转写',
  'youtube-clipper': '音视频处理',
  'zcf:git-rollback': 'Git / GitHub',
  'zcf:git-cleanBranches': 'Git / GitHub',
  'zcf:git-commit': 'Git / GitHub',
  'zcf:init-project': '开发工作流',
  'zcf:feat': '开发工作流',
  'zcf:workflow': '开发工作流',
  'zcf:bmad-init': '开发工作流',
  'zcf:git-worktree': 'Git / GitHub',
  // 未分类补充分类
  'dengshan-image': '图像与视觉生成',
  'prompt-writer-workspace': '提示词与内容创作',
  'skills-dashboard': '开发工作流',
  'xiaoyuzhou-podcast-downloader-workspace': '音视频下载与转写',
  'baoyu-danger-gemini-web': '图像与视觉生成',
  'baoyu-danger-x-to-markdown': '网页抓取与转换',
  'baoyu-post-to-weibo': '内容发布',
  'weather': '工具与实用',
  'web-access': '工具与实用',
  'wechat-typesetting-cy': '内容发布',
};

const LINKED_SKILLS = new Set([
  // 已接入 ~/.claude/skills 的
  'agent-browser','anything-to-notebooklm','baoyu-article-illustrator','baoyu-comic',
  'baoyu-compress-image','baoyu-cover-image','baoyu-format-markdown','baoyu-image-gen',
  'baoyu-infographic','baoyu-markdown-to-html','baoyu-post-to-wechat','baoyu-post-to-x',
  'baoyu-slide-deck','baoyu-translate','baoyu-url-to-markdown','baoyu-xhs-images',
  'baoyu-youtube-transcript','bilibili-downloader-transcriber','find-skills','frontend-slides',
  'github','image-assistant','my-skill','opencli-skill','pdf2word','pptx','prd-doc-writer',
  'prompt-writer','release-skills','req-change-workflow','skill-creator','summarize',
  'thought-mining','ui-design-optimizer','xiaoyuzhou-podcast-downloader','youtube-clipper',
]);

const DESC_MAP = {
  'anything-to-notebooklm': '多源内容智能处理器：支持微信公众号、网页、YouTube、PDF、Markdown 等内容接入，自动上传到 NotebookLM，并生成播客、PPT、思维导图等多种格式。默认保存到 ~/Downloads/NotebookLM/。',
  'baoyu-article-illustrator': '分析文章结构并识别需要视觉辅助的位置，通过“类型×风格”二维方式生成插图。',
  'baoyu-comic': '知识漫画创作工具，支持多种画风与基调组合，可生成带详细分镜的原创教育漫画。',
  'baoyu-compress-image': '将图片压缩为 WebP（默认）或 PNG，并自动选择最合适的处理工具。',
  'baoyu-cover-image': '生成文章封面图，支持类型、配色、渲染、文字、情绪五个维度。',
  'baoyu-format-markdown': '格式化纯文本或 Markdown 文件，补充 frontmatter、标题、摘要、标题层级等结构。',
  'baoyu-image-gen': '基于 OpenAI、Azure、Google、OpenRouter、DashScope、Jimeng、Seedream 等 API 进行 AI 生图。',
  'baoyu-infographic': '生成专业信息图，支持 21 种布局和 20 种视觉风格。',
  'baoyu-markdown-to-html': '将 Markdown 转换为带样式的 HTML，兼容微信主题。',
  'baoyu-post-to-wechat': '通过 API 或 Chrome CDP 将内容发布到微信公众号。',
  'baoyu-post-to-x': '将内容和文章发布到 X（Twitter），支持真实 Chrome + CDP 流程。',
  'baoyu-slide-deck': '根据内容生成专业幻灯片图片，会先创建大纲再逐页生成。',
  'baoyu-translate': '提供 quick、normal、refined 三种文档翻译模式，支持术语表配置。',
  'baoyu-url-to-markdown': '通过 Chrome CDP 抓取任意 URL 并转换为 Markdown，内置多级回退管线。',
  'baoyu-xhs-images': '生成适合小红书的信息图系列图，支持 11 种视觉风格和 8 种布局。',
  'baoyu-youtube-transcript': '按 URL 或视频 ID 下载 YouTube 字幕/封面图，支持多语言和翻译。',
  'bilibili-downloader-transcriber': '用户给出 B 站视频链接时，自动下载视频/音频并转写字幕。',
  'find-skills': '帮助发现并安装可用的 agent skills。',
  'github': '使用 gh CLI 与 GitHub 交互，可处理 issue、PR、CI 运行记录和高级 API 查询。',
  'release-skills': '通用发布工作流，自动检测版本文件和 changelog。',
  'summarize': '使用 summarize CLI 总结 URL 或文件内容，支持网页、PDF、图片、音频和 YouTube。',
  'xiaoyuzhou-podcast-downloader': '下载小宇宙播客单集，提取元信息和 shownotes，并可转写字幕。',
  'update-config': '通过 settings.json 配置 Claude Code harness 和 hooks 自动化行为。',
  'keybindings-help': '自定义键盘快捷键、重绑按键、添加组合键。',
  'simplify': '审查已修改代码的复用性、质量和效率，并修复发现的问题。',
  'loop': '按固定间隔重复运行一个 prompt 或 slash command，适合轮询状态。',
  'schedule': '创建、更新、列出或运行按 cron 调度的远程 agents / triggers。',
  'claude-api': '用于基于 Claude API、Anthropic SDK 或 Agent SDK 构建应用。',
  'agent-browser': '面向 AI agents 的浏览器自动化 CLI，支持打开网页、填表、截图等。',
  'frontend-slides': '从零创建富动画 HTML 演示文稿，或把 PPTX 转成网页演示。',
  'image-assistant': '把文章内容整理成统一风格的 16:9 信息图提示词。',
  'my-skill': '通用改动执行模板（目录门禁版），避免“改了但没生效”。',
  'opencli-skill': '使用 opencli CLI 借助用户 Chrome 登录态操作社交与内容网站。',
  'pdf2word': '将 PDF 文档转换为 Word 文档，尽量保留图片和原始格式。',
  'pptx': '处理 PPTX 的创建、读取、编辑、合并、拆分与内容提取等操作。',
  'prd-doc-writer': '以故事驱动和分阶段确认的方式编写和迭代 PRD / 需求文档。',
  'prompt-writer': '编写结构化提示词模板，并通过分步单问对话引导用户完善提示词。',
  'req-change-workflow': '将需求/功能变更标准化为可重复流程，避免范围蔓延。',
  'skill-creator': '创建新 skills、修改和改进现有 skills，并衡量 skill 效果。',
  'thought-mining': '通过对话帮助用户把零散想法整理成结构化文章或内容。',
  'ui-design-optimizer': '基于 Ant Design 设计原则提供 UI 设计评审和交互优化指导。',
  'youtube-clipper': 'YouTube 视频智能剪辑，下载、选择片段、翻译字幕、烧录到视频。',
  'zcf:git-rollback': '交互式回滚 Git 分支到历史版本。',
  'zcf:git-cleanBranches': '安全查找并清理已合并或过期的 Git 分支。',
  'zcf:git-commit': '仅用 Git 分析改动并自动生成 conventional commit 信息。',
  'zcf:init-project': '初始化项目 AI 上下文，生成或更新 CLAUDE.md 索引。',
  'zcf:feat': '用于新增功能开发的命令，支持完整开发流程。',
  'zcf:workflow': '专业 AI 编程助手六阶段工作流：研究→构思→计划→执行→优化→评审。',
  'zcf:bmad-init': '/bmad-init 命令对应的 skill。',
  'zcf:git-worktree': '管理 Git worktree，支持创建、IDE 集成和内容迁移。',
  'dengshan-image': 'AI 图片生成工具。当用户提到"配图"、"封面图"、"帮我作图"、"出图"时调用。接收内容（文件路径/直接粘贴），加工生图提示词，调用 Kie AI 生成图片，保存到与读取文件同目录。触发条件：用户请求生成图片时。',
  'skills-dashboard': 'Skills 可视化管理面板，展示所有 Claude Code skills 的状态、分类、来源和详情。',
  'baoyu-danger-gemini-web': '通过逆向 Gemini Web API 生成图片和文本，支持文字生成、图片生成、视觉输入和多轮对话。',
  'baoyu-danger-x-to-markdown': '将 X（Twitter）推文和文章转换为带 YAML front matter 的 Markdown。',
  'baoyu-post-to-weibo': '通过 API 或 Chrome CDP 将内容发布到微博，支持普通微博和头条文章。',
  'weather': '获取当前天气和天气预报，无需 API key。',
  'web-access': '所有联网操作必须通过此 skill 处理，包括：搜索、网页抓取、登录后操作、网络交互等。',
  'wechat-typesetting-cy': '微信公众号文章多模板排版技能，将纯文本或 Markdown 转换为精美排版的 HTML 代码。',
};

const TITLE_MAP = {
  'anything-to-notebooklm': '多源内容 → NotebookLM 智能处理器',
  'baoyu-article-illustrator': 'Article Illustrator',
  'baoyu-comic': 'Knowledge Comic Creator',
  'baoyu-compress-image': 'Image Compressor',
  'baoyu-cover-image': 'Cover Image Generator',
  'baoyu-format-markdown': 'Markdown Formatter',
  'baoyu-image-gen': 'Image Generation (AI SDK)',
  'baoyu-infographic': 'Infographic Generator',
  'baoyu-markdown-to-html': 'Markdown to HTML Converter',
  'baoyu-post-to-wechat': 'Post to WeChat Official Account',
  'baoyu-post-to-x': 'Post to X (Twitter)',
  'baoyu-slide-deck': 'Slide Deck Generator',
  'baoyu-translate': 'Translator',
  'baoyu-url-to-markdown': 'URL to Markdown',
  'baoyu-xhs-images': 'Xiaohongshu Infographic Series Generator',
  'baoyu-youtube-transcript': 'YouTube Transcript',
  'bilibili-downloader-transcriber': 'B 站视频下载与转写工具',
  'find-skills': 'Find Skills',
  'github': 'GitHub Skill',
  'release-skills': 'Release Skills',
  'summarize': 'Summarize',
  'xiaoyuzhou-podcast-downloader': '小宇宙播客单集下载与提取工具',
  'update-config': 'Update Config',
  'keybindings-help': 'Keybindings Help',
  'simplify': 'Simplify',
  'loop': 'Loop',
  'schedule': 'Schedule',
  'claude-api': 'Claude API',
  'agent-browser': 'Browser Automation with agent-browser',
  'frontend-slides': 'Frontend Slides Skill',
  'image-assistant': '配图助手',
  'my-skill': 'My Skill (目录门禁+小步回归)',
  'opencli-skill': 'opencli',
  'pdf2word': 'PDF to Word',
  'pptx': 'PPTX Skill',
  'prd-doc-writer': 'PRD文档梳理提示词',
  'prompt-writer': 'Prompt Writer',
  'req-change-workflow': 'Req Change Workflow',
  'skill-creator': 'Skill Creator',
  'thought-mining': '思维挖掘助手',
  'ui-design-optimizer': 'UI 设计优化助手',
  'youtube-clipper': 'YouTube 视频智能剪辑工具',
  'zcf:git-rollback': 'Git Rollback',
  'zcf:git-cleanBranches': 'Git Clean Branches',
  'zcf:git-commit': 'Git Commit',
  'zcf:init-project': 'Init Project',
  'zcf:feat': 'Feature Workflow',
  'zcf:workflow': 'Workflow',
  'zcf:bmad-init': 'BMAD Init',
  'zcf:git-worktree': 'Git Worktree',
  'dengshan-image': 'Dengshan Image',
  'prompt-writer-workspace': 'Prompt Writer Workspace',
  'skills-dashboard': 'Skills Dashboard',
  'xiaoyuzhou-podcast-downloader-workspace': '小宇宙播客 Workspace',
  'baoyu-danger-gemini-web': 'Gemini Web Client',
  'baoyu-danger-x-to-markdown': 'X to Markdown',
  'baoyu-post-to-weibo': 'Post to Weibo',
  'weather': 'Weather',
  'web-access': 'Web Access',
  'wechat-typesetting-cy': '微信公众号排版',
};

function parseSKILLMD(filePath) {
  try {
    const text = readFileSync(filePath, 'utf-8');
    const name = (text.match(/^name:\s*(.+)$/m) || [])[1] || basename(dirname(filePath));
    const rawDesc = (text.match(/^description:\s*(.+)$/m) || [])[1] || '';
    // unwrap YAML block scalar
    const desc = rawDesc.replace(/^>\s*/gm, '').replace(/^\|\s*/gm, '').trim();
    const heading = (text.match(/^#\s+(.+)$/m) || [])[1] || '';
    return { name: name.trim(), desc, heading: heading.trim() };
  } catch {
    return null;
  }
}

function collectSkills() {
  const skills = [];

  for (const { dir, source } of skillDirs) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      // skip hidden dirs, .DS_Store, and meta dirs
      if (entry.startsWith('.') || entry === '.DS_Store') continue;
      const full = join(dir, entry);
      if (!statSync(full).isDirectory()) continue;
      const skillMD = join(full, 'SKILL.md');
      const info = parseSKILLMD(skillMD);
      const name = entry;
      skills.push({
        name,
        desc: DESC_MAP[name] || info?.desc || '',
        title: TITLE_MAP[name] || info?.heading || name,
        cat: CATEGORY_MAP[name] || '未分类',
        linked: LINKED_SKILLS.has(name),
        sources: [source],
      });
    }
  }

  // 按名称聚合：合并 sources 数组
  const map = new Map();
  for (const s of skills) {
    if (map.has(s.name)) {
      const existing = map.get(s.name);
      for (const src of (s.sources || [])) {
        if (!existing.sources.includes(src)) existing.sources.push(src);
      }
      if (s.linked) existing.linked = true;
    } else {
      map.set(s.name, s);
    }
  }
  return [...map.values()];
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function escapeCSV(v) {
  return '"' + String(v || '').replace(/"/g, '""') + '"';
}

function generateCSV(skills) {
  const date = todayStr();
  const lines = ['skill名称,描述,标题,分类,来源'];
  for (const s of skills) {
    lines.push([s.name, s.desc, s.title, s.cat, s.sources.join(', ')].map(escapeCSV).join(','));
  }
  return { csv: lines.join('\n'), date };
}

// ── HTTP Server ──────────────────────────────────────────────
function startServer(skills, csvContent) {
  const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // Serve HTML
    if (url === '/' || url === '/index.html') {
      let html = readFileSync(HTML_PATH, 'utf-8');
      // Inject today's date and server-mode API base
      html = html
        .replace('const API_BASE = \'\';', `const API_BASE = 'http://localhost:${PORT}';`)
        .replace(/id="updateDate">[^<]+<\/span>/, `id="updateDate">${todayStr()}</span>`)
        .replace('const skills = \\[', `let _serverSkills = [`)
        .replace(
          /function init\(\) \{\s*applyTheme\(\);\s*renderFilters\(\);\s*render\(\);\s*renderCharts\(\);\s*animateProgress\(\);\s*\}/,
          `function init() {\n  applyTheme();\n  if (window.__skillsFromServer) {\n    skills.length = 0; skills.push(...window.__skillsFromServer);\n  }\n  renderFilters(); render(); renderCharts(); animateProgress();\n}`
        )
        .replace(/\/\/ ── API Base ──/,
          `window.__skillsFromServer = ${JSON.stringify(skills)};\n// ── API Base ──`)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    // GET /api/skills
    if (url === '/api/skills' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ skills, date: todayStr() }));
      return;
    }

    // POST /api/reload
    if (url === '/api/reload' && req.method === 'POST') {
      console.log('Reloading skills…');
      const fresh = collectSkills();
      const { csv, date } = generateCSV(fresh);
      writeFileSync(CSV_PATH, '\uFEFF' + csv, 'utf-8');
      console.log(`CSV updated → ${CSV_PATH} (${fresh.length} skills, ${date})`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ skills: fresh, date }));
      return;
    }

    // GET /api/csv
    if (url === '/api/csv' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="skills-inventory-${todayStr()}.csv"`,
      });
      res.end('\uFEFF' + csvContent);
      return;
    }

    // 404
    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`\n🎯 Skills Dashboard → ${url}\n`);
    // open browser
    spawn('open', [url], { detached: true, stdio: 'ignore' });
  });
}

// ── Main ─────────────────────────────────────────────────────
const skills = collectSkills();
const { csv, date } = generateCSV(skills);
writeFileSync(CSV_PATH, csv, 'utf-8');
console.log(`CSV written → ${CSV_PATH} (${skills.length} skills, ${date})`);
startServer(skills, csv);
