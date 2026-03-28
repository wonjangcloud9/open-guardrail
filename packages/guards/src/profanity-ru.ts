import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanityRuOptions {
  action: 'block' | 'warn';
}

const WORDS: string[] = [
  'блядь', 'сука', 'хуй', 'пиздец', 'ебать',
  'мудак', 'дурак', 'козёл', 'дебил', 'тварь',
];

export function profanityRu(options: ProfanityRuOptions): Guard {
  return {
    name: 'profanity-ru',
    version: '0.1.0',
    description: 'Russian profanity detection',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched: string[] = [];

      for (const word of WORDS) {
        if (lower.includes(word)) matched.push(word);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'profanity-ru',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matched.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
