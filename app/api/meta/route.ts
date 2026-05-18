// 暴露服务端 LLM provider 信息给前端，决定是否显示 server-side 角标。
// BYOK 模式下前端独立判断（看 store.userKey），这里只反映 server-side 状态。
// 注意：路由名不能用下划线前缀（Next.js App Router 私有约定），所以叫 meta 而非 _meta。
// 不返回 API key 等敏感信息。

import { NextResponse } from "next/server";

import {
  getServerProviderMeta,
  getServerProviderName,
} from "@/lib/claude";

interface MetaResponse {
  // server 端 provider；如果 server 完全没配置，返回 "none"（部署到 Vercel 但没填任何 env 的场景）
  provider: "cli" | "openrouter" | "none";
  configuredModel?: string;
  lastModel?: string;
  rateLimit?: {
    remaining?: number;
    reset?: string;
  };
}

export async function GET() {
  // server 没配置任何 provider 时 getServerProviderName 会抛错。
  // 这是合法状态（Vercel 部署 + 纯 BYOK）—— 返回 provider:"none" 让前端只走 BYOK 路径。
  try {
    const provider = getServerProviderName();
    const meta = getServerProviderMeta();
    const body: MetaResponse = { provider };

    if (provider === "openrouter") {
      body.configuredModel =
        process.env.OPENROUTER_MODEL ?? "openai/gpt-oss-120b:free";
      if (meta.lastModel) body.lastModel = meta.lastModel;
      if (meta.rateLimit) body.rateLimit = meta.rateLimit;
    }

    return NextResponse.json(body);
  } catch {
    return NextResponse.json({
      provider: "none",
      // 把 OPENROUTER_MODEL 也给前端，让 BYOK 角标显示同一个模型名
      configuredModel:
        process.env.OPENROUTER_MODEL ?? "openai/gpt-oss-120b:free",
    } satisfies MetaResponse);
  }
}
