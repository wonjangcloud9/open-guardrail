import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanityThOptions {
  action: 'block' | 'warn';
}

const WORDS: string[] = [
  'เหี้ย', 'สัตว์', 'ควาย', 'อีดอก', 'ไอ้บ้า',
  'สันดาน', 'อีสัตว์', 'ชาติชั่ว', 'ระยำ', 'อีห่า',
];

export function profanityTh(options: ProfanityThOptions): Guard {
  return {
    name: 'profanity-th',
    version: '0.1.0',
    description: 'Thai profanity detection',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const word of WORDS) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`);
        if (re.test(text)) matched.push(word);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'profanity-th',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matched.length / 3, 1.0) : 0,
        message: triggered ? `Thai profanity detected: ${matched.slice(0, 3).join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains Thai profanity' } : undefined,
      };
    },
  };
}
