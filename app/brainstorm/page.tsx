"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileText,
  Loader2,
  Mic,
  MicOff,
  Upload,
} from "lucide-react";

import { StepNav } from "@/components/step-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/lib/hooks/use-speech-recognition";
import { langName, useT } from "@/lib/i18n";
import {
  experienceDocxFilename,
  experienceToDocxBlob,
} from "@/lib/resume-docx";
import { useAppStore } from "@/lib/store";
import { apiHeaders, cn } from "@/lib/utils";
import type { ExperienceDocument } from "@/types/resume";

type Tab = "voice" | "file" | "text";

const ACCEPT_EXT = [".txt", ".md", ".markdown"];
const MAX_FILE_BYTES = 200_000;

export default function BrainstormPage() {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const rawInput = useAppStore((s) => s.rawInput);
  const setRawInput = useAppStore((s) => s.setRawInput);
  const experience = useAppStore((s) => s.experience);
  const setExperience = useAppStore((s) => s.setExperience);
  const userKey = useAppStore((s) => s.userKey);

  const tabs: { id: Tab; label: string; icon: typeof Mic }[] = [
    { id: "voice", label: t.brainstorm.tabs.voice, icon: Mic },
    { id: "file", label: t.brainstorm.tabs.file, icon: Upload },
    { id: "text", label: t.brainstorm.tabs.text, icon: FileText },
  ];

  const [tab, setTab] = useState<Tab>("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const appendToRaw = useCallback(
    (chunk: string) => {
      const trimmed = chunk.trim();
      if (!trimmed) return;
      const sep = rawInput && !rawInput.endsWith("\n") ? "\n" : "";
      setRawInput(rawInput + sep + trimmed);
    },
    [rawInput, setRawInput]
  );

  const speech = useSpeechRecognition(lang, appendToRaw);

  const submit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/experience", {
        method: "POST",
        headers: apiHeaders(userKey),
        body: JSON.stringify({ rawText: rawInput, lang }),
      });
      const data = (await res.json()) as
        | ExperienceDocument
        | { error: string };
      if (!res.ok) {
        throw new Error("error" in data ? data.error : `HTTP ${res.status}`);
      }
      setExperience(data as ExperienceDocument);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [rawInput, lang, setExperience, userKey]);

  const onFileChosen = useCallback(
    async (file: File) => {
      setFileError(null);
      const lowerName = file.name.toLowerCase();
      if (!ACCEPT_EXT.some((ext) => lowerName.endsWith(ext))) {
        setFileError(t.brainstorm.fileBadExt(ACCEPT_EXT.join(" / ")));
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setFileError(
          t.brainstorm.fileTooLarge(Math.round(MAX_FILE_BYTES / 1000))
        );
        return;
      }
      try {
        const text = await file.text();
        appendToRaw(text);
      } catch (err) {
        setFileError(err instanceof Error ? err.message : String(err));
      }
    },
    [appendToRaw, t]
  );

  return (
    <>
      <StepNav />
      <main className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              {t.common.backHome}
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.brainstorm.title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t.brainstorm.subtitle}
            </p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tb) => {
                  const Icon = tb.icon;
                  const active = tab === tb.id;
                  return (
                    <button
                      key={tb.id}
                      type="button"
                      onClick={() => setTab(tb.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tb.label}
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tab === "voice" && (
                <VoicePanel speech={speech} listenLangName={langName(lang, lang)} />
              )}
              {tab === "file" && (
                <FilePanel
                  onFileChosen={onFileChosen}
                  fileError={fileError}
                  dragOver={dragOver}
                  setDragOver={setDragOver}
                />
              )}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t.brainstorm.rawLabel}</span>
                  <span>{t.common.chars(rawInput.length)}</span>
                </div>
                <Textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder={t.brainstorm.rawPlaceholder}
                  className="min-h-[280px] font-mono text-sm leading-relaxed"
                />
                {rawInput.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRawInput("")}
                    className="mt-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    {t.common.clear}
                  </button>
                )}
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
              disabled={loading || rawInput.trim().length < 20}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.brainstorm.submitLoading}
                </>
              ) : experience ? (
                t.brainstorm.submitDone
              ) : (
                t.brainstorm.submit
              )}
            </Button>
            <Button
              asChild
              disabled={!experience}
              className={cn(!experience && "pointer-events-none opacity-50")}
            >
              <Link href="/fit-check" className="gap-1">
                {t.brainstorm.nextBtn}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {experience && <ExperiencePreview doc={experience} />}
        </div>
      </main>
    </>
  );
}

