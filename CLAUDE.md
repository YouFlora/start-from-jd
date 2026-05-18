# CLAUDE.md — Start From JD

> 📌 **这个文档是给谁看的？**
> 本文档是项目的"工程规范长期记忆"，主要给 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 这类 AI 编程助手读，
> 让它们在多次会话中保持一致的工程约束、命名规范和架构边界。
> **普通使用者 / 想跑这个项目的人请看 [`README.md`](./README.md) 即可，无需阅读本文件**。
> （如果你是工程师同行，欢迎读完 —— 这里能看到项目所有非显然的设计决策。）

---

本文件给 Claude Code 看，是项目长期记忆。每次会话 Claude 都会读这里以拿到约定与上下文。

## 项目定位

**Start From JD** 是一个反向 SOP 简历应用：先让用户倾倒经历 → AI 整理 → 对比 JD → 草稿 → 诊断 → ATS 打磨。
最终产物：单页 A4、ATS 友好、可导出 PDF/DOCX/TXT 的简历。

详细产品需求见 [`SPEC.md`](./SPEC.md)；用户的真实经历素材在 `experience.txt`（用于本地手测，不进版本库公开）。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 14 App Router |
| 语言 | TypeScript（strict） |
| 样式 | Tailwind CSS + shadcn/ui 风格组件（已落地到 `components/ui`） |
| AI | 两模式 LLM provider（cli / openrouter）+ **BYOK 自带 key**（见下文） |
| 状态 | zustand + persist（localStorage） |
| 校验 | zod |
| 部署目标 | Vercel |

模型默认 `claude-sonnet-4-6`，通过 `ANTHROPIC_MODEL` 可覆盖。

## 目录结构

```
resumeProject/
├── app/
│   ├── layout.tsx              全局布局
│   ├── page.tsx                首页
│   ├── globals.css             Tailwind + 打印样式
│   ├── brainstorm/page.tsx     Step 0 头脑风暴
│   ├── fit-check/page.tsx      Step 1 匹配度检查
│   ├── draft/page.tsx          Step 2 简历草稿
│   ├── critique/page.tsx       Step 3 诊断
│   ├── polish/page.tsx         Step 4 ATS 打磨
│   ├── settings/page.tsx       BYOK 设置（粘 OpenRouter key + 安全约束说明）
│   └── api/
│       ├── experience/route.ts POST：原始倾倒 → ExperienceDocument
│       ├── fit-check/route.ts  POST：experience + jd → FitCheckResult
│       ├── draft/route.ts      POST：experience + jd → ResumeData
│       ├── critique/route.ts   POST：resume → CritiqueReport
│       ├── polish/route.ts     POST：resume → ResumeData（ATS 打磨版）
│       └── meta/route.ts       GET：server-side provider 状态（BYOK 时返回 "none"）
├── components/
│   ├── step-nav.tsx            顶部步骤导航
│   └── ui/                     button / card / textarea / badge
├── lib/
│   ├── claude.ts               provider 入口（callStructured / callText / getServerProviderName / getServerProviderMeta）
│   ├── providers/
│   │   ├── types.ts            LLMProvider 接口（name="cli"|"openrouter" + generate + 可选 meta）
│   │   ├── cli.ts              child_process 调本机 claude CLI 实现（含 isClaudeCliAvailable）
│   │   └── openrouter.ts       OpenRouter 实现（model chain 自动 fallback；server env 与 BYOK 复用）
│   ├── prompts.ts              系统提示词集中管理（每条含明确 JSON schema 骨架）
│   ├── schemas.ts              所有 AI 输出的 zod schema
│   ├── store.ts                zustand 全局状态
│   └── utils.ts                cn() className 合并
├── types/
│   └── resume.ts               领域类型（与 schemas.ts 一一对应）
├── SPEC.md                     产品需求规格
├── experience.txt              用户本地素材（不公开）
└── 配置：package.json / tsconfig / tailwind.config.ts / next.config.mjs / postcss.config.mjs / .env.local.example / .gitignore
```

## 核心约定（必须遵守）

### 1. 所有 AI 调用走 `lib/claude.ts`

