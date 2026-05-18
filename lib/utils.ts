import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 前端 fetch /api/* 时统一构造 headers。BYOK 时把用户 key 加到 x-llm-key。
// key 仅在 header 透传，绝不放进 body 或 query string（避免被日志中间件意外抓到）。
export function apiHeaders(userKey?: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (userKey && userKey.trim().length > 0) {
    h["x-llm-key"] = userKey.trim();
  }
  return h;
}

const PLACEHOLDERS = ["TBD", "MISSING"] as const;

// AI 输出里的占位值识别。空 / 占位词 / "TBD: xxx" / "TBD xxx" 都视为缺失。
export function isPlaceholder(v: string | null | undefined): boolean {
  if (!v) return true;
  return PLACEHOLDERS.some(
    (p) => v === p || v.startsWith(p + ":") || v.startsWith(p + " ")
  );
}
