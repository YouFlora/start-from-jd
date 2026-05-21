"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";

import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Lang } from "@/types/resume";

interface ProviderMeta {
  provider: "cli" | "openrouter" | "none";
  configuredModel?: string;
  lastModel?: string;
  rateLimit?: { remaining?: number };
}

export function StepNav() {
  const pathname = usePathname();
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);

  const steps = [
    { href: "/brainstorm", label: t.nav.brainstorm },
    { href: "/fit-check", label: t.nav.fitCheck },
    { href: "/draft", label: t.nav.draft },
    { href: "/critique", label: t.nav.critique },
    { href: "/polish", label: t.nav.polish },
  ];
  const currentIndex = steps.findIndex((s) => pathname.startsWith(s.href));

  return (
    <nav className="border-b bg-background no-print">
      <div className="container flex h-14 items-center gap-1 overflow-x-auto">
        <Link
          href="/"
          className="mr-4 shrink-0 text-sm font-semibold tracking-tight"
        >
          {t.nav.home}
        </Link>
        {steps.map((step, idx) => {
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
          <LangToggle lang={lang} onChange={setLang} />
          <Link
            href="/settings"
            title={t.nav.settingsTitle}
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

function LangToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div className="inline-flex shrink-0 rounded-md border border-input bg-background p-0.5">
      {(["zh", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            lang === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l === "zh" ? "中文" : "EN"}
        </button>
      ))}
    </div>
  );
}

// 显示规则：
//   - 用户自带 key（BYOK）：显示 "BYOK · OpenRouter · model"（最优先）
//   - 否则若 server 自动判别为 openrouter：显示原 server-side openrouter 角标
//   - 否则：完全静默（api / cli 模式）
function ProviderBadge() {
  const t = useT();
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
    const timer = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (userKey) {
    const model = meta?.configuredModel ?? "openai/gpt-oss-120b:free";
    return (
      <div
        className="shrink-0 rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-1.5 text-xs leading-tight text-blue-700 dark:text-blue-300"
        title={t.providerBadge.byokTooltip}
      >
        <div className="flex items-center">
          <span className="font-medium">BYOK</span>
          <span className="mx-1.5 opacity-50">·</span>
          <span>OpenRouter</span>
          <span className="mx-1.5 opacity-50">·</span>
          <span className="font-mono">{model}</span>
        </div>
        <div className="mt-0.5 opacity-80">{t.providerBadge.byokHint}</div>
      </div>
    );
  }

  if (!meta || meta.provider !== "openrouter") return null;

  const model = meta.lastModel ?? meta.configuredModel ?? "openrouter";
  const rl = meta.rateLimit?.remaining;

  return (
    <div
      className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs leading-tight text-amber-700 dark:text-amber-300"
      title={t.providerBadge.serverTooltip}
    >
      <div className="flex items-center">
        <span className="font-medium">OpenRouter (server)</span>
        <span className="mx-1.5 opacity-50">·</span>
        <span className="font-mono">{model}</span>
        {typeof rl === "number" && (
          <>
            <span className="mx-1.5 opacity-50">·</span>
            <span>{t.providerBadge.reqLeft(rl)}</span>
          </>
        )}
      </div>
      <div className="mt-0.5 opacity-80">{t.providerBadge.serverHint}</div>
    </div>
  );
}
