"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
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
import { useAppStore } from "@/lib/store";
import { apiHeaders, cn } from "@/lib/utils";
import type { ExperienceDocument, Lang } from "@/types/resume";

type Tab = "voice" | "file" | "text";

const TABS: { id: Tab; label: string; icon: typeof Mic }[] = [
  { id: "voice", label: "录音", icon: Mic },
  { id: "file", label: "上传文件", icon: Upload },
  { id: "text", label: "直接输入", icon: FileText },
];

const ACCEPT_EXT = [".txt", ".md", ".markdown"];
const MAX_FILE_BYTES = 200_000;

export default function BrainstormPage() {
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const rawInput = useAppStore((s) => s.rawInput);
  const setRawInput = useAppStore((s) => s.setRawInput);
  const experience = useAppStore((s) => s.experience);
  const setExperience = useAppStore((s) => s.setExperience);
  const userKey = useAppStore((s) => s.userKey);

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
  }, [rawInput, lang, setExperience]);

  const onFileChosen = useCallback(
    async (file: File) => {
      setFileError(null);
      const lowerName = file.name.toLowerCase();
      if (!ACCEPT_EXT.some((ext) => lowerName.endsWith(ext))) {
        setFileError(`仅支持 ${ACCEPT_EXT.join(" / ")} 文件`);
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`文件超过 ${Math.round(MAX_FILE_BYTES / 1000)}KB 上限`);
        return;
      }
      try {
        const text = await file.text();
        appendToRaw(text);
      } catch (err) {
        setFileError(err instanceof Error ? err.message : String(err));
      }
    },
    [appendToRaw]
  );

  return (
    <>
      <StepNav />
      <main className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
          </Button>
          <LangToggle lang={lang} onChange={setLang} />
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">头脑风暴</h1>
            <p className="mt-2 text-muted-foreground">
              说话、上传文件或直接输入——把你做过的事原原本本倒出来。
              AI 只整理、不替你编造。三种方式可混用。
            </p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap gap-2">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tab === "voice" && (
                <VoicePanel
                  speech={speech}
                  lang={lang}
                />
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
                  <span>累计原始素材（可继续编辑 / 增补）</span>
                  <span>{rawInput.length} 字</span>
                </div>
                <Textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="在这里直接输入，或切换到上方录音 / 文件 tab 自动追加"
                  className="min-h-[280px] font-mono text-sm leading-relaxed"
                />
                {rawInput.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRawInput("")}
                    className="mt-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    清空
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

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
              disabled={loading || rawInput.trim().length < 20}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中（约 30-90s）...
                </>
              ) : experience ? (
                "重新生成"
              ) : (
                "生成结构化经历"
              )}
            </Button>
            <Button
              asChild
              disabled={!experience}
              className={cn(!experience && "pointer-events-none opacity-50")}
            >
              <Link href="/fit-check" className="gap-1">
                下一步：匹配度检查
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

function LangToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-input bg-background p-0.5">
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

function VoicePanel({
  speech,
  lang,
}: {
  speech: ReturnType<typeof useSpeechRecognition>;
  lang: Lang;
}) {
  if (!speech.supported) {
    return (
      <div className="rounded-md border border-dashed border-input bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        当前浏览器不支持 Web Speech API。建议改用 Chrome / Edge / Safari，
        或先在「上传文件」「直接输入」 tab 录入素材。
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
        aria-label={speech.listening ? "停止录音" : "开始录音"}
      >
        {speech.listening ? (
          <MicOff className="h-8 w-8" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </button>
      <div className="text-sm text-muted-foreground">
        {speech.listening
          ? `正在收音（${lang === "zh" ? "中文" : "English"}）— 边说边追加到下方文本框`
          : "点击开始录音；说完点击同一按钮停止"}
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
          拖拽文件到这里，或点击选择
          <span className="ml-1 text-xs text-muted-foreground">
            （{ACCEPT_EXT.join(" / ")}，≤ 200KB）
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>结构化经历预览</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <section>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Summary
          </div>
          <p className="leading-relaxed">{doc.summary}</p>
        </section>
        <section className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Items（{doc.items.length}）
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
                  备注：{it.rawNotes}
                </div>
              )}
            </div>
          ))}
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          <SkillList title="Hard Skills" items={doc.skills.hard} />
          <SkillList title="Soft Skills" items={doc.skills.soft} />
        </section>
        {doc.languages.length > 0 && (
          <section>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Languages
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
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-xs italic text-muted-foreground">（无）</div>
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
