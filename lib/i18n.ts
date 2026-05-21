// UI 文案集中字典。AI 输出的语言走 lib/prompts.ts withLang；这里管的是壳子里所有按钮、标题、提示。
// 用法：const t = useT(); t.brainstorm.title。新增字段必须 zh / en 都补，不允许漏。

"use client";

import { useAppStore } from "@/lib/store";
import type { Lang } from "@/types/resume";

interface Dict {
  common: {
    back: string;
    backHome: string;
    prevStep: string;
    nextStep: string;
    regenerate: string;
    error: (msg: string) => string;
    chars: (n: number) => string;
    clear: string;
    note: string;
  };
  nav: {
    home: string;
    brainstorm: string;
    fitCheck: string;
    draft: string;
    critique: string;
    polish: string;
    settingsTitle: string;
  };
  providerBadge: {
    byokTooltip: string;
    byokHint: string;
    serverTooltip: string;
    serverHint: string;
    reqLeft: (n: number) => string;
  };
  home: {
    eyebrow: string;
    title: string;
    tagline: string;
    cta: string;
    steps: {
      brainstorm: { title: string; desc: string };
      fitCheck: { title: string; desc: string };
      draft: { title: string; desc: string };
      critique: { title: string; desc: string };
      polish: { title: string; desc: string };
      constraint: { title: string; desc: string };
    };
  };
  brainstorm: {
    title: string;
    subtitle: string;
    tabs: { voice: string; file: string; text: string };
    rawLabel: string;
    rawPlaceholder: string;
    submit: string;
    submitLoading: string;
    submitDone: string;
    submitDisabledHint: string;
    nextBtn: string;
    voiceUnsupported: string;
    voiceListening: (langName: string) => string;
    voiceIdle: string;
    voiceStartAria: string;
    voiceStopAria: string;
    fileDrop: string;
    fileHint: string;
    fileTooLarge: (kb: number) => string;
    fileBadExt: (exts: string) => string;
    previewTitle: string;
    downloadDocx: string;
    docxTooltip: string;
    docxError: (msg: string) => string;
    section: {
      summary: string;
      items: (n: number) => string;
      hardSkills: string;
      softSkills: string;
      languages: string;
      empty: string;
      rawNotes: string;
    };
  };
  fitCheck: {
    title: string;
    subtitle: string;
    jdTitle: string;
    jdPlaceholder: string;
    jdHint: string;
    submit: string;
    submitLoading: string;
    submitDone: string;
    nextBtn: string;
    noExperience: string;
    noExperienceLink: string;
    reportTitle: string;
    matrixHeading: string;
    matrixHead: { dim: string; cand: string; jd: string; match: string };
    pill: { match: string; partial: string; miss: string };
    why: string;
    whyEmpty: string;
    gaps: string;
    gapsEmpty: string;
    altRoles: string;
    scoreHint: string;
    verdict: {
      go: { label: string; desc: string };
      stretch: { label: string; desc: string };
      pivot: { label: string; desc: string };
    };
  };
  draft: {
    title: string;
    subtitle: string;
    submit: string;
    submitLoading: string;
    submitDone: string;
    nextBtn: string;
    missingPrereqs: (list: string) => string;
    prereqExperience: string;
    prereqJd: string;
    printHint: string;
    printBtn: string;
    missingTitle: (n: number) => string;
    missingDesc: string;
  };
  critique: {
    title: string;
    subtitle: string;
    submit: string;
    submitLoading: string;
    submitDone: string;
    nextBtn: string;
    noResume: string;
    noResumeLink: string;
    overall: string;
    issue: string;
    fix: string;
    anchor: string;
    severity: {
      fatal: string;
      major: string;
      minor: string;
    };
  };
  polish: {
    title: string;
    subtitle: string;
    submit: string;
    submitLoading: string;
    submitDone: string;
    noResume: string;
    noResumeLink: string;
    printHint: string;
    printBtn: string;
    txtBtn: string;
    docxBtn: string;
    docxError: (msg: string) => string;
    missingTitle: (n: number) => string;
    missingDesc: string;
  };
  settings: {
    title: string;
    subtitle: string;
    keyTitle: string;
    keyCurrent: string;
    keyLabel: string;
    keyPlaceholder: string;
    keyReveal: string;
    keyHide: string;
    keySave: string;
    keySaved: string;
    keyClear: string;
    keyClearConfirm: string;
    safetyTitle: string;
    safety: string[];
    howTitle: string;
    how: { step1Prefix: string; step1Link: string; step1Suffix: string; step2: string; step3: string; step4: string };
  };
  preview: {
    tbdName: string;
    tbdEmail: string;
  };
}

