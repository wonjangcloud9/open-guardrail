import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ProfanityEsOptions {
  action: 'block' | 'warn';
}

const PROFANE_WORDS: string[] = [
  'mierda', 'puta', 'joder', 'coño', 'culo',
  'hostia', 'gilipollas', 'capullo', 'cabrón',
  'pendejo', 'chingar', 'verga',
];

export function profanityEs(options: ProfanityEsOptions): Guard {
  return {
    name: 'profanity-es',
    version: '0.1.0',
    description: 'Spanish profanity detection',
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
        guardName: 'profanity-es',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Spanish profanity detected: ${matched.slice(0, 3).join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
