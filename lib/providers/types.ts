// 两模式 LLM provider 抽象（+ BYOK：BYOK 复用 openrouter 实现，只是 key 来源不同）。
// CLI：本机 claude 子进程（吃 Claude Code 订阅，本地开发首选）。
// OpenRouter：HTTP API，免费模型，server-side env 或 BYOK 都走它。
// 所有调用方只面向这个接口，切换 provider 不影响业务代码。

export type ProviderName = "cli" | "openrouter";

export interface GenerateOptions {
  system: string;
  user: string;
  maxTokens?: number;
  // 单次调用覆盖 provider 默认模型。例：诊断步骤用 claude-opus-4-7，其他步骤用 sonnet。
  model?: string;
}

// 仅 openrouter 用到的运行时元信息（实际命中的模型、最近一次 rate-limit 剩余）。
export interface ProviderMeta {
  lastModel?: string;
  rateLimit?: {
    remaining?: number;
    reset?: string;
  };
}

export interface LLMProvider {
  name: ProviderName;
  generate(opts: GenerateOptions): Promise<string>;
  meta?(): ProviderMeta;
}
