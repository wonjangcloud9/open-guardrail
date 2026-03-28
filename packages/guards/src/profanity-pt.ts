import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ProfanityPtOptions {
  action: 'block' | 'warn';
}

const PROFANE_WORDS: string[] = [
  'merda', 'porra', 'caralho', 'foda-se',
  'filho da puta', 'corno', 'viado', 'buceta',
  'cacete', 'desgraçado',
];

export function profanityPt(options: ProfanityPtOptions): Guard {
  return {
    name: 'profanity-pt',
    version: '0.1.0',
    description: 'Portuguese/Brazilian profanity detection',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched: string[] = [];

      for (const phrase of PROFANE_WORDS) {
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = phrase.includes(' ')
          ? new RegExp(escaped, 'i')
          : new RegExp(`\\b${escaped}\\b`, 'i');
        if (re.test(lower)) matched.push(phrase);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'profanity-pt',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Portuguese profanity detected: ${matched.slice(0, 3).join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
