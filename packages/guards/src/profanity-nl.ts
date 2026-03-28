import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanityNlOptions {
  action: 'block' | 'warn';
}

const WORDS: string[] = [
  'godverdomme', 'kut', 'lul', 'hoer', 'klootzak',
  'eikel', 'kanker', 'tyfus', 'mongool', 'schoft',
];

export function profanityNl(options: ProfanityNlOptions): Guard {
  return {
    name: 'profanity-nl',
    version: '0.1.0',
    description: 'Dutch profanity detection',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched: string[] = [];

      for (const word of WORDS) {
        const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (re.test(lower)) matched.push(word);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'profanity-nl',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Dutch profanity detected' } : undefined,
      };
    },
  };
}
