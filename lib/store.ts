// 全局状态：用 zustand + localStorage，所有数据留在用户浏览器，不进服务端。
// 服务端只在响应单次 AI 调用时短暂持有 payload，不落库。

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  AppState,
  CritiqueReport,
  ExperienceDocument,
  FitCheckResult,
  Lang,
  ResumeData,
} from "@/types/resume";

interface AppStore extends AppState {
  setLang: (l: Lang) => void;
  setRawInput: (s: string) => void;
  setExperience: (e: ExperienceDocument) => void;
  setJd: (jd: string) => void;
  setFit: (f: FitCheckResult) => void;
  setResume: (r: ResumeData) => void;
  setCritique: (c: CritiqueReport) => void;
  setUserKey: (k: string) => void;
  clearUserKey: () => void;
  reset: () => void;
}

const initial: AppState = {
  lang: "zh",
  rawInput: "",
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initial,
      setLang: (lang) => set({ lang }),
      setRawInput: (rawInput) => set({ rawInput }),
      setExperience: (experience) => set({ experience }),
      setJd: (jd) => set({ jd }),
      setFit: (fit) => set({ fit }),
      setResume: (resume) => set({ resume }),
      setCritique: (critique) => set({ critique }),
      setUserKey: (userKey) => set({ userKey: userKey.trim() || undefined }),
      clearUserKey: () => set({ userKey: undefined }),
      reset: () => set(initial),
    }),
    { name: "start-from-jd" }
  )
);
