# Start From JD

> 反向 SOP 简历助手：从你自己开始，而不是从 JD 开始。

大多数人写简历是照抄 JD，结果千篇一律、ATS 也分不出你和别人的差别。
**Start From JD** 反过来：先让用户倾倒原始经历，AI 把它结构化，再对照 JD 生成针对性的单页 A4 简历，最后给出残酷的诊断与可执行建议。

- 🔗 **Live Demo**：_部署中_（BYOK 模式，浏览器粘自己的 OpenRouter key 即可，零成本试用）
- 📷 **Screenshots**：见 [`docs/screenshots/`](./docs/screenshots/)
- 📓 **内部协作文档**：[`CLAUDE.md`](./CLAUDE.md) —— 项目长期工程规范

---

## 工作流

| 步骤 | 做什么 | 关键技术 |
|---|---|---|
| **1. 头脑风暴** | 麦克风口述 / 文件上传 / 直接打字 → AI 清洗口水话，输出结构化经历文档 | Web Speech API + 结构化 schema |
| **2. 匹配度检查** | 贴入目标 JD → AI 输出对比表、0–100 匹配分、是否值得投 | LLM 对比推理 |
| **3. 简历草稿** | 基于经历 + JD 生成单页 A4 简历初稿，量化成果优先 | Prompt design + JSON schema |
| **4. 诊断** | 5 条带危险等级的批评（致命 / 重要 / 微瑕），每条带可执行建议 | **强制使用 Opus** 抵抗模型奉承 |
| **5. ATS 打磨** | 严格 ATS 合规，导出 PDF / DOCX / TXT | 浏览器原生打印 + 结构化导出 |

---

## 工程亮点（Why this is more than a "wrapper"）

每一条都对应一个具体决策和代码位置。

### 1. 结构化输出 + 强校验（不许半结构化）

- 所有 LLM 输出经 [`lib/schemas.ts`](./lib/schemas.ts) 的 zod schema 解析
- 解析失败 = 整个请求 4xx，**前端永远不会拿到半结构化数据**
- OpenRouter 模式下额外启用了"按错误反馈让模型修复输出"的 1 次重试（[`lib/providers/openrouter.ts`](./lib/providers/openrouter.ts)）

### 2. Provider 抽象 + 自动 fallback

三种模式自动判别（[`lib/claude.ts`](./lib/claude.ts) `resolveProvider`）：

| 优先级 | provider | 触发条件 |
|---|---|---|
| 0 | **BYOK** | 请求 header 带 `x-llm-key`，**每请求一个实例，不缓存** |
| 1 | cli | 本机 `claude` CLI 可用 → 走子进程，吃 Claude Code 订阅 |
| 2 | openrouter | `OPENROUTER_API_KEY` 真实 → 走 HTTP API，内部 model chain 自动 fallback |

`LLM_PROVIDER` env 可强制锁死任一 provider，前置条件不满足直接报错 —— **不静默回退**，便于 CI 调试。

### 3. 请求级 BYOK 密钥隔离（安全 / 合规）

用户在浏览器粘 OpenRouter key 后：

```
localStorage → fetch x-llm-key header → server req.headers.get("x-llm-key")
            → 透传给 callStructured 的 requestKey
            → createUserProvider(key) 实例化一次性 provider
            → 响应完，provider 对象被 GC，key 一并消失
```

关键约束：
- server 端 **不缓存、不日志、不持久化** 用户 key
- `_serverProvider` 单例与 BYOK 路径**完全分离**，不会复用任何 server-side provider 状态
- 客户端组件禁止 `import "lib/claude.ts"`（防止 key 进 bundle）
- CLI provider 起子进程时 `cwd=os.tmpdir()`，**防止 Claude CLI 加载本项目的 CLAUDE.md 污染上下文**

### 4. 步骤级模型分级（成本与质量的工程化决策）

不同步骤对模型能力的需求不同，[`lib/prompts.ts`](./lib/prompts.ts) 维护 per-provider 的 model 映射：