const ZH: Dict = {
  common: {
    back: "返回",
    backHome: "返回首页",
    prevStep: "上一步",
    nextStep: "下一步",
    regenerate: "重新生成",
    error: (msg) => `生成失败：${msg}`,
    chars: (n) => `${n} 字`,
    clear: "清空",
    note: "备注",
  },
  nav: {
    home: "Start From JD",
    brainstorm: "1. 头脑风暴",
    fitCheck: "2. 匹配度检查",
    draft: "3. 简历草稿",
    critique: "4. 诊断",
    polish: "5. ATS 打磨",
    settingsTitle: "设置 / 自带 API key",
  },
  providerBadge: {
    byokTooltip:
      "你已自带 OpenRouter API key（BYOK）。key 仅存浏览器 localStorage，通过 x-llm-key header 透传给服务端，用完即弃。",
    byokHint: "消耗你自己的 OpenRouter 额度，免费档输出请人工核对",
    serverTooltip:
      "当前使用服务端配置的 OpenRouter key。如要使用自己的额度，请去 /settings 配置。",
    serverHint: "免费档输出可能含捏造数字 / 未掌握技能，请人工核对",
    reqLeft: (n) => `${n} req 剩余`,
  },
  home: {
    eyebrow: "Reverse SOP for resume building",
    title: "Start From JD",
    tagline: "大多数人写简历都是照抄 JD。正确的 SOP 是：从你自己开始。",
    cta: "开始第一步：头脑风暴",
    steps: {
      brainstorm: { title: "头脑风暴", desc: "说话或上传文件，AI 整理出结构化经历文档" },
      fitCheck: { title: "匹配度检查", desc: "对比职业 DNA 与 JD，给出匹配分与差距" },
      draft: { title: "简历草稿", desc: "基于经历和 JD 生成单页简历初稿" },
      critique: { title: "诊断", desc: "5 条致命/重要/微瑕级别的可执行批评" },
      polish: { title: "ATS 打磨", desc: "合规打磨并导出 PDF / DOCX / TXT" },
      constraint: { title: "全程严守", desc: "不捏造、不奉承、不模糊；单页 A4" },
    },
  },
  brainstorm: {
    title: "头脑风暴",
    subtitle:
      "说话、上传文件或直接输入——把你做过的事原原本本倒出来。AI 只整理、不替你编造。三种方式可混用。",
    tabs: { voice: "录音", file: "上传文件", text: "直接输入" },
    rawLabel: "累计原始素材（可继续编辑 / 增补）",
    rawPlaceholder: "在这里直接输入，或切换到上方录音 / 文件 tab 自动追加",
    submit: "生成结构化经历",
    submitLoading: "生成中（约 30-90s）...",
    submitDone: "重新生成",
    submitDisabledHint: "至少 20 字才能生成",
    nextBtn: "下一步：匹配度检查",
    voiceUnsupported:
      "当前浏览器不支持 Web Speech API。建议改用 Chrome / Edge / Safari，或先在「上传文件」「直接输入」 tab 录入素材。",
    voiceListening: (langName) =>
      `正在收音（${langName}）— 边说边追加到下方文本框`,
    voiceIdle: "点击开始录音；说完点击同一按钮停止",
    voiceStartAria: "开始录音",
    voiceStopAria: "停止录音",
    fileDrop: "拖拽文件到这里，或点击选择",
    fileHint: ".txt / .md / .markdown，≤ 200KB",
    fileTooLarge: (kb) => `文件超过 ${kb}KB 上限`,
    fileBadExt: (exts) => `仅支持 ${exts} 文件`,
    previewTitle: "结构化经历预览",
    downloadDocx: "下载 DOCX 底稿",
    docxTooltip: "导出全量结构化底稿，便于自己手工编辑成最终简历",
    docxError: (msg) => `导出失败：${msg}`,
    section: {
      summary: "Summary",
      items: (n) => `Items（${n}）`,
      hardSkills: "Hard Skills",
      softSkills: "Soft Skills",
      languages: "Languages",
      empty: "（无）",
      rawNotes: "备注",
    },
  },
  fitCheck: {
    title: "匹配度检查",
    subtitle:
      "贴入目标 JD，AI 对照你的经历文档，给出 0-100 匹配分、差距清单与是否值得投。",
    jdTitle: "目标 JD",
    jdPlaceholder:
      "把目标职位的 JD 完整贴在这里（≥ 20 字）。可以包含工作职责、任职要求、加分项等所有原文。",
    jdHint: "服务端不落库，JD 仅短暂转给 AI 后丢弃",
    submit: "分析匹配度",
    submitLoading: "分析中（约 30-60s）...",
    submitDone: "重新分析",
    nextBtn: "下一步：生成简历草稿",
    noExperience: "还没有结构化经历文档。先回到",
    noExperienceLink: "头脑风暴",
    reportTitle: "匹配度报告",
    matrixHeading: "对比矩阵",
    matrixHead: { dim: "维度", cand: "候选人", jd: "JD", match: "命中" },
    pill: { match: "命中", partial: "部分", miss: "缺失" },
    why: "为何匹配",
    whyEmpty: "暂无明显匹配点",
    gaps: "差距",
    gapsEmpty: "无明显差距",
    altRoles: "替代职位建议",
    scoreHint: "0-100 匹配分（按硬技能 / 领域 / 经验年限 / 软技能加权）",
    verdict: {
      go: {
        label: "Go · 大胆冲",
        desc: "匹配度高，按当前简历方向投递即可，重点放在量化业绩与关键词对齐。",
      },
      stretch: {
        label: "Stretch · 够一够",
        desc: "部分核心要求缺口，建议在简历里强化可迁移技能、补 1-2 个证据型项目后再投。",
      },
      pivot: {
        label: "Pivot · 需要转向",
        desc: "结构性不匹配。当前简历不建议硬投此 JD，可参考下方替代方向。",
      },
    },
  },
  draft: {
    title: "简历草稿",
    subtitle:
      "基于已确认的经历 + JD，AI 生成单页 A4 简历初稿。缺失字段会标 MISSING，不替你编造。",
    submit: "生成简历草稿",
    submitLoading: "生成中（约 60-120s）...",
    submitDone: "重新生成",
    nextBtn: "下一步：诊断",
    missingPrereqs: (list) => `缺少前置数据：${list}。请先返回对应步骤完成。`,
    prereqExperience: "结构化经历（Step 0）",
    prereqJd: "目标 JD（Step 1）",
    printHint: "打印对话框里取消勾选「页眉和页脚」、缩放设为 100%",
    printBtn: "打印 / 导出 PDF",
    missingTitle: (n) => `缺失字段（${n}）`,
    missingDesc:
      "AI 标记为 TBD 的项；这些不会被编造填充，需要你回到「头脑风暴」补充原始素材，或在投递前手动补齐：",
  },
  critique: {
    title: "诊断",
    subtitle:
      "给出 5 条直接、可执行的批评，附严重等级。不安慰、不套话——把会被 ATS 或招聘者刷掉的真实原因摆出来。",
    submit: "开始诊断",
    submitLoading: "诊断中（约 30-60s）...",
    submitDone: "重新诊断",
    nextBtn: "下一步：ATS 打磨",
    noResume: "还没有简历草稿。先回到",
    noResumeLink: "简历草稿",
    overall: "总评",
    issue: "问题",
    fix: "可立即执行的改法",
    anchor: "简历命中位置",
    severity: {
      fatal: "Fatal · 致命",
      major: "Major · 重要",
      minor: "Minor · 微瑕",
    },
  },
  polish: {
    title: "ATS 打磨",
    subtitle:
      "基于诊断结果做最终一次合规打磨：关键词对齐 JD、量化收紧、排版按内容密度自适应单页。导出 PDF（浏览器打印）/ TXT / DOCX。",
    submit: "运行 ATS 打磨",
    submitLoading: "打磨中（约 60-120s）...",
    submitDone: "再次打磨",
    noResume: "还没有简历草稿。先回到",
    noResumeLink: "简历草稿",
    printHint: "打印时取消勾选「页眉和页脚」、缩放 100%",
    printBtn: "打印 / PDF",
    txtBtn: "下载 TXT",
    docxBtn: "下载 DOCX",
    docxError: (msg) => `DOCX 导出失败：${msg}`,
    missingTitle: (n) => `仍存在缺失字段（${n}）`,
    missingDesc: "ATS 打磨不会编内容补缺。投递前需在原始素材里补齐这些事实，重跑 Step 0 → 4：",
  },
  settings: {
    title: "设置 · API Key",
    subtitle:
      "本应用采用 BYOK（Bring Your Own Key）架构：你的 API key 仅保存在浏览器 localStorage，每次请求通过 header 透传给后端，服务端用完即弃，不写日志、不持久化。",
    keyTitle: "OpenRouter API Key",
    keyCurrent: "当前已保存：",
    keyLabel: "粘贴 key",
    keyPlaceholder: "sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    keyReveal: "显示",
    keyHide: "隐藏",
    keySave: "保存 key",
    keySaved: "已保存到 localStorage",
    keyClear: "清除",
    keyClearConfirm: "确定清除已保存的 key？后续请求会回退到服务端配置（若有）。",
    safetyTitle: "安全约束",
    safety: [
      "key 仅存浏览器 localStorage（关闭网页不丢，清浏览器数据会丢）",
      "每次 LLM 请求通过 x-llm-key header 发到服务端",
      "服务端用完即弃：不缓存、不写日志、不存数据库",
      "本站源码开源，可在 GitHub 审计相关代码",
      "担心 key 泄露：去 OpenRouter dashboard 一键 rotate",
    ],
    howTitle: "怎么拿 OpenRouter key",
    how: {
      step1Prefix: "去 ",
      step1Link: "openrouter.ai",
      step1Suffix: " 注册账号（Google / GitHub 一键登录，不需要信用卡）",
      step2: "右上角头像 → Keys → Create Key，名字随意，权限默认即可",
      step3: "复制以 sk-or-v1- 开头的字符串，粘到上面输入框",
      step4: "免费档每天约 50–200 次调用，足够跑完整 5 步流程多次",
    },
  },
  preview: {
    tbdName: "TBD · 候选人姓名",
    tbdEmail: "TBD · 联系邮箱",
  },
};