- 任何 LLM 调用都必须经过 `callStructured` 或 `callText`，不要在 Route Handler 里裸用 SDK。
- `callStructured` 自动拼接 `GLOBAL_SYSTEM`（需求 STEP 5 的全局严格规则）+ 语言指令 + 任务指令。
- 输出必须用 zod schema 解析，解析失败直接抛错，前端拿到 4xx；不要给出"半结构化"数据。
- provider 选择是自动的，启动一次定生死。优先级 `BYOK > cli > openrouter`，详见下文「Provider 说明」。
- 业务代码用 `step: "xxx"` 参数让 callStructured 自动按 provider 挑 model；不要在 route 里再手动调 `pickStepModel`（旧接口已删除）。
- 5 个 route 必须从 `req.headers.get("x-llm-key")` 读 BYOK key，传给 callStructured 的 `requestKey` 字段。
- **不支持 Anthropic API key 直连**：项目只走 cli / openrouter / BYOK 三条路径。如果有人提 PR 加 `ANTHROPIC_API_KEY` 分支请拒绝。

### 2. API key 流转规则

- **服务端 env key**（只剩 `OPENROUTER_API_KEY`）：只读 `process.env`，只在 `app/api/*/route.ts` 里访问。
- **BYOK 用户 key**：从前端 `localStorage` → fetch `x-llm-key` header → server `req.headers.get("x-llm-key")` → 透传给 `callStructured` 的 `requestKey`。**用完即弃**，server 端不缓存（`_serverProvider` 单例与 BYOK 路径完全分离）、不写日志、不持久化。
- 客户端组件（`"use client"`）禁止 import `lib/claude.ts` 或 `lib/providers/*`。
- 用户在前端调用 AI 必须通过 `fetch('/api/...', { headers: apiHeaders(userKey) })`，用 `lib/utils.ts` 的 `apiHeaders` 而不是手写 `Content-Type`。
- CLI provider 用 `child_process` 起进程，`cwd` 必须是 `os.tmpdir()`，避免 claude 加载本项目的 CLAUDE.md。

### 3. 系统提示词集中在 `lib/prompts.ts`

- 不要在组件或 Route Handler 里硬编码 prompt 字符串。
- 修改全局规则只改 `GLOBAL_SYSTEM`，新增步骤复制现有 STEPx 常量的格式。

### 4. 数据完整性硬规则（来自需求 STEP 5）

- AI 严禁捏造任何经历、数字、公司、职责。
- 缺失字段必须放进 `ResumeData.missing` 数组，不允许编造填充。
- 单页 A4 是硬约束，溢出时优先裁剪低影响内容，而不是缩字号或编内容。
- 触发硬停止时返回固定字符串（见 `lib/prompts.ts` 中的硬停止文案），前端要识别并显式渲染。

### 5. 状态存储

- 所有用户数据（经历、JD、简历、诊断）通过 `useAppStore` 存 `localStorage`。
- 服务端 Route Handler 不落库、不日志，每次请求是无状态的。

### 6. 国际化

- 全应用支持 `zh` / `en` 两种语言，由 `useAppStore` 的 `lang` 字段控制。
- AI 输出语言必须跟随用户选择（已在 `lib/prompts.ts` 的 `withLang` 实现）。

### 7. 打印 / PDF 导出

- 走浏览器原生 `window.print()`，配合 `@media print` 与 A4 `@page` 规则（已在 `globals.css`）。
- 标记需要打印的容器加 `print-area` class，不需要打印的加 `no-print`。
- 不引入服务端 PDF 服务；DOCX 在客户端生成。

## 路线图（按需求文档拆分）

- [x] Foundation：工程骨架、目录、UI 组件、API 路由、全局状态
- [x] LLM provider 双模式（API / CLI 自动切换）+ 联调通过
- [ ] Step 0：录音（Web Speech API）+ 文件上传 + 文本输入 → 调 `/api/experience`
- [ ] Step 1：JD 输入 + 调 `/api/fit-check` + 对比表 + 匹配分 + 三种结论
- [ ] Step 2：调 `/api/draft` + A4 简历预览
- [ ] Step 3：调 `/api/critique` + 侧边批评列表 + 「迭代」「最终打磨」两个动作
- [ ] Step 4：调 `/api/polish` + 导出工具栏（PDF / DOCX / TXT）+ 全局语言切换
- [ ] 部署 Vercel + 写部署文档

## 开发流程

```bash
cp .env.local.example .env.local   # 默认占位 key 即可，会自动降级到 CLI provider
npm install
npm run dev                         # http://localhost:3000
npm run typecheck                   # 提交前跑一遍
```

