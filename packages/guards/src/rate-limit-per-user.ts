import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RateLimitPerUserOptions {
  action: 'block' | 'warn';
  /** Max requests per user in window (default 10) */
  maxRequests?: number;
  /** Window in ms (default 60000) */
  windowMs?: number;
  /** User ID field in context metadata */
  userIdField?: string;
}

export function rateLimitPerUser(options: RateLimitPerUserOptions): Guard {
  const maxReq = options.maxRequests ?? 10;
  const windowMs = options.windowMs ?? 60_000;
  const userIdField = options.userIdField ?? 'userId';
  const userHistory = new Map<string, number[]>();

  return {
    name: 'rate-limit-per-user',
    version: '0.1.0',
    description: 'Per-user rate limiting for guard pipelines',
    category: 'custom',
    supportedStages: ['input'],
    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const userId = (ctx as unknown as Record<string, unknown>)[userIdField] as string ?? 'anonymous';
      const now = Date.now();

      if (!userHistory.has(userId)) userHistory.set(userId, []);
      const timestamps = userHistory.get(userId)!;
      const cutoff = now - windowMs;
      while (timestamps.length > 0 && timestamps[0] < cutoff) timestamps.shift();
      timestamps.push(now);

      const triggered = timestamps.length > maxReq;
      return {
        guardName: 'rate-limit-per-user', passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { userId, requests: timestamps.length, max: maxReq, windowMs } : undefined,
      };
    },
  };
}
