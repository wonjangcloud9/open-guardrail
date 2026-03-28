import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseWordDiversityOptions {
  action: 'block' | 'warn';
  minDiversity?: number;
}

const FILLER_WORDS = new Set([
  'basically', 'actually', 'literally', 'essentially',
  'obviously', 'clearly', 'simply', 'just', 'really',
  'very', 'quite', 'rather', 'somewhat',
]);

const CIRCULAR_PATTERNS = [
  /\b(\w{4,})\b.*\b\1\b.*\b\1\b.*\b\1\b/i,
];

export function responseWordDiversity(options: ResponseWordDiversityOptions): Guard {
  const minDiversity = options.minDiversity ?? 0.3;

  return {
    name: 'response-word-diversity',
    version: '0.1.0',
    description: 'Checks word diversity in AI responses',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      const words = text.toLowerCase().match(/\b[a-z]+\b/g) ?? [];
      if (words.length > 0) {
        const unique = new Set(words);
        const diversity = unique.size / words.length;
        if (diversity < minDiversity) {
          issues.push('low_diversity');
        }

        let fillerCount = 0;
        for (const w of words) {
          if (FILLER_WORDS.has(w)) fillerCount++;
        }
        if (fillerCount / words.length > 0.15) {
          issues.push('filler_overuse');
        }
      }

      for (const p of CIRCULAR_PATTERNS) {
        if (p.test(text)) issues.push('circular_reasoning');
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'response-word-diversity',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(issues.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
