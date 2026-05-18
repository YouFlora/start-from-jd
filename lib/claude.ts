// 业务方调用入口。两种 key 来源：
//   - 用户自带（BYOK）：route 从 x-llm-key header 读，每请求一个 provider，不缓存
//   - 服务端 env：按 cli > openrouter > 报错 自动判别，结果缓存到模块作用域
//
// 服务端无状态约束：BYOK 路径下 key 不写日志、不存任何持久化、用完即弃。

import { z } from "zod";

import {
  ANTHROPIC_STEP_MODELS,
  GLOBAL_SYSTEM,
  OPENROUTER_STEP_MODELS,
  withLang,
  type StepKey,
} from "./prompts";
import { createCliProvider, isClaudeCliAvailable } from "./providers/cli";
import { createOpenRouterProvider } from "./providers/openrouter";
import type {
  LLMProvider,
  ProviderMeta,
  ProviderName,
} from "./providers/types";
import type { Lang } from "@/types/resume";

const PLACEHOLDER_HINT = "xxxx";
function isRealKey(v: string | undefined): v is string {
  return !!v && v.length > 20 && !v.toLowerCase().includes(PLACEHOLDER_HINT);
}

// ===== BYOK：每请求实例化，不缓存 =====
// 默认假定用户带的是 OpenRouter key（sk-or-...）。后续要支持 sk-ant 自带可在这里加分支。
function createUserProvider(userKey: string): LLMProvider {
  return createOpenRouterProvider({
    apiKey: userKey,
    model: process.env.OPENROUTER_MODEL,
  });
}

// ===== 服务端 env：进程内只解析一次 =====
let _serverProvider: LLMProvider | null = null;
function getServerProvider(): LLMProvider {
  if (_serverProvider) return _serverProvider;

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  // CLI 路径用的 Claude 模型名（claude CLI 自己处理 OAuth，不需要 server 端 key）
  const cliModel = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
  const openrouterModel = process.env.OPENROUTER_MODEL;

  // 强制 override：LLM_PROVIDER=cli|openrouter|auto。命中就锁死，前置条件不满足直接报错。
  const override = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (override && override !== "auto") {
    if (override === "cli") {
      if (!isClaudeCliAvailable()) {
        throw new Error(
          "LLM_PROVIDER=cli 但本机 `claude` CLI 不可用。先 `claude /login` 或检查 PATH。"
        );
      }
      _serverProvider = createCliProvider({ model: cliModel });
    } else if (override === "openrouter") {
      if (!isRealKey(openrouterKey)) {
        throw new Error(
          "LLM_PROVIDER=openrouter 但 OPENROUTER_API_KEY 未配置或仍是 xxxx 占位。"
        );
      }
      _serverProvider = createOpenRouterProvider({
        apiKey: openrouterKey,
        model: openrouterModel,
      });
    } else {
      throw new Error(
        `LLM_PROVIDER="${override}" 不合法。可选：cli | openrouter | auto`
      );
    }
    return _serverProvider;
  }

  if (isClaudeCliAvailable()) {
    _serverProvider = createCliProvider({ model: cliModel });
  } else if (isRealKey(openrouterKey)) {
    _serverProvider = createOpenRouterProvider({
      apiKey: openrouterKey,
      model: openrouterModel,
    });
  } else {
    throw new Error(
      "未检测到可用的 LLM 后端。本应用支持以下方式（任选其一）：\n" +
        "  · BYOK：浏览器访问 /settings 粘 OpenRouter key（推荐用于公开部署）\n" +
        "  · 本机 claude CLI：`claude /login` 后自动可用（推荐本地开发）\n" +
        "  · 服务端 OPENROUTER_API_KEY=sk-or-...（让所有访问者免费试用你的额度）"
    );
  }
  return _serverProvider;
}

// 解析本次请求要用的 provider。BYOK 优先；fallback 到 env-side 自动判别。
function resolveProvider(opts: { requestKey?: string }): LLMProvider {
  if (opts.requestKey && isRealKey(opts.requestKey)) {
    return createUserProvider(opts.requestKey);
  }
  return getServerProvider();
}

