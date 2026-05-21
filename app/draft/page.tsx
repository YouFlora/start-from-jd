"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { ResumePreview } from "@/components/resume-preview";
import { StepNav } from "@/components/step-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { apiHeaders, cn } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";

export default function DraftPage() {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const experience = useAppStore((s) => s.experience);
  const jd = useAppStore((s) => s.jd);
  const resume = useAppStore((s) => s.resume);
  const setResume = useAppStore((s) => s.setResume);
  const userKey = useAppStore((s) => s.userKey);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (!experience || !jd) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: apiHeaders(userKey),
        body: JSON.stringify({ experience, jd, lang }),
      });
      const data = (await res.json()) as ResumeData | { error: string };
      if (!res.ok) {
        throw new Error("error" in data ? data.error : `HTTP ${res.status}`);
      }
      setResume(data as ResumeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [experience, jd, lang, setResume, userKey]);

  const canSubmit = !!experience && !!jd && jd.trim().length >= 20;

  const missingPrereqs: string[] = [];
  if (!experience) missingPrereqs.push(t.draft.prereqExperience);
  if (!jd) missingPrereqs.push(t.draft.prereqJd);

  return (
    <>
      <StepNav />
      <main className="container py-8">
        <div className="mb-6 flex items-center justify-between no-print">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/fit-check" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              {t.common.prevStep}
            </Link>
          </Button>
          {resume && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {t.draft.printHint}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                {t.draft.printBtn}
              </Button>
            </div>
          )}
        </div>

        <div className="mx-auto max-w-4xl space-y-6 no-print">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.draft.title}
            </h1>
            <p className="mt-2 text-muted-foreground">{t.draft.subtitle}</p>
          </div>

          {missingPrereqs.length > 0 && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="flex items-start gap-3 pt-6 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>{t.draft.missingPrereqs(missingPrereqs.join(" / "))}</div>
              </CardContent>
            </Card>
          )}

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
                  {t.draft.submitLoading}
                </>
              ) : resume ? (
                t.draft.submitDone
              ) : (
                t.draft.submit
              )}
            </Button>
            <Button
              asChild
              disabled={!resume}
              className={cn(!resume && "pointer-events-none opacity-50")}
            >
              <Link href="/critique" className="gap-1">
                {t.draft.nextBtn}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {resume?.missing && resume.missing.length > 0 && (
            <MissingPanel items={resume.missing} />
          )}
        </div>

        {resume && (
          <div className="mt-8 overflow-x-auto py-2">
            <ResumePreview data={resume} />
          </div>
        )}
      </main>
    </>
  );
}

function MissingPanel({ items }: { items: string[] }) {
  const t = useT();
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {t.draft.missingTitle(items.length)}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {t.draft.missingDesc}
        <ul className="ml-5 mt-2 list-disc space-y-1">
          {items.map((m, i) => (
            <li key={i}>{m.replace(/^MISSING(?=[:：\s])/, "TBD")}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
