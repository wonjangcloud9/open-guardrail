import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanitySvOptions {
  action: 'block' | 'warn';
}

const PROFANITY_PATTERNS: RegExp[] = [
  /(?:^|\s)jävla(?:\s|$|[.,!?])/i,
  /(?:^|\s)fan(?:\s|$|[.,!?])/i,
  /(?:^|\s)helvete(?:\s|$|[.,!?])/i,
  /(?:^|\s)skit(?:\s|$|[.,!?])/i,
  /(?:^|\s)fitta(?:\s|$|[.,!?])/i,
  /(?:^|\s)kuk(?:\s|$|[.,!?])/i,
  /(?:^|\s)hora(?:\s|$|[.,!?])/i,
  /(?:^|\s)knull(?:\s|$|[.,!?])/i,
  /(?:^|\s)svin(?:\s|$|[.,!?])/i,
  /(?:^|\s)idiot(?:\s|$|[.,!?])/i,
];

export function profanitySv(options: ProfanitySvOptions): Guard {
  return {
    name: 'profanity-sv',
    version: '0.1.0',
    description: 'Detects Swedish profanity',
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
        guardName: 'profanity-sv',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
