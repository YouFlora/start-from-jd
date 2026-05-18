"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Lang } from "@/types/resume";

// Web Speech API 没有正式 TS 类型，下面声明仅覆盖我们用到的字段。
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

// onFinalChunk 在每段确认转录文本完成时被调用。调用方可累加进 textarea。
export function useSpeechRecognition(
  lang: Lang,
  onFinalChunk: (chunk: string) => void
): UseSpeechRecognitionResult {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinalChunk);
  onFinalRef.current = onFinalChunk;

  const supported = getCtor() !== null;

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("当前浏览器不支持语音识别（建议 Chrome / Edge / Safari）");
      return;
    }
    setError(null);
    setInterim("");

    const rec = new Ctor();
    rec.lang = lang === "zh" ? "zh-CN" : "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let liveInterim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          onFinalRef.current(text);
        } else {
          liveInterim += text;
        }
      }
      setInterim(liveInterim);
    };
    rec.onerror = (e) => {
      const msg =
        e.error === "not-allowed"
          ? "麦克风权限被拒绝，请在浏览器地址栏放行后重试"
          : `语音识别错误：${e.error}`;
      setError(msg);
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [lang]);

  useEffect(() => {
    return () => {
      recRef.current?.abort();
    };
  }, []);

  return { supported, listening, interim, error, start, stop };
}
