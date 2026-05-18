// OpenRouter provider：用免费模型让 GitHub 拉代码的人开箱即用。
// 关键点：
//   - 模型按 chain 顺序试：主力 → openrouter/free（随机路由）→ 具体免费模型兜底
//   - 任何非 2xx 都自动切下一个模型；全失败才抛错
//   - 记录最近成功的 model 与 rate-limit，供 /api/_meta 读出来在 UI 显示

import type { GenerateOptions, LLMProvider, ProviderMeta } from "./types";

const DEFAULT_PRIMARY = "openai/gpt-oss-120b:free";
const FALLBACK_CHAIN = [
  "openrouter/free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterChoice {
  message?: { content?: string };
}
interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  error?: { message?: string };
}

export function createOpenRouterProvider(opts: {
  apiKey: string;
  model?: string;
}): LLMProvider {
  const primary = opts.model ?? DEFAULT_PRIMARY;
  // 主力 + fallback 去重（用户主力可能就是某个 fallback 的别名）
  const chain = [primary, ...FALLBACK_CHAIN.filter((m) => m !== primary)];

  const state: ProviderMeta = {};

  return {
    name: "openrouter",
    meta: () => ({ ...state }),
    async generate({ system, user, maxTokens = 4096, model }: GenerateOptions) {
      // 单次调用 model 覆盖时，把它放到 chain 头
      const tryChain = model && model !== primary ? [model, ...chain] : chain;

      const errors: string[] = [];
      for (const m of tryChain) {
        try {
          const { text, rateLimit } = await callOpenRouter({
            apiKey: opts.apiKey,
            model: m,
            system,
            user,
            maxTokens,
          });
          state.lastModel = m;
          state.rateLimit = rateLimit;
          return text;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`[${m}] ${msg}`);
          // 继续 chain
        }
      }
      throw new Error(
        `OpenRouter 全链路失败:\n${errors.join("\n")}`
      );
    },
  };
}

async function callOpenRouter({
  apiKey,
  model,
  system,
  user,
  maxTokens,
}: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens: number;
}): Promise<{ text: string; rateLimit?: ProviderMeta["rateLimit"] }> {
  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // OpenRouter 文档建议但非必须；用于 dashboard 区分流量来源。
      "HTTP-Referer": "https://github.com/start-from-jd",
      "X-Title": "Start From JD",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const rateLimit = {
    remaining: parseIntOr(resp.headers.get("x-ratelimit-remaining")),
    reset: resp.headers.get("x-ratelimit-reset") ?? undefined,
  };

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${body.slice(0, 300)}`);
  }

  const data = (await resp.json()) as OpenRouterResponse;
  if (data.error) {
    throw new Error(data.error.message ?? "unknown error");
  }
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string" || text.length === 0) {
    throw new Error("响应缺少 choices[0].message.content");
  }
  return { text: text.trim(), rateLimit };
}

function parseIntOr(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}
