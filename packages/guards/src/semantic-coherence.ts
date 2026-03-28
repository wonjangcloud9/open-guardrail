import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SemanticCoherenceOptions {
  action: 'block' | 'warn';
}

const CONTRADICTION_PAIRS: [RegExp, RegExp][] = [
  [/\bis\s+true\b/i, /\bis\s+false\b/i],
  [/\balways\b/i, /\bnever\b/i],
  [/\byes\b/i, /\bno\b/i],
  [/\bincreased?\b/i, /\bdecreased?\b/i],
];

function getSentences(text: string): string[] {
  return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 3);
}

function wordSaladScore(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  if (words.length < 5) return 0;
  const unique = new Set(words);
  const ratio = unique.size / words.length;
  if (ratio > 0.95 && words.length > 20) return 0.8;
  return 0;
}

export function semanticCoherence(options: SemanticCoherenceOptions): Guard {
  return {
    name: 'semantic-coherence',
    version: '0.1.0',
    description: 'Basic semantic coherence check for responses',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const sentences = getSentences(text);

      for (let i = 0; i < sentences.length - 1; i++) {
        const a = sentences[i];
        const b = sentences[i + 1];
        for (const [p1, p2] of CONTRADICTION_PAIRS) {
          if ((p1.test(a) && p2.test(b)) || (p2.test(a) && p1.test(b))) {
            issues.push('contradiction');
            break;
          }
        }
      }

      const salad = wordSaladScore(text);
      if (salad > 0.5) issues.push('word-salad');

      const triggered = issues.length > 0;
      const score = triggered ? Math.min((issues.length * 0.4) + salad, 1.0) : 0;

      return {
        guardName: 'semantic-coherence',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
