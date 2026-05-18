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
import { useAppStore } from "@/lib/store";
import { apiHeaders, cn } from "@/lib/utils";
import type { Critique, CritiqueReport, Severity } from "@/types/resume";

const SEVERITY_META: Record<
  Severity,
  { label: string; variant: "fatal" | "major" | "minor"; rank: number }
> = {
  fatal: { label: "Fatal · 致命", variant: "fatal", rank: 0 },
  major: { label: "Major · 重要", variant: "major", rank: 1 },
  minor: { label: "Minor · 微瑕", variant: "minor", rank: 2 },
};

export default function CritiquePage() {
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
  }, [resume, jd, lang, setCritique]);

  return (
    <>
      <StepNav />
      <main className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/draft" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              上一步
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">诊断</h1>
            <p className="mt-2 text-muted-foreground">
              给出 5 条直接、可执行的批评，附严重等级。
              不安慰、不套话——把会被 ATS 或招聘者刷掉的真实原因摆出来。
            </p>
          </div>

          {!resume && <NoResumeWarning />}

          {error && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="pt-6 text-sm text-destructive">
                生成失败：{error}
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
                  诊断中（约 30-60s）...
                </>
              ) : critique ? (
                "重新诊断"
              ) : (
                "开始诊断"
              )}
            </Button>
            <Button
              asChild
              disabled={!critique}
              className={cn(!critique && "pointer-events-none opacity-50")}
            >
              <Link href="/polish" className="gap-1">
                下一步：ATS 打磨
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
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="flex items-start gap-3 pt-6 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          还没有简历草稿。先回到{" "}
          <Link href="/draft" className="font-medium underline">
            简历草稿
          </Link>{" "}
          完成 Step 2，再回来诊断。
        </div>
      </CardContent>
    </Card>
  );
}

function CritiqueReportView({ report }: { report: CritiqueReport }) {
  const sorted = [...report.critiques].sort(
    (a, b) => SEVERITY_META[a.severity].rank - SEVERITY_META[b.severity].rank
  );
  const counts = countBy(report.critiques);
  return (
    <div className="space-y-4">
      <Card className="border-foreground/20 bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">总评</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm leading-relaxed">{report.overallVerdict}</p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(["fatal", "major", "minor"] as const).map((s) =>
              counts[s] > 0 ? (
                <Badge key={s} variant={SEVERITY_META[s].variant}>
                  {SEVERITY_META[s].label} × {counts[s]}
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
  const meta = SEVERITY_META[critique.severity];
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          <span className="text-xs text-muted-foreground">{critique.id}</span>
          <CardTitle className="basis-full text-base">
            {critique.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <Label>问题</Label>
          <p className="mt-1 leading-relaxed">{critique.detail}</p>
        </div>
        <div>
          <Label>可立即执行的改法</Label>
          <p className="mt-1 leading-relaxed">{critique.suggestion}</p>
        </div>
        {critique.anchor && (
          <div className="rounded-md border-l-2 border-muted-foreground/40 bg-muted/40 px-3 py-2">
            <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Quote className="h-3 w-3" />
              简历命中位置
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
