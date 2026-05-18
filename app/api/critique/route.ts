import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { callStructured } from "@/lib/claude";
import { CritiqueReportSchema, ResumeDataSchema } from "@/lib/schemas";
import { STEP3_CRITIQUE } from "@/lib/prompts";

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
      "===简历草稿（JSON）===",
      JSON.stringify(body.resume, null, 2),
      body.jd ? `\n===目标 JD===\n${body.jd}` : "",
    ].join("\n");

    const result = await callStructured({
      system: STEP3_CRITIQUE,
      user: userPrompt,
      schema: CritiqueReportSchema,
      lang: body.lang,
      step: "critique",
      requestKey,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
