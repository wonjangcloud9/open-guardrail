import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface RateAdaptiveOptions {
  action: 'block' | 'warn';
  softLimit?: number;
  hardLimit?: number;
  windowMs?: number;
}

export function rateAdaptive(
  options: RateAdaptiveOptions,
): Guard {
  const softLimit = options.softLimit ?? 50;
  const hardLimit = options.hardLimit ?? 100;
  const windowMs = options.windowMs ?? 60000;
  const timestamps: number[] = [];

  function prune(now: number): void {
    const cutoff = now - windowMs;
    while (timestamps.length > 0 && timestamps[0] <= cutoff) {
      timestamps.shift();
    }
  }

  return {
    name: 'rate-adaptive',
    version: '0.1.0',
    description:
      'Adaptive rate limiter with soft (warn) and hard (block) limits',
    category: 'custom',
    supportedStages: ['input'],
    async check(
      _text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const now = Date.now();
      prune(now);
      timestamps.push(now);
      const count = timestamps.length;

      let passed = true;
      let action: 'allow' | 'block' | 'warn' = 'allow';

      if (count > hardLimit) {
        passed = false;
        action = 'block';
      } else if (count > softLimit) {
        passed = true;
        action = 'warn';
      }

      return {
        guardName: 'rate-adaptive',
        passed,
        action,
        latencyMs: Math.round(performance.now() - start),
        details: {
          count,
          softLimit,
          hardLimit,
        },
      };
    },
  };
}
