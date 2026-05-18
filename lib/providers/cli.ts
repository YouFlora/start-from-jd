// CLI provider：把本机的 `claude` 命令当 LLM 后端用，吃用户的 Claude Code 订阅。
// 关键点：
//   - cwd 设为 /tmp，避免 claude 加载项目自己的 CLAUDE.md（会污染上下文 + 多花钱）
//   - --append-system-prompt 比 --system-prompt 便宜，因为默认 prompt 在 Anthropic 端被缓存
//   - --model haiku 够用且最便宜
//   - --no-session-persistence 防止会话历史变长

import { spawn, spawnSync } from "node:child_process";
import os from "node:os";

import type { LLMProvider } from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-6";

// 检测本机 claude CLI 是否可用。结果缓存到模块作用域（启动一次定生死，运行时不变）。
let _cliAvailable: boolean | null = null;
export function isClaudeCliAvailable(): boolean {
  if (_cliAvailable !== null) return _cliAvailable;
  try {
    const res = spawnSync("claude", ["--version"], {
      stdio: "ignore",
      timeout: 2000,
    });
    _cliAvailable = res.status === 0;
  } catch {
    _cliAvailable = false;
  }
  return _cliAvailable;
}

export function createCliProvider(opts?: { model?: string }): LLMProvider {
  const defaultModel = opts?.model ?? DEFAULT_MODEL;

  return {
    name: "cli",
    async generate({ system, user, model }) {
      return spawnClaude({ system, user, model: model ?? defaultModel });
    },
  };
}

interface SpawnArgs {
  system: string;
  user: string;
  model: string;
}

interface CliResult {
  result: string;
  is_error: boolean;
  total_cost_usd?: number;
}

function spawnClaude({ system, user, model }: SpawnArgs): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "claude",
      [
        "-p",
        "--model",
        model,
        "--output-format",
        "json",
        "--no-session-persistence",
        "--append-system-prompt",
        system,
      ],
      {
        cwd: os.tmpdir(),
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env },
      }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));

    child.on("error", (err) => {
      reject(
        new Error(
          `failed to spawn claude CLI: ${err.message}. 确认 \`claude\` 在 PATH 上 (\`which claude\`)，且已经 \`claude /login\`。`
        )
      );
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `claude CLI exited ${code}: ${stderr.slice(0, 500) || stdout.slice(0, 500)}`
          )
        );
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as CliResult;
        if (parsed.is_error) {
          reject(new Error(`claude CLI error: ${parsed.result}`));
          return;
        }
        if (typeof parsed.result !== "string") {
          reject(new Error("claude CLI: missing 'result' field"));
          return;
        }
        resolve(parsed.result.trim());
      } catch {
        reject(
          new Error(
            `claude CLI: failed to parse JSON output. First 500 chars:\n${stdout.slice(0, 500)}`
          )
        );
      }
    });

    child.stdin.end(user);
  });
}
