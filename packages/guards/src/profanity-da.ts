import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanityDaOptions {
  action: 'block' | 'warn';
}

const PROFANITY_PATTERNS: RegExp[] = [
  /(?:^|\s)lort(?:\s|$|[.,!?])/i,
  /(?:^|\s)pis(?:\s|$|[.,!?])/i,
  /(?:^|\s)fanden(?:\s|$|[.,!?])/i,
  /(?:^|\s)helvede(?:\s|$|[.,!?])/i,
  /(?:^|\s)røv(?:\s|$|[.,!?])/i,
  /(?:^|\s)luder(?:\s|$|[.,!?])/i,
  /(?:^|\s)pikansjos(?:\s|$|[.,!?])/i,
  /(?:^|\s)kraftedeme(?:\s|$|[.,!?])/i,
  /(?:^|\s)skid(?:\s|$|[.,!?])/i,
  /(?:^|\s)idiot(?:\s|$|[.,!?])/i,
];

export function profanityDa(options: ProfanityDaOptions): Guard {
  return {
    name: 'profanity-da',
    version: '0.1.0',
    description: 'Detects Danish profanity',
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
        guardName: 'profanity-da',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
