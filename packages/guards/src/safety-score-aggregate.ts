import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface SafetyScoreAggregateOptions {
  action: 'block' | 'warn';
  threshold?: number;
}

const CATEGORIES: Record<string, string[]> = {
  violence: [
    'kill', 'murder', 'attack', 'assault',
    'weapon', 'bomb', 'shoot', 'stab',
  ],
  hate: [
    'hate', 'racist', 'bigot', 'supremac',
    'slur', 'discriminat', 'xenophob',
  ],
  self_harm: [
    'suicide', 'self-harm', 'cut myself',
    'end my life', 'overdose', 'hurt myself',
  ],
  sexual: [
    'explicit', 'pornograph', 'nude',
    'sexual content', 'obscene',
  ],
};

const CATEGORY_COUNT = Object.keys(CATEGORIES).length;

function scoreCategory(
  text: string,
  terms: string[],
): number {
  const lower = text.toLowerCase();
  const hits = terms.filter((t) => lower.includes(t)).length;
  return Math.min(hits / terms.length, 1);
}

export function safetyScoreAggregate(
  options: SafetyScoreAggregateOptions,
): Guard {
  const threshold = options.threshold ?? 0.3;

  return {
    name: 'safety-score-aggregate',
    version: '0.1.0',
    description:
      'Composite safety score across violence, hate, self-harm, and sexual categories',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const scores: Record<string, number> = {};
      let total = 0;

      for (const [cat, terms] of Object.entries(CATEGORIES)) {
        const s = scoreCategory(text, terms);
        scores[cat] = Math.round(s * 100) / 100;
        total += s;
      }

      const composite =
        Math.round((total / CATEGORY_COUNT) * 100) / 100;
      const triggered = composite >= threshold;

      return {
        guardName: 'safety-score-aggregate',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: { scores, composite, threshold },
      };
    },
  };
}
