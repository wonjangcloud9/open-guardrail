import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ApiRateGuardOptions {
  action: 'block' | 'warn';
  maxTokens?: number;
  refillRate?: number;
  refillInterval?: number;
}

export function apiRateGuard(options: ApiRateGuardOptions): Guard {
  const maxTokens = options.maxTokens ?? 100;
  const refillRate = options.refillRate ?? 10;
  const refillInterval = options.refillInterval ?? 1000;

  let tokens = maxTokens;
  let lastRefill = Date.now();

  function refill(): void {
    const now = Date.now();
    const elapsed = now - lastRefill;
    const refillCount = Math.floor(elapsed / refillInterval) * refillRate;
    if (refillCount > 0) {
      tokens = Math.min(maxTokens, tokens + refillCount);
      lastRefill = now;
    }
  }

  return {
    name: 'api-rate-guard',
    version: '0.1.0',
    description: 'API rate limiting with token bucket algorithm',
    category: 'security',
    supportedStages: ['input'],
    async check(_text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      refill();
      const triggered = tokens <= 0;

      if (!triggered) {
        tokens -= 1;
      }

      return {
        guardName: 'api-rate-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? 'Rate limit exceeded — token bucket empty'
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: {
          remainingTokens: Math.max(0, tokens),
          maxTokens,
        },
      };
    },
  };
}
