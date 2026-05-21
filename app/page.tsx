"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Lang } from "@/types/resume";

export default function HomePage() {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);

  return (
    <main className="container relative flex min-h-screen flex-col items-center justify-center py-16">
      <div className="absolute right-4 top-4">
        <LangToggle lang={lang} onChange={setLang} />
      </div>
      <div className="max-w-2xl space-y-8 text-center">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {t.home.eyebrow}
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            {t.home.title}
          </h1>
          <p className="text-xl text-muted-foreground">{t.home.tagline}</p>
        </div>

        <div className="grid gap-3 text-left text-sm text-muted-foreground sm:grid-cols-2">
          <Step n="1" title={t.home.steps.brainstorm.title}>
            {t.home.steps.brainstorm.desc}
          </Step>
          <Step n="2" title={t.home.steps.fitCheck.title}>
            {t.home.steps.fitCheck.desc}
          </Step>
          <Step n="3" title={t.home.steps.draft.title}>
            {t.home.steps.draft.desc}
          </Step>
          <Step n="4" title={t.home.steps.critique.title}>
            {t.home.steps.critique.desc}
          </Step>
          <Step n="5" title={t.home.steps.polish.title}>
            {t.home.steps.polish.desc}
          </Step>
          <Step n="—" title={t.home.steps.constraint.title}>
            {t.home.steps.constraint.desc}
          </Step>
        </div>

        <Button asChild size="lg" className="gap-2">
          <Link href="/brainstorm">
            {t.home.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </main>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {n}
        </span>
        <span className="font-medium text-foreground">{title}</span>
      </div>
      <p className="pl-8">{children}</p>
    </div>
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
