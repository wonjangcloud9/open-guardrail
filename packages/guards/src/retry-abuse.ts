import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RetryAbuseOptions {
  action: 'block' | 'warn';
  maxRetries?: number;
  windowMs?: number;
}

export function retryAbuse(options: RetryAbuseOptions): Guard {
  const maxRetries = options.maxRetries ?? 5;
  const windowMs = options.windowMs ?? 10000;
  const requestLog: Map<string, number[]> = new Map();

  return {
    name: 'retry-abuse',
    version: '0.1.0',
    description: 'Detects retry abuse patterns including rapid retries and backoff violations',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const now = Date.now();
      const key = text.trim().substring(0, 200);
      const issues: string[] = [];

      const timestamps = requestLog.get(key) ?? [];
      timestamps.push(now);

      const recent = timestamps.filter((t) => now - t <= windowMs);
      requestLog.set(key, recent);

      if (recent.length > maxRetries) {
        issues.push('max_retries_exceeded');
      }

      if (recent.length >= 3) {
        const gaps: number[] = [];
        for (let i = 1; i < recent.length; i++) {
          gaps.push(recent[i] - recent[i - 1]);
        }
        const allRapid = gaps.every((g) => g < 100);
        if (allRapid) {
          issues.push('identical_rapid_retries');
        }

        if (gaps.length >= 3) {
          const increasing = gaps.every((g, i) => i === 0 || g >= gaps[i - 1]);
          if (!increasing && recent.length > 3) {
            issues.push('backoff_violation');
          }
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 2, 1.0) : 0;

      return {
        guardName: 'retry-abuse',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, retryCount: recent.length } : undefined,
      };
    },
  };
}
