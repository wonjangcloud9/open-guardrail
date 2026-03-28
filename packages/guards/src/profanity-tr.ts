import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanityTrOptions {
  action: 'block' | 'warn';
}

const WORDS: string[] = [
  'amk', 'orospu', 'siktir', 'piç', 'göt',
  'yarrak', 'sikerim', 'bok', 'hıyar', 'anan',
];

export function profanityTr(options: ProfanityTrOptions): Guard {
  return {
    name: 'profanity-tr',
    version: '0.1.0',
    description: 'Turkish profanity detection',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched: string[] = [];

      for (const word of WORDS) {
        const re = new RegExp(`(?:^|\\s)${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`, 'i');
        if (re.test(lower)) matched.push(word);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'profanity-tr',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Turkish profanity detected' } : undefined,
      };
    },
  };
}
