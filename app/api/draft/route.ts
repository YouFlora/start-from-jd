import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { callStructured } from "@/lib/claude";
import { ResumeDataSchema, ExperienceDocumentSchema } from "@/lib/schemas";
import { STEP2_RESUME_DRAFT } from "@/lib/prompts";

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
      system: STEP2_RESUME_DRAFT,
      user: userPrompt,
      schema: ResumeDataSchema,
      lang: body.lang,
      maxTokens: 6000,
      step: "draft",
      requestKey,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
