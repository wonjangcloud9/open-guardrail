import type {
  Guard,
  GuardResult,
  GuardContext,
} from '@open-guardrail/core';

interface BiasOptions {
  categories?: (
    | 'gender'
    | 'racial'
    | 'religious'
    | 'age'
  )[];
  action: 'block' | 'warn';
}

const BIAS_PATTERNS: Record<string, string[]> = {
  gender: [
    'women are too emotional',
    'men are better at',
    'women belong in the kitchen',
    'man up',
    'like a girl',
    'boys will be boys',
    'women can\'t',
    'men don\'t cry',
    'women should stay home',
    'not a job for women',
  ],
  racial: [
    'all black people',
    'all white people',
    'all asians are',
    'those people are',
    'typical of their race',
    'go back to your country',
    'they all look the same',
    'racial superiority',
  ],
  religious: [
    'all muslims are',
    'all christians are',
    'all jews are',
    'religion of violence',
    'godless people',
    'infidel',
    'heathen',
  ],
  age: [
    'too old to',
    'ok boomer',
    'old people can\'t',
    'millennials are lazy',
    'kids these days',
    'too young to understand',
    'senior moment',
    'past their prime',
  ],
};

const ALL_CATEGORIES = [
  'gender', 'racial', 'religious', 'age',
] as const;

export function bias(options: BiasOptions): Guard {
  const cats = options.categories ?? [...ALL_CATEGORIES];

  return {
    name: 'bias',
    version: '0.1.0',
    description: 'Pattern-based bias detection',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched: Record<string, string[]> = {};

      for (const cat of cats) {
        const patterns = BIAS_PATTERNS[cat] ?? [];
        const found: string[] = [];
        for (const p of patterns) {
          if (lower.includes(p)) found.push(p);
        }
        if (found.length > 0) matched[cat] = found;
      }

      const catKeys = Object.keys(matched);
      const triggered = catKeys.length > 0;

      return {
        guardName: 'bias',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedCategories: matched }
          : undefined,
      };
    },
  };
}
