"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Printer,
} from "lucide-react";

import { ResumePreview } from "@/components/resume-preview";
import { StepNav } from "@/components/step-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { resumeDocxFilename, resumeToDocxBlob } from "@/lib/resume-docx";
import { useAppStore } from "@/lib/store";
import { apiHeaders, isPlaceholder } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";

export default function PolishPage() {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const resume = useAppStore((s) => s.resume);
  const setResume = useAppStore((s) => s.setResume);
  const jd = useAppStore((s) => s.jd);
  const userKey = useAppStore((s) => s.userKey);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polished, setPolished] = useState(false);

  const submit = useCallback(async () => {
    if (!resume) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/polish", {
        method: "POST",
        headers: apiHeaders(userKey),
        body: JSON.stringify({ resume, jd, lang }),
      });
      const data = (await res.json()) as ResumeData | { error: string };
      if (!res.ok) {
        throw new Error("error" in data ? data.error : `HTTP ${res.status}`);
      }
      setResume(data as ResumeData);
      setPolished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [resume, jd, lang, setResume, userKey]);

  const downloadTxt = useCallback(() => {
    if (!resume) return;
    const txt = resumeToText(resume);
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isPlaceholder(resume.basics.name)
      ? "resume.txt"
      : `${resume.basics.name}-resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [resume]);

  const [docxBusy, setDocxBusy] = useState(false);
  const downloadDocx = useCallback(async () => {
    if (!resume) return;
    setDocxBusy(true);
    try {
      const blob = await resumeToDocxBlob(resume, lang);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = resumeDocxFilename(resume);
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        t.polish.docxError(err instanceof Error ? err.message : String(err))
      );
    } finally {
      setDocxBusy(false);
    }
  }, [resume, t, lang]);

  return (
    <>
      <StepNav />
      <main className="container py-8">
        <div className="mb-6 flex items-center justify-between gap-3 no-print">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/critique" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              {t.common.prevStep}
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-4xl space-y-6 no-print">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.polish.title}
            </h1>
            <p className="mt-2 text-muted-foreground">{t.polish.subtitle}</p>
          </div>

          {!resume && <NoResumeWarning />}

          {error && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="pt-6 text-sm text-destructive">
                {t.common.error(error)}
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={submit}
              disabled={loading || !resume}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.polish.submitLoading}
                </>
              ) : polished ? (
                t.polish.submitDone
              ) : (
                t.polish.submit
              )}
            </Button>
            {resume && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t.polish.printHint}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                  {t.polish.printBtn}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadTxt}>
                  <FileText className="h-4 w-4" />
                  {t.polish.txtBtn}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadDocx}
                  disabled={docxBusy}
                >
                  {docxBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {t.polish.docxBtn}
                </Button>
              </div>
            )}
          </div>

          {resume?.missing && resume.missing.length > 0 && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {t.polish.missingTitle(resume.missing.length)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {t.polish.missingDesc}
                <ul className="ml-5 mt-2 list-disc space-y-1">
                  {resume.missing.map((m, i) => (
                    <li key={i}>{m.replace(/^MISSING(?=[:：\s])/, "TBD")}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
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

function NoResumeWarning() {
  const t = useT();
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="flex items-start gap-3 pt-6 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          {t.polish.noResume}{" "}
          <Link href="/draft" className="font-medium underline">
            {t.polish.noResumeLink}
          </Link>
          .
        </div>
      </CardContent>
    </Card>
  );
}

function resumeToText(r: ResumeData): string {
  const lines: string[] = [];
  const push = (s = "") => lines.push(s);
  const rule = () => push("=".repeat(60));

  if (!isPlaceholder(r.basics.name)) push(r.basics.name);
  push(r.basics.title);
  const contact = [r.basics.email, r.basics.phone, r.basics.location]
    .filter((x): x is string => !!x && !isPlaceholder(x))
    .join(" · ");
  if (contact) push(contact);
  const validLinks = (r.basics.links ?? []).filter(
    (l) => !isPlaceholder(l.url)
  );
  if (validLinks.length) {
    push(validLinks.map((l) => `${l.label}: ${l.url}`).join(" · "));
  }
  rule();

  if (r.summary) {
    push("SUMMARY");
    push(r.summary);
    push();
  }

  if (r.experience.length) {
    push("EXPERIENCE");
    for (const e of r.experience) {
      push(
        `${e.role} · ${e.company}    ${e.startDate} – ${e.endDate}${
          e.location ? " · " + e.location : ""
        }`
      );
      for (const b of e.bullets) push(`  • ${b}`);
      push();
    }
  }

  if (r.projects?.length) {
    push("PROJECTS");
    for (const p of r.projects) {
      push(`${p.name}${p.role ? " · " + p.role : ""}`);
      for (const b of p.bullets) push(`  • ${b}`);
      push();
    }
  }

  if (r.education.length) {
    push("EDUCATION");
    for (const e of r.education) {
      push(
        `${e.degree} · ${e.school}    ${e.startDate} – ${e.endDate}${
          e.notes ? " (" + e.notes + ")" : ""
        }`
      );
    }
    push();
  }

  if (r.skills.hard.length || r.skills.soft.length) {
    push("SKILLS");
    if (r.skills.hard.length)
      push(`Technical: ${r.skills.hard.join(" · ")}`);
    if (r.skills.soft.length) push(`Soft: ${r.skills.soft.join(" · ")}`);
    push();
  }

  if (r.missing?.length) {
    rule();
    push("TBD (do not fabricate; gather before submitting):");
    for (const m of r.missing) push(`  - ${m}`);
  }

  return lines.join("\n");
}
