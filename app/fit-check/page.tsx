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
import { useAppStore } from "@/lib/store";
import { apiHeaders, cn } from "@/lib/utils";
import type { FitCheckResult, FitVerdict } from "@/types/resume";

const VERDICT_META: Record<
  FitVerdict,
  { label: string; tone: string; ring: string; desc: string }
> = {
  go: {
    label: "Go · 大胆冲",
    tone: "bg-emerald-500 text-white",
    ring: "ring-emerald-500/30",
    desc: "匹配度高，按当前简历方向投递即可，重点放在量化业绩与关键词对齐。",
  },
  stretch: {
    label: "Stretch · 够一够",
    tone: "bg-amber-500 text-white",
    ring: "ring-amber-500/30",
    desc: "部分核心要求缺口，建议在简历里强化可迁移技能、补 1-2 个证据型项目后再投。",
  },
  pivot: {
    label: "Pivot · 需要转向",
    tone: "bg-rose-500 text-white",
    ring: "ring-rose-500/30",
    desc: "结构性不匹配。当前简历不建议硬投此 JD，可参考下方替代方向。",
  },
};

export default function FitCheckPage() {
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
  }, [experience, jd, lang, setFit]);

  const canSubmit = !!experience && (jd?.trim().length ?? 0) >= 20;

  return (
    <>
      <StepNav />
      <main className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/brainstorm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              上一步
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">匹配度检查</h1>
            <p className="mt-2 text-muted-foreground">
              贴入目标 JD，AI 对照你的经历文档，给出 0-100 匹配分、差距清单与是否值得投。
            </p>
          </div>

          {!experience && <NoExperienceWarning />}

          <Card>
            <CardHeader>
              <CardTitle>目标 JD</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={jd ?? ""}
                onChange={(e) => setJd(e.target.value)}
                placeholder="把目标职位的 JD 完整贴在这里（≥ 20 字）。可以包含工作职责、任职要求、加分项等所有原文。"
                className="min-h-[240px] font-mono text-sm leading-relaxed"
              />
              <div className="text-xs text-muted-foreground">
                {jd?.length ?? 0} 字 · 服务端不落库，JD 仅短暂转给 AI 后丢弃
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
              disabled={loading || !canSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  分析中（约 30-60s）...
                </>
              ) : fit ? (
                "重新分析"
              ) : (
                "分析匹配度"
              )}
            </Button>
            <Button
              asChild
              disabled={!fit}
              className={cn(!fit && "pointer-events-none opacity-50")}
            >
              <Link href="/draft" className="gap-1">
                下一步：生成简历草稿
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
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="flex items-start gap-3 pt-6 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          还没有结构化经历文档。先回到{" "}
          <Link href="/brainstorm" className="font-medium underline">
            头脑风暴
          </Link>{" "}
          完成 Step 0，再回来分析匹配度。
        </div>
      </CardContent>
    </Card>
  );
}

function FitResult({ fit }: { fit: FitCheckResult }) {
  const meta = VERDICT_META[fit.verdict];
  return (
    <Card>
      <CardHeader>
        <CardTitle>匹配度报告</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ScoreHeader score={fit.score} verdict={fit.verdict} />
        <div className="text-sm text-muted-foreground">{meta.desc}</div>

        <section>
          <SectionLabel>对比矩阵</SectionLabel>
          <div className="overflow-hidden rounded-md border border-input">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">维度</th>
                  <th className="px-3 py-2 text-left font-medium">候选人</th>
                  <th className="px-3 py-2 text-left font-medium">JD</th>
                  <th className="px-3 py-2 text-left font-medium">命中</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-input">
                {fit.matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium">{row.dimension}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.candidate}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.jd}
                    </td>
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
            label="为何匹配"
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
            items={fit.whyMatch}
            empty="暂无明显匹配点"
          />
          <BulletList
            label="差距"
            icon={<XCircle className="h-3.5 w-3.5 text-rose-600" />}
            items={fit.gaps}
            empty="无明显差距"
          />
        </div>

        {fit.verdict === "pivot" &&
          fit.alternativeRoles &&
          fit.alternativeRoles.length > 0 && (
            <section>
              <SectionLabel>替代职位建议</SectionLabel>
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
  const meta = VERDICT_META[verdict];
  return (
    <div className="flex items-center gap-5">
      <div
        className={cn(
          "flex h-24 w-24 shrink-0 items-center justify-center rounded-full ring-8",
          meta.tone,
          meta.ring
        )}
      >
        <div className="text-3xl font-bold leading-none tabular-nums">
          {score}
        </div>
      </div>
      <div className="space-y-1">
        <Badge className={cn(meta.tone, "text-sm")}>{meta.label}</Badge>
        <div className="text-xs text-muted-foreground">
          0-100 匹配分（按硬技能 / 领域 / 经验年限 / 软技能加权）
        </div>
      </div>
    </div>
  );
}

function MatchPill({ match }: { match: "match" | "partial" | "miss" }) {
  const map = {
    match: { label: "命中", cls: "bg-emerald-500/15 text-emerald-700" },
    partial: { label: "部分", cls: "bg-amber-500/15 text-amber-700" },
    miss: { label: "缺失", cls: "bg-rose-500/15 text-rose-700" },
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
