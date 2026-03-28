import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanityIdOptions {
  action: 'block' | 'warn';
}

const WORDS: string[] = [
  'bangsat', 'anjing', 'babi', 'kampret', 'bajingan',
  'tolol', 'bego', 'goblok', 'setan', 'keparat',
];

export function profanityId(options: ProfanityIdOptions): Guard {
  return {
    name: 'profanity-id',
    version: '0.1.0',
    description: 'Indonesian profanity detection',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched: string[] = [];

      for (const word of WORDS) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`\\b${escaped}\\b`, 'i');
        if (re.test(lower)) matched.push(word);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'profanity-id',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matched.length / 3, 1.0) : 0,
        message: triggered ? `Indonesian profanity detected: ${matched.slice(0, 3).join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains Indonesian profanity' } : undefined,
      };
    },
  };
}
