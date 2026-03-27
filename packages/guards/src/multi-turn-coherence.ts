import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface MultiTurnCoherenceOptions {
  action: 'block' | 'warn';
  maxDrift?: number;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2),
  );
}

function jaccardSimilarity(
  a: Set<string>,
  b: Set<string>,
): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

export function multiTurnCoherence(
  options: MultiTurnCoherenceOptions,
): Guard {
  const maxDrift = options.maxDrift ?? 0.1;
  let previousTokens: Set<string> | null = null;

  return {
    name: 'multi-turn-coherence',
    version: '0.1.0',
    description:
      'Tracks topic coherence across consecutive outputs',
    category: 'content',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const current = tokenize(text);
      let similarity = 1;
      let triggered = false;

      if (previousTokens !== null) {
        similarity = jaccardSimilarity(
          previousTokens,
          current,
        );
        triggered = similarity < maxDrift;
      }

      previousTokens = current;

      return {
        guardName: 'multi-turn-coherence',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: { similarity: Math.round(similarity * 100) / 100 },
      };
    },
  };
}
