import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanityViOptions {
  action: 'block' | 'warn';
}

const WORDS: string[] = [
  'đụ', 'địt', 'lồn', 'cặc', 'đéo',
  'mẹ mày', 'đồ chó', 'ngu', 'khốn', 'đần',
];

export function profanityVi(options: ProfanityViOptions): Guard {
  return {
    name: 'profanity-vi',
    version: '0.1.0',
    description: 'Vietnamese profanity detection',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched: string[] = [];

      for (const word of WORDS) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`, 'i');
        if (re.test(lower)) matched.push(word);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'profanity-vi',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matched.length / 3, 1.0) : 0,
        message: triggered ? `Vietnamese profanity detected: ${matched.slice(0, 3).join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains Vietnamese profanity' } : undefined,
      };
    },
  };
}