### Provider 说明（BYOK + 两服务端模式）

`lib/claude.ts` 的 `resolveProvider({ requestKey })` 按以下顺序决定本次请求用谁：

| 优先级 | provider | 触发条件 | 说明 |
|---|---|---|---|
| **0** | **BYOK** | 请求 header 带 `x-llm-key`，且形如真实 key | 用 `createUserProvider(key)` 实例化 OpenRouter provider，**每请求一个，不缓存** |
| 1 | cli | 本机 PATH 上有 `claude` 且能 `--version` | 用 `child_process` 起 `claude -p`，cwd=`/tmp`，吃 Claude Code 订阅 |
| 2 | openrouter | `OPENROUTER_API_KEY` 是真实 key | 走 OpenRouter HTTP API，model chain 内部 fallback |
| —  | 报错 | 都没有（且没 BYOK） | 抛错并提示去 `/settings` 或配 `.env` |

**关键架构约束**：
- `_serverProvider` 单例与 BYOK 路径**完全分离**。BYOK 不复用任何 server-side provider 状态。
- BYOK 请求结束，`createUserProvider` 返回的 provider 对象被 GC，key 一并消失。
- `/api/meta` 只反映 server-side 状态。BYOK 状态在前端 store 自己判断（`step-nav.tsx` 的 `ProviderBadge`）。
- 项目不支持 Anthropic API key 直连，不要恢复 `lib/providers/api.ts`。

**强制 override**：`.env` 里设 `LLM_PROVIDER=cli|openrouter|auto`（默认 auto）。
命中就锁死 server-side provider，前置条件不满足直接报错——不静默回退。**BYOK 不受 override 影响**（永远是 OpenRouter）。

前端 step-nav 的 `ProviderBadge`：
- 用户 store 有 `userKey` → 显示蓝色 **BYOK** 角标
- 否则 server-side provider === openrouter → 显示琥珀色 **OpenRouter (server)** 角标
- 否则（api / cli）→ 完全静默

### 模型分级策略

`lib/prompts.ts` 维护两套 per-provider 表，业务方调 `pickStepModel("xxx")` 自动取当前 provider 对应的 model。

**Anthropic 路径（api / cli）：`ANTHROPIC_STEP_MODELS`**

| 步骤 | 模型 | 理由 |
|---|---|---|
| Step 0 提取经历 | claude-sonnet-4-6 | 结构化 JSON，质量稳定 |
| Step 1 匹配度 | claude-sonnet-4-6 | 中等推理 |
| Step 2 草稿 | claude-sonnet-4-6 | 中英写作 |
| Step 3 **诊断** | **claude-opus-4-7** | 反奉承硬规则关键步，Opus 对硬约束遵循度最高 |
| Step 4 ATS 打磨 | claude-sonnet-4-6 | 关键词优化 |

**OpenRouter 路径：`OPENROUTER_STEP_MODELS`**

全步骤返回 `undefined`，让 `openrouter.ts` 的 model chain 自决（主力 `openai/gpt-oss-120b:free` → `openrouter/free` → `nvidia/nemotron-3-super-120b-a12b:free`）。
任一模型返回非 2xx 时自动切下一个，全失败才抛错。

OpenRouter provider 下 `callStructured` 启用容忍降级：JSON 解析失败 + schema 校验失败各 retry 1 次，让模型按错误反馈修复输出。

### CLI 模式注意

- 必须先 `claude /login`（OAuth 即可，不需要 API key）
- Sonnet 调用约 $0.04 / 30s；Opus 调用约 $0.06 / 30-60s（计入用户 Claude Code 订阅）
- **不能直接部署上 Vercel**：serverless 环境没有 `claude` CLI。部署前两条路：（a）让用户走 BYOK（推荐），（b）在 Vercel env 配 `OPENROUTER_API_KEY` 让所有访问者免费试用你的额度
- 如果用户机器跑 dev server 时连不上 localhost API（502 Bad Gateway），是 Claude Code 注入的 `http_proxy` 拦截，curl 请加 `--noproxy "*"`

## 给 Claude 的工作风格指引

- 写代码默认不写注释；只在 WHY 不明显时写一行。
- 不要为"未来可能的扩展"提前抽象；三段相似代码好过一个早抽象。
- 不引入新依赖时优先复用 `components/ui` 里已有的组件。
- 改需求时同步更新本文件的"路线图"和"目录结构"。
