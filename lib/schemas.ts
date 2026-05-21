// AI 结构化输出的 zod schema。
// 用途：Route Handler 拿到 LLM 返回的 JSON 后用这些 schema 解析，
// 解析失败说明模型违约，前端会收到 4xx 而不是污染的数据。

import { z } from "zod";

export const ExperienceItemSchema = z.object({
  id: z.string(),
  type: z.enum(["education", "work", "project", "other"]),
  title: z.string(),
  org: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(z.string()).default([]),
  rawNotes: z.string().nullish(),
});

export const ExperienceDocumentSchema = z.object({
  summary: z.string(),
  items: z.array(ExperienceItemSchema).default([]),
  // 免费档模型常漏 skills.hard / skills.soft，整个 skills 也偶尔漏，加 default 兜底。
  skills: z
    .object({
      hard: z.array(z.string()).default([]),
      soft: z.array(z.string()).default([]),
    })
    .default({ hard: [], soft: [] }),
  languages: z.array(z.string()).default([]),
});

export const FitCheckResultSchema = z.object({
  score: z.number().min(0).max(100),
  matrix: z.array(
    z.object({
      dimension: z.string(),
      candidate: z.string().max(60),
      jd: z.string().max(60),
      match: z.enum(["match", "partial", "miss"]),
    })
  ),
  whyMatch: z.array(z.string().max(40)),
  gaps: z.array(z.string().max(40)),
  verdict: z.enum(["go", "stretch", "pivot"]),
  alternativeRoles: z.array(z.string()).nullish(),
});

export const ResumeDataSchema = z.object({
  basics: z.object({
    name: z.string(),
    title: z.string(),
    email: z.string(),
    phone: z.string().nullish(),
    location: z.string().nullish(),
    links: z
      .array(z.object({ label: z.string(), url: z.string() }))
      .nullish(),
  }),
  summary: z.string(),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      location: z.string().nullish(),
      bullets: z.array(z.string()),
    })
  ),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      notes: z.string().nullish(),
    })
  ),
  projects: z
    .array(
      z.object({
        name: z.string(),
        role: z.string().nullish(),
        bullets: z.array(z.string()),
      })
    )
    .nullish(),
  skills: z
    .object({
      hard: z.array(z.string()).default([]),
      soft: z.array(z.string()).default([]),
    })
    .default({ hard: [], soft: [] }),
  missing: z.array(z.string()).nullish(),
});

export const CritiqueReportSchema = z.object({
  critiques: z.array(
    z.object({
      id: z.string(),
      severity: z.enum(["fatal", "major", "minor"]),
      title: z.string(),
      detail: z.string(),
      suggestion: z.string(),
      anchor: z.string().nullish(),
    })
  ),
  overallVerdict: z.string(),
});
