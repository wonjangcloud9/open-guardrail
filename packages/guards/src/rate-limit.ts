import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface RateLimitOptions {
  action: 'block' | 'warn';
  maxRequests: number;
  windowMs: number;
  keyFn?: (text: string, ctx: GuardContext) => string;
}

export function rateLimit(options: RateLimitOptions): Guard {
  const buckets = new Map<string, number[]>();
  const keyFn = options.keyFn ?? (() => 'global');

  function prune(key: string, now: number): number[] {
    const timestamps = buckets.get(key) ?? [];
    const cutoff = now - options.windowMs;
    const valid = timestamps.filter((t) => t > cutoff);
    buckets.set(key, valid);
    return valid;
  }

  return {
    name: 'rate-limit',
    version: '0.1.0',
    description: 'In-memory sliding window rate limiter',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const key = keyFn(text, ctx);
      const now = Date.now();
      const window = prune(key, now);
      const triggered = window.length >= options.maxRequests;

      if (!triggered) {
        window.push(now);
      }

      return {
        guardName: 'rate-limit',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: {
          key,
          requestsInWindow: window.length,
          maxRequests: options.maxRequests,
        },
      };
    },
  };
}