// 仅 server-side（/api/meta 用），不感知 BYOK。
export function getServerProviderName(): ProviderName {
  return getServerProvider().name;
}
export function getServerProviderMeta(): ProviderMeta {
  const p = getServerProvider();
  return p.meta ? p.meta() : {};
}

function pickModelFor(
  providerName: ProviderName,
  step: StepKey
): string | undefined {
  return providerName === "openrouter"
    ? OPENROUTER_STEP_MODELS[step]
    : ANTHROPIC_STEP_MODELS[step];
}

interface CallOptions<T> {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  lang: Lang;
  maxTokens?: number;
  // 步骤名 → 自动按当前 provider 挑模型。优先级低于显式 model。
  step?: StepKey;
  // 单次调用强制覆盖模型（极少用）。
  model?: string;
  // BYOK：本次请求带的用户 key。route 从 x-llm-key header 读出后透传。
  requestKey?: string;
}

// 调用 LLM 并把响应解析为指定 schema 的对象。
// OpenRouter provider 下启用容忍降级：JSON 不合法或 schema 不通过时各 retry 1 次。
export async function callStructured<T>({
  system,
  user,
  schema,
  lang,
  maxTokens = 4096,
  step,
  model,
  requestKey,
}: CallOptions<T>): Promise<T> {
  const fullSystem = `${GLOBAL_SYSTEM}\n\n${withLang(lang)}\n\n${system}`;
  const provider = resolveProvider({ requestKey });
  const finalModel = model ?? (step ? pickModelFor(provider.name, step) : undefined);
  const tolerant = provider.name === "openrouter";

  const text = await provider.generate({
    system: fullSystem,
    user,
    maxTokens,
    model: finalModel,
  });

  // ===== JSON 层 =====
  let parsed = tryParse(text);
  if (parsed === null && tolerant) {
    const fixed = await provider.generate({
      system:
        "你是 JSON 修复工具。把下面的内容修复成严格的 JSON 对象，只输出 JSON 本身，不要 markdown 代码块、不要解释、不要前后缀文字。",
      user: text,
      maxTokens,
    });
    parsed = tryParse(fixed);
  }
  if (parsed === null) {
    throw new Error(
      `LLM 返回的不是合法 JSON。原文前 400 字：\n${text.slice(0, 400)}`
    );
  }

  // ===== Schema 层 =====
  let result = schema.safeParse(parsed);
  if (!result.success && tolerant) {
    const fixed = await provider.generate({
      system:
        "你是 JSON 修复工具。下面的 JSON 不符合预期 schema，请按用户原始任务的 schema 重新整理输出。只返回修复后的 JSON 对象，不要解释。",
      user:
        `原始输出:\n${JSON.stringify(parsed).slice(0, 4000)}\n\n` +
        `错误说明:\n${result.error.message.slice(0, 600)}`,
      maxTokens,
    });
    const reparsed = tryParse(fixed);
    if (reparsed !== null) {
      result = schema.safeParse(reparsed);
    }
  }
  if (!result.success) {
    throw new Error(
      `LLM 输出未通过 schema 校验。错误：${result.error.message.slice(0, 400)}`
    );
  }
  return result.data;
}

function tryParse(text: string): unknown {
  const json = extractJson(text);
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// 从模型自由文本中抠出 JSON 主体。
// 容忍：```json 围栏、前后解释文字、尾部多余空白。
function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) return text.slice(first, last + 1);

  return text.trim();
}

// 自由文本对话，少量场景用（例如临时清洗）。
export async function callText({
  system,
  user,
  lang,
  maxTokens = 2048,
  model,
  requestKey,
}: {
  system: string;
  user: string;
  lang: Lang;
  maxTokens?: number;
  model?: string;
  requestKey?: string;
}): Promise<string> {
  const fullSystem = `${GLOBAL_SYSTEM}\n\n${withLang(lang)}\n\n${system}`;
  return resolveProvider({ requestKey }).generate({
    system: fullSystem,
    user,
    maxTokens,
    model,
  });
}
