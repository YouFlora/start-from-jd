"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { ResumePreview } from "@/components/resume-preview";
import { StepNav } from "@/components/step-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { apiHeaders, cn } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";

export default function DraftPage() {
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
  }, [experience, jd, lang, setResume]);

  const canSubmit = !!experience && !!jd && jd.trim().length >= 20;

  const missingPrereqs: string[] = [];
  if (!experience) missingPrereqs.push("结构化经历（Step 0）");
  if (!jd) missingPrereqs.push("目标 JD（Step 1）");

  return (
    <>
      <StepNav />
      <main className="container py-8">
        <div className="mb-6 flex items-center justify-between no-print">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/fit-check" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              上一步
            </Link>
          </Button>
          {resume && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                打印对话框里取消勾选「页眉和页脚」、缩放设为 100%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                打印 / 导出 PDF
              </Button>
            </div>
          )}
        </div>

        <div className="mx-auto max-w-4xl space-y-6 no-print">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">简历草稿</h1>
            <p className="mt-2 text-muted-foreground">
              基于已确认的经历 + JD，AI 生成单页 A4 简历初稿。缺失字段会标
              MISSING，不替你编造。
            </p>
          </div>

          {missingPrereqs.length > 0 && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="flex items-start gap-3 pt-6 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  缺少前置数据：{missingPrereqs.join(" / ")}。请先返回对应步骤
                  完成。
                </div>
              </CardContent>
            </Card>
          )}

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
              disabled={loading || !canSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中（约 60-120s）...
                </>
              ) : resume ? (
                "重新生成"
              ) : (
                "生成简历草稿"
              )}
            </Button>
            <Button
              asChild
              disabled={!resume}
              className={cn(!resume && "pointer-events-none opacity-50")}
            >
              <Link href="/critique" className="gap-1">
                下一步：诊断
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
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          缺失字段（{items.length}）
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        AI 标记为 TBD 的项；这些不会被编造填充，需要你回到「头脑风暴」
        补充原始素材，或在投递前手动补齐：
        <ul className="ml-5 mt-2 list-disc space-y-1">
          {items.map((m, i) => (
            <li key={i}>{m.replace(/^MISSING(?=[:：\s])/, "TBD")}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
