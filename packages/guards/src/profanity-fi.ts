import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanityFiOptions {
  action: 'block' | 'warn';
}

const PROFANITY_PATTERNS: RegExp[] = [
  /(?:^|\s)perkele(?:\s|$|[.,!?])/i,
  /(?:^|\s)vittu(?:\s|$|[.,!?])/i,
  /(?:^|\s)saatana(?:\s|$|[.,!?])/i,
  /(?:^|\s)paska(?:\s|$|[.,!?])/i,
  /(?:^|\s)helvetti(?:\s|$|[.,!?])/i,
  /(?:^|\s)kusipää(?:\s|$|[.,!?])/i,
  /(?:^|\s)mulkku(?:\s|$|[.,!?])/i,
  /(?:^|\s)huora(?:\s|$|[.,!?])/i,
  /(?:^|\s)kyrpä(?:\s|$|[.,!?])/i,
  /(?:^|\s)runkkari(?:\s|$|[.,!?])/i,
];

export function profanityFi(options: ProfanityFiOptions): Guard {
  return {
    name: 'profanity-fi',
    version: '0.1.0',
    description: 'Detects Finnish profanity',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PROFANITY_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'profanity-fi',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
