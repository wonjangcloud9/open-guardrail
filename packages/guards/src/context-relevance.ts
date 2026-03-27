import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ContextRelevanceOptions {
  action: 'block' | 'warn';
  /** Original query/context to check relevance against */
  query: string;
  /** Minimum relevance score 0-1 (default 0.2) */
  minRelevance?: number;
}

function tokenOverlap(a: string, b: string): number {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'and', 'or', 'but', 'not',
    'it', 'this', 'that', 'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your']);

  const tokenize = (s: string) => {
    const tokens = s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    return new Set(tokens.filter((t) => !stopWords.has(t) && t.length > 2));
  };

  const ta = tokenize(a);
  const tb = tokenize(b);

  if (ta.size === 0 || tb.size === 0) return 0;

  let overlap = 0;
  for (const t of ta) { if (tb.has(t)) overlap++; }

  return (2 * overlap) / (ta.size + tb.size);
}

export function contextRelevance(options: ContextRelevanceOptions): Guard {
  const minRel = options.minRelevance ?? 0.2;

  return {
    name: 'context-relevance',
    version: '0.1.0',
    description: 'Checks if response is relevant to the original query/context',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const score = tokenOverlap(options.query, text);
      const triggered = score < minRel;

      return {
        guardName: 'context-relevance',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: Math.round(score * 100) / 100,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { relevanceScore: score, minRequired: minRel }
          : undefined,
      };
    },
  };
}
