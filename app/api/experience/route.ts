import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { callStructured } from "@/lib/claude";
import { ExperienceDocumentSchema } from "@/lib/schemas";
import { STEP0_EXPERIENCE_EXTRACT } from "@/lib/prompts";

export const runtime = "edge";

const BodySchema = z.object({
  rawText: z.string().min(20, "原始素材太短，至少 20 字"),
  lang: z.enum(["zh", "en"]).default("zh"),
});

export async function POST(req: NextRequest) {
  try {
    const requestKey = req.headers.get("x-llm-key") ?? undefined;
    const body = BodySchema.parse(await req.json());
    const result = await callStructured({
      system: STEP0_EXPERIENCE_EXTRACT,
      user: body.rawText,
      schema: ExperienceDocumentSchema,
      lang: body.lang,
      step: "experience",
      requestKey,
    });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  // "未检测到可用的 LLM 后端" 是 lib/claude.ts 在三种 provider 都没配置时抛的硬错。
  const status = msg.includes("未检测到可用的 LLM 后端") ? 500 : 400;
  return NextResponse.json({ error: msg }, { status });
}
