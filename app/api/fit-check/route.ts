import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { callStructured } from "@/lib/claude";
import { FitCheckResultSchema, ExperienceDocumentSchema } from "@/lib/schemas";
import { STEP1_FIT_CHECK } from "@/lib/prompts";

export const runtime = "edge";

const BodySchema = z.object({
  experience: ExperienceDocumentSchema,
  jd: z.string().min(20),
  lang: z.enum(["zh", "en"]).default("zh"),
});

export async function POST(req: NextRequest) {
  try {
    const requestKey = req.headers.get("x-llm-key") ?? undefined;
    const body = BodySchema.parse(await req.json());
    const userPrompt = [
      "===经历文档（JSON）===",
      JSON.stringify(body.experience, null, 2),
      "",
      "===目标 JD===",
      body.jd,
    ].join("\n");

    const result = await callStructured({
      system: STEP1_FIT_CHECK,
      user: userPrompt,
      schema: FitCheckResultSchema,
      lang: body.lang,
      step: "fitCheck",
      requestKey,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
