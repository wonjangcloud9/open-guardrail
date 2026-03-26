import type { Guard, GuardContext, GuardResult } from './types.js';

interface CacheOptions {
  maxSize?: number;
  ttlMs?: number;
}

interface CacheEntry {
  result: GuardResult;
  expiry: number;
}

/**
 * Cache guard results for identical inputs.
 * Useful for expensive LLM-based guards to avoid
 * redundant API calls.
 *
 * @example
 * ```typescript
 * const cachedJudge = guardCache(llmJudge({ ... }), {
 *   maxSize: 100,
 *   ttlMs: 60_000,
 * });
 * ```
 */
export function guardCache(
  guard: Guard,
  options: CacheOptions = {},
): Guard {
  const maxSize = options.maxSize ?? 256;
  const ttlMs = options.ttlMs ?? 60_000;
  const cache = new Map<string, CacheEntry>();

  function makeKey(text: string, ctx: GuardContext): string {
    return `${guard.name}:${ctx.pipelineType}:${text}`;
  }

  function evict(): void {
    if (cache.size <= maxSize) return;
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }

  function prune(): void {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (entry.expiry <= now) cache.delete(key);
    }
  }

  return {
    ...guard,
    name: `cached(${guard.name})`,
    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const key = makeKey(text, ctx);
      const now = Date.now();

      const cached = cache.get(key);
      if (cached && cached.expiry > now) {
        return {
          ...cached.result,
          latencyMs: 0,
          details: {
            ...cached.result.details,
            fromCache: true,
          },
        };
      }

      const result = await guard.check(text, ctx);

      cache.set(key, { result, expiry: now + ttlMs });
      evict();

      if (cache.size > maxSize / 2) prune();

      return result;
    },
  };
}
