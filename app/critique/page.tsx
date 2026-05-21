"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Quote,
} from "lucide-react";

import { StepNav } from "@/components/step-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { apiHeaders, cn } from "@/lib/utils";
import type { Critique, CritiqueReport, Severity } from "@/types/resume";

const SEVERITY_RANK: Record<Severity, number> = {
  fatal: 0,
  major: 1,
  minor: 2,
};

const SEVERITY_VARIANT: Record<Severity, "fatal" | "major" | "minor"> = {
  fatal: "fatal",
  major: "major",
  minor: "minor",
};

export default function CritiquePage() {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const resume = useAppStore((s) => s.resume);
  const jd = useAppStore((s) => s.jd);
  const critique = useAppStore((s) => s.critique);
  const setCritique = useAppStore((s) => s.setCritique);
  const userKey = useAppStore((s) => s.userKey);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (!resume) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/critique", {
        method: "POST",
        headers: apiHeaders(userKey),
        body: JSON.stringify({ resume, jd, lang }),
      });
      const data = (await res.json()) as CritiqueReport | { error: string };
      if (!res.ok) {
        throw new Error("error" in data ? data.error : `HTTP ${res.status}`);
      }
      setCritique(data as CritiqueReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [resume, jd, lang, setCritique, userKey]);

  return (
    <>
      <StepNav />
      <main className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/draft" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              {t.common.prevStep}
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.critique.title}
            </h1>
            <p className="mt-2 text-muted-foreground">{t.critique.subtitle}</p>
          </div>

          {!resume && <NoResumeWarning />}

          {error && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="pt-6 text-sm text-destructive">
                {t.common.error(error)}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={submit}
              disabled={loading || !resume}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.critique.submitLoading}
                </>
              ) : critique ? (
                t.critique.submitDone
              ) : (
                t.critique.submit
              )}
            </Button>
            <Button
              asChild
              disabled={!critique}
              className={cn(!critique && "pointer-events-none opacity-50")}
            >
              <Link href="/polish" className="gap-1">
                {t.critique.nextBtn}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {critique && <CritiqueReportView report={critique} />}
        </div>
      </main>
    </>
  );
}

function NoResumeWarning() {
  const t = useT();
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="flex items-start gap-3 pt-6 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          {t.critique.noResume}{" "}
          <Link href="/draft" className="font-medium underline">
            {t.critique.noResumeLink}
          </Link>
          .
        </div>
      </CardContent>
    </Card>
  );
}

function CritiqueReportView({ report }: { report: CritiqueReport }) {
  const t = useT();
  const sorted = [...report.critiques].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  );
  const counts = countBy(report.critiques);
  return (
    <div className="space-y-4">
      <Card className="border-foreground/20 bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.critique.overall}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm leading-relaxed">{report.overallVerdict}</p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(["fatal", "major", "minor"] as const).map((s) =>
              counts[s] > 0 ? (
                <Badge key={s} variant={SEVERITY_VARIANT[s]}>
                  {t.critique.severity[s]} × {counts[s]}
                </Badge>
              ) : null
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {sorted.map((c) => (
          <CritiqueCard key={c.id} critique={c} />
        ))}
      </div>
    </div>
  );
}

function CritiqueCard({ critique }: { critique: Critique }) {
  const t = useT();
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={SEVERITY_VARIANT[critique.severity]}>
            {t.critique.severity[critique.severity]}
          </Badge>
          <span className="text-xs text-muted-foreground">{critique.id}</span>
          <CardTitle className="basis-full text-base">
            {critique.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <Label>{t.critique.issue}</Label>
          <p className="mt-1 leading-relaxed">{critique.detail}</p>
        </div>
        <div>
          <Label>{t.critique.fix}</Label>
          <p className="mt-1 leading-relaxed">{critique.suggestion}</p>
        </div>
        {critique.anchor && (
          <div className="rounded-md border-l-2 border-muted-foreground/40 bg-muted/40 px-3 py-2">
            <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Quote className="h-3 w-3" />
              {t.critique.anchor}
            </div>
            <code className="text-xs leading-relaxed">{critique.anchor}</code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function countBy(critiques: Critique[]): Record<Severity, number> {
  const c: Record<Severity, number> = { fatal: 0, major: 0, minor: 0 };
  for (const it of critiques) c[it.severity]++;
  return c;
}
