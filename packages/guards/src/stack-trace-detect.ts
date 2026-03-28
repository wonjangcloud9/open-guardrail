import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface StackTraceDetectOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /at\s+\w+\s+\([^)]+:\d+:\d+\)/,
  /at\s+[^(]+\([^)]+\)/,
  /File\s+"[^"]+",\s+line\s+\d+/,
  /Traceback\s+\(most\s+recent\s+call\s+last\)/i,
  /^\s+at\s+/m,
  /Exception\s+in\s+thread\s+"/,
  /\w+Error:\s+.+\n\s+at\s+/,
  /\.java:\d+\)/,
  /\.py",\s+line\s+\d+/,
  /\.go:\d+\s/,
  /panic:\s+runtime\s+error/,
];

export function stackTraceDetect(options: StackTraceDetectOptions): Guard {
  return {
    name: 'stack-trace-detect',
    version: '0.1.0',
    description: 'Detects stack traces in output',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'stack-trace-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
