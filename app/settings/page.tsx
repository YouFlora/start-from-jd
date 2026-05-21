"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { StepNav } from "@/components/step-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

export default function SettingsPage() {
  const t = useT();
  const savedKey = useAppStore((s) => s.userKey);
  const setUserKey = useAppStore((s) => s.setUserKey);
  const clearUserKey = useAppStore((s) => s.clearUserKey);

  const [input, setInput] = useState("");
  const [reveal, setReveal] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (savedKey) setInput(savedKey);
  }, [savedKey]);

  const save = () => {
    const k = input.trim();
    if (!k) return;
    setUserKey(k);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const clear = () => {
    if (!confirm(t.settings.keyClearConfirm)) return;
    clearUserKey();
    setInput("");
  };

  const masked =
    savedKey && savedKey.length > 14
      ? `${savedKey.slice(0, 8)}…${savedKey.slice(-4)}`
      : savedKey;

  return (
    <>
      <StepNav />
      <main className="container py-8">
        <div className="mb-6 flex items-center gap-3 no-print">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              {t.common.backHome}
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.settings.title}
            </h1>
            <p className="mt-2 text-muted-foreground">{t.settings.subtitle}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4" />
                {t.settings.keyTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {savedKey && (
                <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{t.settings.keyCurrent}</span>
                  <span className="font-mono text-xs">{masked}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t.settings.keyLabel}
                </label>
                <div className="flex gap-2">
                  <input
                    type={reveal ? "text" : "password"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t.settings.keyPlaceholder}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReveal((v) => !v)}
                    type="button"
                    title={reveal ? t.settings.keyHide : t.settings.keyReveal}
                  >
                    {reveal ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={save} disabled={!input.trim()}>
                  {t.settings.keySave}
                </Button>
                {savedKey && (
                  <Button variant="outline" onClick={clear}>
                    <Trash2 className="h-4 w-4" />
                    {t.settings.keyClear}
                  </Button>
                )}
                {savedToast && (
                  <span className="self-center text-sm text-emerald-600">
                    {t.settings.keySaved}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                {t.settings.safetyTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="ml-5 list-disc space-y-1">
                {t.settings.safety.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TriangleAlert className="h-4 w-4" />
                {t.settings.howTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ol className="ml-5 list-decimal space-y-1">
                <li>
                  {t.settings.how.step1Prefix}
                  <a
                    href="https://openrouter.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 font-medium text-foreground underline underline-offset-2"
                  >
                    {t.settings.how.step1Link}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {t.settings.how.step1Suffix}
                </li>
                <li>{t.settings.how.step2}</li>
                <li>{t.settings.how.step3}</li>
                <li>{t.settings.how.step4}</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
