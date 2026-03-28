import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanityHiOptions {
  action: 'block' | 'warn';
}

const WORDS: string[] = [
  'बकवास', 'भड़वा', 'हरामी', 'कुत्ता', 'गधा',
  'चूतिया', 'मादरचोद', 'बहनचोद', 'लौड़ा', 'गांड',
];

export function profanityHi(options: ProfanityHiOptions): Guard {
  return {
    name: 'profanity-hi',
    version: '0.1.0',
    description: 'Hindi profanity detection',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const word of WORDS) {
        if (text.includes(word)) matched.push(word);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'profanity-hi',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matched.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
