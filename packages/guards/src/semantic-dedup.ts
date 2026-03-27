import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface SemanticDedupOptions {
  action: 'block' | 'warn';
  maxHistory?: number;
  threshold?: number;
}

function trigrams(text: string): Set<string> {
  const s = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const set = new Set<string>();
  for (let i = 0; i <= s.length - 3; i++) {
    set.add(s.slice(i, i + 3));
  }
  return set;
}

function trigramSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) {
    if (b.has(t)) inter++;
  }
  return inter / (a.size + b.size - inter);
}

export function semanticDedup(options: SemanticDedupOptions): Guard {
  const maxHistory = options.maxHistory ?? 10;
  const threshold = options.threshold ?? 0.9;
  const history: Array<{ text: string; tg: Set<string> }> = [];

  return {
    name: 'semantic-dedup',
    version: '0.1.0',
    description: 'Detect near-duplicate responses using trigram similarity',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const currentTg = trigrams(text);
      let bestScore = 0;
      let matchIdx = -1;

      for (let i = 0; i < history.length; i++) {
        const sim = trigramSimilarity(currentTg, history[i].tg);
        if (sim > bestScore) {
          bestScore = sim;
          matchIdx = i;
        }
      }

      const triggered = bestScore >= threshold;

      history.push({ text: text.slice(0, 200), tg: currentTg });
      if (history.length > maxHistory) history.shift();

      return {
        guardName: 'semantic-dedup',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: Math.round(bestScore * 100) / 100,
        message: triggered
          ? `Near-duplicate detected (similarity: ${(bestScore * 100).toFixed(1)}%)`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { similarity: bestScore, matchIndex: matchIdx, historySize: history.length }
          : undefined,
      };
    },
  };
}
