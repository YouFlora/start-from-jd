"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";

import { StepNav } from "@/components/step-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { apiHeaders, cn } from "@/lib/utils";
import type { FitCheckResult, FitVerdict } from "@/types/resume";

const VERDICT_TONE: Record<FitVerdict, { tone: string; ring: string }> = {
  go: { tone: "bg-emerald-500 text-white", ring: "ring-emerald-500/30" },
  stretch: { tone: "bg-amber-500 text-white", ring: "ring-amber-500/30" },
  pivot: { tone: "bg-rose-500 text-white", ring: "ring-rose-500/30" },
};

export default function FitCheckPage() {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const experience = useAppStore((s) => s.experience);
  const jd = useAppStore((s) => s.jd);
  const setJd = useAppStore((s) => s.setJd);
  const fit = useAppStore((s) => s.fit);
  const setFit = useAppStore((s) => s.setFit);
  const userKey = useAppStore((s) => s.userKey);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (!experience) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fit-check", {
        method: "POST",
        headers: apiHeaders(userKey),
        body: JSON.stringify({ experience, jd, lang }),
      });
      const data = (await res.json()) as FitCheckResult | { error: string };
      if (!res.ok) {
        throw new Error("error" in data ? data.error : `HTTP ${res.status}`);
      }
      setFit(data as FitCheckResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [experience, jd, lang, setFit, userKey]);

  const canSubmit = !!experience && (jd?.trim().length ?? 0) >= 20;

  return (
    <>
      <StepNav />
      <main className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/brainstorm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              {t.common.prevStep}
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.fitCheck.title}
            </h1>
            <p className="mt-2 text-muted-foreground">{t.fitCheck.subtitle}</p>
          </div>

          {!experience && <NoExperienceWarning />}

          <Card>
            <CardHeader>
              <CardTitle>{t.fitCheck.jdTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={jd ?? ""}
                onChange={(e) => setJd(e.target.value)}
                placeholder={t.fitCheck.jdPlaceholder}
                className="min-h-[240px] font-mono text-sm leading-relaxed"
              />
              <div className="text-xs text-muted-foreground">
                {t.common.chars(jd?.length ?? 0)} · {t.fitCheck.jdHint}
              </div>
            </CardContent>
          </Card>

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
              disabled={loading || !canSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.fitCheck.submitLoading}
                </>
              ) : fit ? (
                t.fitCheck.submitDone
              ) : (
                t.fitCheck.submit
              )}
            </Button>
            <Button
              asChild
              disabled={!fit}
              className={cn(!fit && "pointer-events-none opacity-50")}
            >
              <Link href="/draft" className="gap-1">
                {t.fitCheck.nextBtn}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {fit && <FitResult fit={fit} />}
        </div>
      </main>
    </>
  );
}

function NoExperienceWarning() {
  const t = useT();
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="flex items-start gap-3 pt-6 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          {t.fitCheck.noExperience}{" "}
          <Link href="/brainstorm" className="font-medium underline">
            {t.fitCheck.noExperienceLink}
          </Link>
          .
        </div>
      </CardContent>
    </Card>
  );
}

function FitResult({ fit }: { fit: FitCheckResult }) {
  const t = useT();
  const verdict = t.fitCheck.verdict[fit.verdict];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.fitCheck.reportTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ScoreHeader score={fit.score} verdict={fit.verdict} />
        <div className="text-sm text-muted-foreground">{verdict.desc}</div>

        <section>
          <SectionLabel>{t.fitCheck.matrixHeading}</SectionLabel>
          <div className="overflow-hidden rounded-md border border-input">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    {t.fitCheck.matrixHead.dim}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t.fitCheck.matrixHead.cand}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t.fitCheck.matrixHead.jd}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t.fitCheck.matrixHead.match}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-input">
                {fit.matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium">{row.dimension}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.candidate}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{row.jd}</td>
                    <td className="px-3 py-2">
                      <MatchPill match={row.match} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <BulletList
            label={t.fitCheck.why}
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
            items={fit.whyMatch}
            empty={t.fitCheck.whyEmpty}
          />
          <BulletList
            label={t.fitCheck.gaps}
            icon={<XCircle className="h-3.5 w-3.5 text-rose-600" />}
            items={fit.gaps}
            empty={t.fitCheck.gapsEmpty}
          />
        </div>

        {fit.verdict === "pivot" &&
          fit.alternativeRoles &&
          fit.alternativeRoles.length > 0 && (
            <section>
              <SectionLabel>{t.fitCheck.altRoles}</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {fit.alternativeRoles.map((r, i) => (
                  <Badge key={i} variant="secondary">
                    {r}
                  </Badge>
                ))}
              </div>
            </section>
          )}
      </CardContent>
    </Card>
  );
}

function ScoreHeader({
  score,
  verdict,
}: {
  score: number;
  verdict: FitVerdict;
}) {
  const t = useT();
  const tone = VERDICT_TONE[verdict];
  const label = t.fitCheck.verdict[verdict].label;
  return (
    <div className="flex items-center gap-5">
      <div
        className={cn(
          "flex h-24 w-24 shrink-0 items-center justify-center rounded-full ring-8",
          tone.tone,
          tone.ring
        )}
      >
        <div className="text-3xl font-bold leading-none tabular-nums">
          {score}
        </div>
      </div>
      <div className="space-y-1">
        <Badge className={cn(tone.tone, "text-sm")}>{label}</Badge>
        <div className="text-xs text-muted-foreground">
          {t.fitCheck.scoreHint}
        </div>
      </div>
    </div>
  );
}

function MatchPill({ match }: { match: "match" | "partial" | "miss" }) {
  const t = useT();
  const map = {
    match: {
      label: t.fitCheck.pill.match,
      cls: "bg-emerald-500/15 text-emerald-700",
    },
    partial: {
      label: t.fitCheck.pill.partial,
      cls: "bg-amber-500/15 text-amber-700",
    },
    miss: { label: t.fitCheck.pill.miss, cls: "bg-rose-500/15 text-rose-700" },
  };
  const m = map[match];
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        m.cls
      )}
    >
      {m.label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function BulletList({
  label,
  icon,
  items,
  empty,
}: {
  label: string;
  icon: React.ReactNode;
  items: string[];
  empty: string;
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      {items.length === 0 ? (
        <div className="text-xs italic text-muted-foreground">{empty}</div>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {items.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 shrink-0">{icon}</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
