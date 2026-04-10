import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ToolCallFrequencyOptions {
  action: 'block' | 'warn';
  /** Max allowed tool calls within the window */
  maxCalls?: number;
  /** Sliding window in seconds */
  windowSeconds?: number;
}

const TOOL_CALL_PATTERNS = [
  /tool_call/gi,
  /function_call/gi,
  /use_tool/gi,
  /<tool>/gi,
  /Action:\s*\w+/gi,
];

function countToolCalls(text: string): number {
  let count = 0;
  for (const pattern of TOOL_CALL_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
}

export function toolCallFrequency(options: ToolCallFrequencyOptions): Guard {
  const maxCalls = options.maxCalls ?? 10;
  const windowSeconds = options.windowSeconds ?? 60;
  const timestamps: number[] = [];

  return {
    name: 'tool-call-frequency',
    version: '0.1.0',
    description: 'Rate-limits tool calls within a sliding window',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const now = Date.now();
      const callCount = countToolCalls(text);
      const windowMs = windowSeconds * 1000;

      for (let i = 0; i < callCount; i++) {
        timestamps.push(now);
      }

      // Remove timestamps outside the window
      while (timestamps.length > 0 && timestamps[0] < now - windowMs) {
        timestamps.shift();
      }

      const triggered = timestamps.length > maxCalls;
      return {
        guardName: 'tool-call-frequency',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { callsInWindow: timestamps.length, maxCalls, windowSeconds }
          : undefined,
      };
    },
  };
}
