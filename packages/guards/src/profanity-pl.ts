import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanityPlOptions {
  action: 'block' | 'warn';
}

const WORDS: string[] = [
  'kurwa', 'cholera', 'pierdolę', 'dupek', 'skurwysyn',
  'gnój', 'idiota', 'debil', 'gówno', 'zasraniec',
];

export function profanityPl(options: ProfanityPlOptions): Guard {
  return {
    name: 'profanity-pl',
    version: '0.1.0',
    description: 'Polish profanity detection',
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
        guardName: 'profanity-pl',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Polish profanity detected' } : undefined,
      };
    },
  };
}