| 步骤 | 模型 | 理由 |
|---|---|---|
| 1-3, 5 | Sonnet 4.6 | 中等推理、写作、JSON 结构化 |
| 4 诊断 | **Opus 4.7** | 反奉承硬规则关键步，Opus 对硬约束遵循度最高 |

业务代码用 `step: "xxx"` 自动选模型，**不在 route 里硬编码 model id**。

### 5. Stateless 后端 + 客户端持久化

- 所有用户数据（经历、JD、简历）通过 zustand + persist 存 `localStorage`
- 服务端 Route Handler 不落库、不日志、每请求无状态
- 直接 Vercel serverless 即可部署，无需后端运维

### 6. 数据完整性硬规则（来自需求文档 STEP 5）

- AI **严禁捏造**任何经历、数字、公司、职责
- 缺失字段必须放进 `ResumeData.missing` 数组，不允许编造填充
- 单页 A4 是硬约束，溢出时优先**裁剪低影响内容**，绝不缩字号
- 触发硬停止时返回固定字符串，前端识别并显式渲染

这些规则统一收口在 [`lib/prompts.ts`](./lib/prompts.ts) 的 `GLOBAL_SYSTEM`，所有 LLM 调用自动注入。

---

## 技术栈

Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · shadcn/ui · Claude (Anthropic) / OpenRouter · zustand · zod

---

## 本地运行

需要 Node.js 20+。

```bash
git clone https://github.com/YouFlora/start-from-jd.git
cd start-from-jd
npm install
npm run dev
```

启动后打开 [http://localhost:3000](http://localhost:3000)。LLM 后端按你的情况**三选一**：

| 你的情况 | 怎么做 | 成本 |
|---|---|---|
| 🟢 **没有 Claude 订阅**（多数人） | 去 [openrouter.ai](https://openrouter.ai) 5 分钟注册拿免费 key → `cp .env.local.example .env.local` → 把 `OPENROUTER_API_KEY` 填进去 → 重启 dev server。默认用免费模型 `openai/gpt-oss-120b:free` | **完全免费** |
| 🟡 **有 Claude Code 订阅** | 本机 `claude /login` 即可，**零 env 配置**。自动检测 CLI 走子进程 | 吃你的 Claude 订阅额度 |
| 🔵 **完全不想配文件** | 直接 `npm run dev`，浏览器打开 [/settings](http://localhost:3000/settings) 粘自己的 OpenRouter key（仅存 localStorage） | 取决于你的 key |

**优先级是自动判别的**：BYOK > CLI > OpenRouter env。同时配多个无所谓，不冲突。
强制锁死某一种用 `LLM_PROVIDER=cli|openrouter|auto`（详见 `.env.local.example`）。

---

## 部署（Vercel + BYOK 推荐）

如果只是让别人能用 demo、自己不想付一分钱：

1. `git push` → Vercel 自动部署
2. Vercel **不需要配任何 env**（甚至刻意不配，强制 BYOK）
3. 用户首次访问，去 `/settings` 粘自己的 OpenRouter key（5 分钟注册免费拿）
4. key 仅存在用户浏览器 localStorage，**绝不上你服务器** —— 访问量过大不会爆你的 key

如果想给少量用户开"开箱即用"模式：Vercel Environment Variables 配 `OPENROUTER_API_KEY`，用户未自带 key 时走你的（注意 token 预算）。

---

## 项目结构

```
app/             Next.js App Router 页面 + Route Handler
  └── api/       6 个端点：experience / fit-check / draft / critique / polish / meta
components/      UI 组件 (shadcn/ui 风格)
lib/
  ├── claude.ts        provider 入口（callStructured / callText）
  ├── providers/       cli.ts / openrouter.ts + types.ts
  ├── prompts.ts       系统提示词 + 模型分级集中管理
  ├── schemas.ts       所有 AI 输出的 zod schema
  ├── store.ts         zustand 全局状态 + localStorage 持久化
  └── utils.ts
types/           领域类型（与 schemas 一一对应）
docs/screenshots/  产品截图
CLAUDE.md        项目长期协作文档
```

---

## License

MIT
