// 全应用共享的领域类型。
// 设计原则：所有 AI 输出都对应一个 zod schema（见 lib/schemas.ts），
// Route Handler 必须先校验再返回，前端可以放心 trust 这些类型。

export type Lang = "zh" | "en";

// ===== Step 0: Experience Document =====
export interface ExperienceItem {
  id: string;
  type: "education" | "work" | "project" | "other";
  title: string;
  org: string;
  startDate: string; // YYYY-MM
  endDate: string; // YYYY-MM | "Present"
  bullets: string[]; // 已清理口水话的关键事实
  rawNotes?: string; // 用户原始口语片段，便于回查
}

export interface ExperienceDocument {
  summary: string;
  items: ExperienceItem[];
  skills: {
    hard: string[];
    soft: string[];
  };
  languages: string[];
}

// ===== Step 1: Fit Check =====
export type FitVerdict = "go" | "stretch" | "pivot";

export interface DnaVsJdRow {
  dimension: string; // 例：技术栈、经验年限、领域
  candidate: string; // ≤ 15 字
  jd: string; // ≤ 15 字
  match: "match" | "partial" | "miss";
}

export interface FitCheckResult {
  score: number; // 0-100
  matrix: DnaVsJdRow[];
  whyMatch: string[]; // 每条 ≤ 15 字
  gaps: string[]; // 每条 ≤ 15 字
  verdict: FitVerdict;
  alternativeRoles?: string[]; // verdict === "pivot" 时给出
}

// ===== Step 2: Resume Draft =====
export interface ResumeData {
  basics: {
    name: string;
    title: string; // 目标职位
    email: string;
    phone?: string;
    location?: string;
    links?: { label: string; url: string }[];
  };
  summary: string; // 2-3 行
  experience: {
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    location?: string;
    bullets: string[]; // 量化、动词开头
  }[];
  education: {
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
    notes?: string;
  }[];
  projects?: {
    name: string;
    role?: string;
    bullets: string[];
  }[];
  skills: {
    hard: string[];
    soft: string[];
  };
  // 如果 AI 必须标记为 MISSING 才能维持完整性，写在这里
  missing?: string[];
}

// ===== Step 3: Critiques =====
export type Severity = "fatal" | "major" | "minor";

export interface Critique {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  suggestion: string; // 可执行建议
  anchor?: string; // 简历里相关 bullet 的引用文本
}

export interface CritiqueReport {
  critiques: Critique[]; // 通常 5 条
  overallVerdict: string; // 一句总评
}

// ===== App-wide store state =====
export interface AppState {
  lang: Lang;
  rawInput: string; // Step 0 用户原始倾倒
  experience?: ExperienceDocument;
  jd?: string;
  fit?: FitCheckResult;
  resume?: ResumeData;
  critique?: CritiqueReport;
  // BYOK：用户自带的 OpenRouter API key。仅 localStorage，绝不上服务器持久化。
  userKey?: string;
}
