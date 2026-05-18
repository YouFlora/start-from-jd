import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center py-16">
      <div className="max-w-2xl space-y-8 text-center">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Reverse SOP for resume building
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Start From JD
          </h1>
          <p className="text-xl text-muted-foreground">
            大多数人写简历都是照抄 JD。正确的 SOP 是：从你自己开始。
          </p>
        </div>

        <div className="grid gap-3 text-left text-sm text-muted-foreground sm:grid-cols-2">
          <Step n="1" title="头脑风暴">
            说话或上传文件，AI 整理出结构化经历文档
          </Step>
          <Step n="2" title="匹配度检查">
            对比职业 DNA 与 JD，给出匹配分与差距
          </Step>
          <Step n="3" title="简历草稿">
            基于经历和 JD 生成单页简历初稿
          </Step>
          <Step n="4" title="诊断">
            5 条致命/重要/微瑕级别的可执行批评
          </Step>
          <Step n="5" title="ATS 打磨">
            合规打磨并导出 PDF / DOCX / TXT
          </Step>
          <Step n="—" title="全程严守">
            不捏造、不奉承、不模糊；单页 A4
          </Step>
        </div>

        <Button asChild size="lg" className="gap-2">
          <Link href="/brainstorm">
            开始第一步：头脑风暴
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </main>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {n}
        </span>
        <span className="font-medium text-foreground">{title}</span>
      </div>
      <p className="pl-8">{children}</p>
    </div>
  );
}
