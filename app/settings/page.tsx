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
import { useAppStore } from "@/lib/store";

export default function SettingsPage() {
  const savedKey = useAppStore((s) => s.userKey);
  const setUserKey = useAppStore((s) => s.setUserKey);
  const clearUserKey = useAppStore((s) => s.clearUserKey);

  const [input, setInput] = useState("");
  const [reveal, setReveal] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // 把已存的 key 渲染进 input 框，方便用户看一眼或改
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
    if (!confirm("确定清除已保存的 key？后续请求会回退到服务端配置（若有）。"))
      return;
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
              返回首页
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">设置 · API Key</h1>
            <p className="mt-2 text-muted-foreground">
              本应用采用 BYOK（Bring Your Own Key）架构：你的 API key 仅保存在浏览器 localStorage，
              每次请求通过 header 透传给后端，服务端用完即弃，不写日志、不持久化。
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4" />
                OpenRouter API Key
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {savedKey && (
                <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>当前已保存：</span>
                  <span className="font-mono text-xs">{masked}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">粘贴 key</label>
                <div className="flex gap-2">
                  <input
                    type={reveal ? "text" : "password"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReveal((v) => !v)}
                    type="button"
                    title={reveal ? "隐藏" : "显示"}
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
                  保存 key
                </Button>
                {savedKey && (
                  <Button variant="outline" onClick={clear}>
                    <Trash2 className="h-4 w-4" />
                    清除
                  </Button>
                )}
                {savedToast && (
                  <span className="self-center text-sm text-emerald-600">
                    已保存到 localStorage
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                安全约束
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="ml-5 list-disc space-y-1">
                <li>key 仅存浏览器 localStorage（关闭网页不丢，清浏览器数据会丢）</li>
                <li>每次 LLM 请求通过 <code className="rounded bg-muted px-1 font-mono text-xs">x-llm-key</code> header 发到服务端</li>
                <li>服务端用完即弃：不缓存、不写日志、不存数据库</li>
                <li>本站源码开源，可在 GitHub 审计相关代码</li>
                <li>担心 key 泄露：去 OpenRouter dashboard 一键 rotate</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TriangleAlert className="h-4 w-4" />
                怎么拿 OpenRouter key
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ol className="ml-5 list-decimal space-y-1">
                <li>
                  去{" "}
                  <a
                    href="https://openrouter.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 font-medium text-foreground underline underline-offset-2"
                  >
                    openrouter.ai
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  注册账号（Google / GitHub 一键登录，不需要信用卡）
                </li>
                <li>
                  右上角头像 → Keys → Create Key，名字随意，权限默认即可
                </li>
                <li>复制以 <code className="rounded bg-muted px-1 font-mono text-xs">sk-or-v1-</code> 开头的字符串，粘到上面输入框</li>
                <li>免费档每天约 50–200 次调用，足够跑完整 5 步流程多次</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
