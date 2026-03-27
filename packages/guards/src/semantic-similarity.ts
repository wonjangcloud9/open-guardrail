import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SemanticSimilarityOptions {
  action: 'block' | 'warn';
  /** Reference texts to compare against */
  references: string[];
  /** Minimum similarity score 0-1 to trigger (default 0.8) */
  threshold?: number;
  /** Mode: 'deny' blocks similar, 'require' blocks dissimilar */
  mode?: 'deny' | 'require';
}

function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  const tokens = new Set<string>();
  for (const w of words) tokens.add(w);
  for (let i = 0; i < words.length - 1; i++) {
    tokens.add(`${words[i]} ${words[i + 1]}`);
  }
  return tokens;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
}

export function semanticSimilarity(options: SemanticSimilarityOptions): Guard {
  const threshold = options.threshold ?? 0.8;
  const mode = options.mode ?? 'deny';
  const refTokens = options.references.map(tokenize);

  return {
    name: 'semantic-similarity',
    version: '0.1.0',
    description: 'Compares text similarity against reference texts using token overlap',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const inputTokens = tokenize(text);
      let maxScore = 0;
      let bestRef = -1;

      for (let i = 0; i < refTokens.length; i++) {
        const score = jaccardSimilarity(inputTokens, refTokens[i]);
        if (score > maxScore) {
          maxScore = score;
          bestRef = i;
        }
      }

      const triggered = mode === 'deny'
        ? maxScore >= threshold
        : maxScore < threshold;

      return {
        guardName: 'semantic-similarity',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: Math.round(maxScore * 100) / 100,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { maxSimilarity: maxScore, bestMatchIndex: bestRef, threshold, mode }
          : undefined,
      };
    },
  };
}
