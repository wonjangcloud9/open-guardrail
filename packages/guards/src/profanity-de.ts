import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ProfanityDeOptions {
  action: 'block' | 'warn';
}

const PROFANE_WORDS: string[] = [
  'scheiße', 'arschloch', 'hurensohn', 'wichser',
  'fotze', 'drecksack', 'bastard', 'vollidiot',
  'penner', 'missgeburt',
];

export function profanityDe(options: ProfanityDeOptions): Guard {
  return {
    name: 'profanity-de',
    version: '0.1.0',
    description: 'German profanity detection',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched: string[] = [];

      for (const word of PROFANE_WORDS) {
        const re = new RegExp(
          `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          'i',
        );
        if (re.test(lower)) matched.push(word);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'profanity-de',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `German profanity detected: ${matched.slice(0, 3).join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
