"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const STEPS = [
  { href: "/brainstorm", label: "1. 头脑风暴", short: "Brainstorm" },
  { href: "/fit-check", label: "2. 匹配度检查", short: "Fit Check" },
  { href: "/draft", label: "3. 简历草稿", short: "Draft" },
  { href: "/critique", label: "4. 诊断", short: "Critique" },
  { href: "/polish", label: "5. ATS 打磨", short: "Polish" },
];

interface ProviderMeta {
  provider: "cli" | "openrouter" | "none";
  configuredModel?: string;
  lastModel?: string;
  rateLimit?: { remaining?: number };
}

export function StepNav() {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((s) => pathname.startsWith(s.href));

  return (
    <nav className="border-b bg-background no-print">
      <div className="container flex h-14 items-center gap-1 overflow-x-auto">
        <Link
          href="/"
          className="mr-4 shrink-0 text-sm font-semibold tracking-tight"
        >
          Start From JD
        </Link>
        {STEPS.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isPast = currentIndex >= 0 && idx < currentIndex;
          return (
            <Link
              key={step.href}
              href={step.href}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isPast
                    ? "text-foreground hover:bg-accent"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {step.label}
            </Link>
          );
        })}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ProviderBadge />
          <Link
            href="/settings"
            title="设置 / 自带 API key"
            className={cn(
              "shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              pathname.startsWith("/settings") &&
                "bg-accent text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

// 显示规则：
//   - 用户自带 key（BYOK）：显示 "BYOK · OpenRouter · model"（最优先）
//   - 否则若 server 自动判别为 openrouter：显示原 server-side openrouter 角标
//   - 否则：完全静默（api / cli 模式）
function ProviderBadge() {
  const userKey = useAppStore((s) => s.userKey);
  const [meta, setMeta] = useState<ProviderMeta | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/meta")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!cancelled && d) setMeta(d);
        })
        .catch(() => {
          // 静默：拉不到 meta 不影响主流程
        });
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // BYOK 优先：用户存了自带 key，无视 server-side provider
  if (userKey) {
    const model = meta?.configuredModel ?? "openai/gpt-oss-120b:free";
    return (
      <div
        className="shrink-0 rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-1.5 text-xs leading-tight text-blue-700 dark:text-blue-300"
        title="你已自带 OpenRouter API key（BYOK）。key 仅存浏览器 localStorage，通过 x-llm-key header 透传给服务端，用完即弃。"
      >
        <div className="flex items-center">
          <span className="font-medium">BYOK</span>
          <span className="mx-1.5 opacity-50">·</span>
          <span>OpenRouter</span>
          <span className="mx-1.5 opacity-50">·</span>
          <span className="font-mono">{model}</span>
        </div>
        <div className="mt-0.5 opacity-80">
          消耗你自己的 OpenRouter 额度，免费档输出请人工核对
        </div>
      </div>
    );
  }

  if (!meta || meta.provider !== "openrouter") return null;

  const model = meta.lastModel ?? meta.configuredModel ?? "openrouter";
  const rl = meta.rateLimit?.remaining;

  return (
    <div
      className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs leading-tight text-amber-700 dark:text-amber-300"
      title="当前使用服务端配置的 OpenRouter key。如要使用自己的额度，请去 /settings 配置。"
    >
      <div className="flex items-center">
        <span className="font-medium">OpenRouter (server)</span>
        <span className="mx-1.5 opacity-50">·</span>
        <span className="font-mono">{model}</span>
        {typeof rl === "number" && (
          <>
            <span className="mx-1.5 opacity-50">·</span>
            <span>{rl} req 剩余</span>
          </>
        )}
      </div>
      <div className="mt-0.5 opacity-80">
        免费档输出可能含捏造数字 / 未掌握技能，请人工核对
      </div>
    </div>
  );
}
