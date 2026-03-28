import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RateLimitSemanticOptions {
  action: 'block' | 'warn';
  /** Max similar requests in window (default 5) */
  maxSimilarRequests?: number;
  /** Time window in ms (default 60000) */
  windowMs?: number;
  /** Similarity threshold 0-1 (default 0.7) */
  similarityThreshold?: number;
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function trigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 3 || b.length < 3) return a === b ? 1 : 0;

  const trigramsA = new Set<string>();
  const trigramsB = new Set<string>();

  for (let i = 0; i <= a.length - 3; i++) trigramsA.add(a.slice(i, i + 3));
  for (let i = 0; i <= b.length - 3; i++) trigramsB.add(b.slice(i, i + 3));

  let intersection = 0;
  for (const t of trigramsA) {
    if (trigramsB.has(t)) intersection++;
  }

  return (2 * intersection) / (trigramsA.size + trigramsB.size);
}

interface HistoryEntry {
  text: string;
  timestamp: number;
}

export function rateLimitSemantic(options: RateLimitSemanticOptions): Guard {
  const maxSimilar = options.maxSimilarRequests ?? 5;
  const windowMs = options.windowMs ?? 60_000;
  const threshold = options.similarityThreshold ?? 0.7;
  const history: HistoryEntry[] = [];

  return {
    name: 'rate-limit-semantic',
    version: '0.1.0',
    description: 'Semantic rate limiting that detects automated attacks via similar requests',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const now = Date.now();
      const normalized = normalizeText(text);

      // Prune expired entries
      while (history.length > 0 && now - history[0].timestamp > windowMs) {
        history.shift();
      }

      let similarCount = 0;
      for (const entry of history) {
        if (trigramSimilarity(normalized, entry.text) >= threshold) {
          similarCount++;
        }
      }

      history.push({ text: normalized, timestamp: now });

      const triggered = similarCount >= maxSimilar;
      return {
        guardName: 'rate-limit-semantic',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(similarCount / (maxSimilar * 2), 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { similarCount, maxSimilarRequests: maxSimilar, windowMs }
          : undefined,
      };
    },
  };
}