function VoicePanel({
  speech,
  listenLangName,
}: {
  speech: ReturnType<typeof useSpeechRecognition>;
  listenLangName: string;
}) {
  const t = useT();
  if (!speech.supported) {
    return (
      <div className="rounded-md border border-dashed border-input bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        {t.brainstorm.voiceUnsupported}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-muted/30 p-6">
      <button
        type="button"
        onClick={speech.listening ? speech.stop : speech.start}
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full transition-all",
          speech.listening
            ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30 ring-4 ring-destructive/20"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        aria-label={
          speech.listening
            ? t.brainstorm.voiceStopAria
            : t.brainstorm.voiceStartAria
        }
      >
        {speech.listening ? (
          <MicOff className="h-8 w-8" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </button>
      <div className="text-sm text-muted-foreground">
        {speech.listening
          ? t.brainstorm.voiceListening(listenLangName)
          : t.brainstorm.voiceIdle}
      </div>
      {speech.interim && (
        <div className="w-full rounded border border-input bg-background px-3 py-2 text-sm italic text-muted-foreground">
          ... {speech.interim}
        </div>
      )}
      {speech.error && (
        <div className="text-sm text-destructive">{speech.error}</div>
      )}
    </div>
  );
}

function FilePanel({
  onFileChosen,
  fileError,
  dragOver,
  setDragOver,
}: {
  onFileChosen: (file: File) => void;
  fileError: string | null;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileChosen(file);
  };
  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-6 text-center text-sm transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-input bg-muted/30 hover:bg-muted/50"
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <div>
          {t.brainstorm.fileDrop}
          <span className="ml-1 text-xs text-muted-foreground">
            （{t.brainstorm.fileHint}）
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_EXT.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileChosen(file);
            e.target.value = "";
          }}
        />
      </div>
      {fileError && (
        <div className="text-sm text-destructive">{fileError}</div>
      )}
    </div>
  );
}

function ExperiencePreview({ doc }: { doc: ExperienceDocument }) {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const [docxBusy, setDocxBusy] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);
  const downloadDocx = useCallback(async () => {
    setDocxBusy(true);
    setDocxError(null);
    try {
      const blob = await experienceToDocxBlob(doc, lang);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = experienceDocxFilename();
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDocxError(err instanceof Error ? err.message : String(err));
    } finally {
      setDocxBusy(false);
    }
  }, [doc, lang]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t.brainstorm.previewTitle}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadDocx}
            disabled={docxBusy}
            title={t.brainstorm.docxTooltip}
          >
            {docxBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t.brainstorm.downloadDocx}
          </Button>
        </div>
        {docxError && (
          <div className="mt-1 text-xs text-destructive">
            {t.brainstorm.docxError(docxError)}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <section>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.brainstorm.section.summary}
          </div>
          <p className="leading-relaxed">{doc.summary}</p>
        </section>
        <section className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.brainstorm.section.items(doc.items.length)}
          </div>
          {doc.items.map((it) => (
            <div
              key={it.id}
              className="rounded-md border border-input bg-card p-3"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {it.type}
                </Badge>
                <span className="font-medium">{it.title}</span>
                <span className="text-muted-foreground">— {it.org}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {it.startDate} – {it.endDate}
                </span>
              </div>
              {it.bullets.length > 0 && (
                <ul className="ml-5 mt-2 list-disc space-y-1 text-muted-foreground">
                  {it.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
              {it.rawNotes && (
                <div className="mt-2 text-xs italic text-muted-foreground">
                  {t.brainstorm.section.rawNotes}：{it.rawNotes}
                </div>
              )}
            </div>
          ))}
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          <SkillList
            title={t.brainstorm.section.hardSkills}
            items={doc.skills.hard}
          />
          <SkillList
            title={t.brainstorm.section.softSkills}
            items={doc.skills.soft}
          />
        </section>
        {doc.languages.length > 0 && (
          <section>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.brainstorm.section.languages}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {doc.languages.map((l, i) => (
                <Badge key={i} variant="outline">
                  {l}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}

function SkillList({ title, items }: { title: string; items: string[] }) {
  const t = useT();
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-xs italic text-muted-foreground">
          {t.brainstorm.section.empty}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((s, i) => (
            <Badge key={i} variant="outline">
              {s}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