const EN: Dict = {
  common: {
    back: "Back",
    backHome: "Back to home",
    prevStep: "Previous",
    nextStep: "Next",
    regenerate: "Regenerate",
    error: (msg) => `Failed: ${msg}`,
    chars: (n) => `${n} chars`,
    clear: "Clear",
    note: "Note",
  },
  nav: {
    home: "Start From JD",
    brainstorm: "1. Brainstorm",
    fitCheck: "2. Fit Check",
    draft: "3. Draft",
    critique: "4. Critique",
    polish: "5. ATS Polish",
    settingsTitle: "Settings / BYOK",
  },
  providerBadge: {
    byokTooltip:
      "You're using your own OpenRouter API key (BYOK). The key stays in browser localStorage, passes through via the x-llm-key header, and is discarded server-side after each call.",
    byokHint:
      "Spends your own OpenRouter quota; free-tier outputs require manual verification",
    serverTooltip:
      "Currently using the server-configured OpenRouter key. To use your own quota, set it up in /settings.",
    serverHint:
      "Free-tier outputs may contain fabricated numbers or unverified skills — please verify manually",
    reqLeft: (n) => `${n} req left`,
  },
  home: {
    eyebrow: "Reverse SOP for resume building",
    title: "Start From JD",
    tagline:
      "Most people write resumes by copying the JD. The right SOP starts from you.",
    cta: "Step 1: Brainstorm",
    steps: {
      brainstorm: {
        title: "Brainstorm",
        desc: "Speak or upload files; AI structures your experience document",
      },
      fitCheck: {
        title: "Fit Check",
        desc: "Compare your career DNA against the JD with score and gaps",
      },
      draft: {
        title: "Draft",
        desc: "Generate a single-page resume from your experience + JD",
      },
      critique: {
        title: "Critique",
        desc: "5 actionable critiques tagged fatal / major / minor",
      },
      polish: {
        title: "ATS Polish",
        desc: "Compliance pass and export to PDF / DOCX / TXT",
      },
      constraint: {
        title: "Always",
        desc: "No fabrication, no flattery, no fluff; single A4",
      },
    },
  },
  brainstorm: {
    title: "Brainstorm",
    subtitle:
      "Speak, upload a file, or type — dump everything you've done. AI organizes, never invents. All three modes can be mixed.",
    tabs: { voice: "Voice", file: "Upload", text: "Type" },
    rawLabel: "Accumulated raw notes (keep editing / appending)",
    rawPlaceholder:
      "Type here, or switch to the voice / file tab above to auto-append",
    submit: "Generate structured experience",
    submitLoading: "Generating (~30-90s)...",
    submitDone: "Regenerate",
    submitDisabledHint: "At least 20 characters required",
    nextBtn: "Next: Fit Check",
    voiceUnsupported:
      "This browser does not support Web Speech API. Try Chrome / Edge / Safari, or input notes via the Upload / Type tabs.",
    voiceListening: (langName) =>
      `Listening (${langName}) — appending live to the textbox below`,
    voiceIdle: "Tap to start; tap the same button when done",
    voiceStartAria: "Start recording",
    voiceStopAria: "Stop recording",
    fileDrop: "Drag a file here, or click to select",
    fileHint: ".txt / .md / .markdown, ≤ 200KB",
    fileTooLarge: (kb) => `File exceeds the ${kb}KB limit`,
    fileBadExt: (exts) => `Only ${exts} files are supported`,
    previewTitle: "Structured experience preview",
    downloadDocx: "Download DOCX draft",
    docxTooltip:
      "Export the full structured draft so you can hand-edit it into your final resume",
    docxError: (msg) => `Export failed: ${msg}`,
    section: {
      summary: "Summary",
      items: (n) => `Items (${n})`,
      hardSkills: "Hard Skills",
      softSkills: "Soft Skills",
      languages: "Languages",
      empty: "(none)",
      rawNotes: "Note",
    },
  },
  fitCheck: {
    title: "Fit Check",
    subtitle:
      "Paste the target JD. AI compares it against your experience document and returns a 0-100 score, gap list, and whether it's worth applying.",
    jdTitle: "Target JD",
    jdPlaceholder:
      "Paste the full job description here (≥ 20 chars). Include responsibilities, requirements, nice-to-haves — anything from the listing.",
    jdHint: "Not persisted on server; JD is forwarded to AI and discarded.",
    submit: "Analyze fit",
    submitLoading: "Analyzing (~30-60s)...",
    submitDone: "Re-analyze",
    nextBtn: "Next: Generate draft",
    noExperience: "No structured experience yet. Go back to ",
    noExperienceLink: "Brainstorm",
    reportTitle: "Fit report",
    matrixHeading: "Comparison matrix",
    matrixHead: {
      dim: "Dimension",
      cand: "Candidate",
      jd: "JD",
      match: "Match",
    },
    pill: { match: "Match", partial: "Partial", miss: "Miss" },
    why: "Why it matches",
    whyEmpty: "No clear matches",
    gaps: "Gaps",
    gapsEmpty: "No notable gaps",
    altRoles: "Alternative role suggestions",
    scoreHint:
      "0-100 fit score (weighted by hard skills / domain / years / soft skills)",
    verdict: {
      go: {
        label: "Go · Send it",
        desc: "Strong fit. Apply with the current direction; focus on quantified wins and keyword alignment.",
      },
      stretch: {
        label: "Stretch · Push for it",
        desc: "Some core gaps. Strengthen transferable skills and add 1–2 evidence projects in the resume before applying.",
      },
      pivot: {
        label: "Pivot · Reorient",
        desc: "Structural mismatch. Don't force this JD with the current resume — see alternative directions below.",
      },
    },
  },
  draft: {
    title: "Draft",
    subtitle:
      "Using your confirmed experience + JD, AI generates a single-page A4 draft. Missing fields are tagged MISSING — never fabricated.",
    submit: "Generate draft",
    submitLoading: "Generating (~60-120s)...",
    submitDone: "Regenerate",
    nextBtn: "Next: Critique",
    missingPrereqs: (list) =>
      `Missing prerequisites: ${list}. Complete those steps first.`,
    prereqExperience: "Structured experience (Step 0)",
    prereqJd: "Target JD (Step 1)",
    printHint: "In the print dialog: uncheck Headers and footers, scale 100%",
    printBtn: "Print / Save as PDF",
    missingTitle: (n) => `Missing fields (${n})`,
    missingDesc:
      "Fields the AI marked TBD. These will not be fabricated — go back to Brainstorm to add raw material, or fill them in manually before applying:",
  },
  critique: {
    title: "Critique",
    subtitle:
      "Five direct, actionable critiques with severity tags. No reassurance, no fluff — the real reasons an ATS or recruiter would reject this.",
    submit: "Run critique",
    submitLoading: "Critiquing (~30-60s)...",
    submitDone: "Re-critique",
    nextBtn: "Next: ATS Polish",
    noResume: "No draft yet. Go back to ",
    noResumeLink: "Draft",
    overall: "Overall",
    issue: "Issue",
    fix: "Actionable fix",
    anchor: "Where in resume",
    severity: {
      fatal: "Fatal",
      major: "Major",
      minor: "Minor",
    },
  },
  polish: {
    title: "ATS Polish",
    subtitle:
      "Final compliance pass: align keywords to the JD, tighten quantification, and fit a single page based on content density. Export to PDF (browser print) / TXT / DOCX.",
    submit: "Run ATS polish",
    submitLoading: "Polishing (~60-120s)...",
    submitDone: "Polish again",
    noResume: "No draft yet. Go back to ",
    noResumeLink: "Draft",
    printHint: "When printing: uncheck Headers and footers, scale 100%",
    printBtn: "Print / PDF",
    txtBtn: "Download TXT",
    docxBtn: "Download DOCX",
    docxError: (msg) => `DOCX export failed: ${msg}`,
    missingTitle: (n) => `Still-missing fields (${n})`,
    missingDesc:
      "ATS polish will not fabricate to fill gaps. Add these facts to your raw material and rerun Step 0 → 4 before applying:",
  },
  settings: {
    title: "Settings · API Key",
    subtitle:
      "This app uses BYOK (Bring Your Own Key): your key is stored only in browser localStorage, passed via header on each request, and discarded server-side — no logs, no persistence.",
    keyTitle: "OpenRouter API Key",
    keyCurrent: "Currently saved:",
    keyLabel: "Paste key",
    keyPlaceholder: "sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    keyReveal: "Show",
    keyHide: "Hide",
    keySave: "Save key",
    keySaved: "Saved to localStorage",
    keyClear: "Clear",
    keyClearConfirm:
      "Clear the saved key? Future requests will fall back to the server-configured key (if any).",
    safetyTitle: "Safety guarantees",
    safety: [
      "Key stays in browser localStorage (survives reload; lost on clearing browser data)",
      "Each LLM request sends it via the x-llm-key header",
      "Server-side use-and-discard: no cache, no logs, no database",
      "Source is open: audit the code on GitHub",
      "Worried about leaks? Rotate the key from the OpenRouter dashboard",
    ],
    howTitle: "How to get an OpenRouter key",
    how: {
      step1Prefix: "Visit ",
      step1Link: "openrouter.ai",
      step1Suffix:
        " and sign up (Google / GitHub one-click; no credit card needed)",
      step2: "Avatar → Keys → Create Key. Any name, default scopes.",
      step3: "Copy the string starting with sk-or-v1- and paste it above.",
      step4:
        "Free tier ≈ 50–200 calls / day — enough to run the full 5-step flow several times.",
    },
  },
  preview: {
    tbdName: "TBD · Candidate name",
    tbdEmail: "TBD · Contact email",
  },
};

const DICTS: Record<Lang, Dict> = { zh: ZH, en: EN };

export function useT(): Dict {
  const lang = useAppStore((s) => s.lang);
  return DICTS[lang];
}

export function dictFor(lang: Lang): Dict {
  return DICTS[lang];
}

export function langName(lang: Lang, ofLang: Lang): string {
  if (ofLang === "zh") return lang === "zh" ? "中文" : "English";
  return lang === "zh" ? "Chinese" : "English";
}
