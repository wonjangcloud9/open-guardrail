import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanityItOptions {
  action: 'block' | 'warn';
}

const WORDS: string[] = [
  'cazzo', 'merda', 'stronzo', 'vaffanculo', 'puttana',
  'minchia', 'figa', 'coglione', 'bastardo', 'porco',
];

export function profanityIt(options: ProfanityItOptions): Guard {
  return {
    name: 'profanity-it',
    version: '0.1.0',
    description: 'Italian profanity detection',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched: string[] = [];

      for (const word of WORDS) {
        const re = new RegExp(`\\b${word}\\b`, 'i');
        if (re.test(lower)) matched.push(word);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'profanity-it',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matched.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
