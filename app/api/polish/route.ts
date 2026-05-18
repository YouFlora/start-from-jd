import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { callStructured } from "@/lib/claude";
import { ResumeDataSchema } from "@/lib/schemas";
import { STEP4_ATS_POLISH } from "@/lib/prompts";

const BodySchema = z.object({
  resume: ResumeDataSchema,
  jd: z.string().min(20).optional(),
  lang: z.enum(["zh", "en"]).default("zh"),
});

export async function POST(req: NextRequest) {
  try {
    const requestKey = req.headers.get("x-llm-key") ?? undefined;
    const body = BodySchema.parse(await req.json());
    const userPrompt = [
      "===当前简历（JSON）===",
      JSON.stringify(body.resume, null, 2),
      body.jd ? `\n===目标 JD===\n${body.jd}` : "",
    ].join("\n");

    const result = await callStructured({
      system: STEP4_ATS_POLISH,
      user: userPrompt,
      schema: ResumeDataSchema,
      lang: body.lang,
      maxTokens: 6000,
      step: "polish",
      requestKey,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
