import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanityArOptions {
  action: 'block' | 'warn';
}

const WORDS: string[] = [
  'كلب', 'حمار', 'ابن الحرام', 'زبالة', 'منيوك',
  'عرص', 'شرموطة', 'خرا', 'كس', 'طيز',
];

export function profanityAr(options: ProfanityArOptions): Guard {
  return {
    name: 'profanity-ar',
    version: '0.1.0',
    description: 'Arabic profanity detection',
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
        guardName: 'profanity-ar',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matched.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
