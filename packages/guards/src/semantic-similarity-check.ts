import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SemanticSimilarityCheckOptions {
  action: 'block' | 'warn';
  threshold?: number;
}

function getTrigrams(text: string): Set<string> {
  const s = text.toLowerCase().trim();
  const trigrams = new Set<string>();
  for (let i = 0; i <= s.length - 3; i++) {
    trigrams.add(s.slice(i, i + 3));
  }
  return trigrams;
}

function trigramSimilarity(a: string, b: string): number {
  const tA = getTrigrams(a);
  const tB = getTrigrams(b);
  if (tA.size === 0 && tB.size === 0) return 1;
  if (tA.size === 0 || tB.size === 0) return 0;
  let intersection = 0;
  for (const t of tA) {
    if (tB.has(t)) intersection++;
  }
  return intersection / Math.max(tA.size, tB.size);
}

export function semanticSimilarityCheck(options: SemanticSimilarityCheckOptions): Guard {
  const threshold = options.threshold ?? 0.8;

  return {
    name: 'semantic-similarity-check',
    version: '0.1.0',
    description: 'Checks if output is too similar to input (potential echo/copy)',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const input = (ctx as unknown as Record<string, unknown>).inputText as string | undefined;

      if (!input) {
        return {
          guardName: 'semantic-similarity-check',
          passed: true,
          action: 'allow',
          score: 0,
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const similarity = trigramSimilarity(input, text);
      const triggered = similarity >= threshold;

      return {
        guardName: 'semantic-similarity-check',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: similarity,
        latencyMs: Math.round(performance.now() - start),
        details: { similarity, threshold },
      };
    },
  };
}
