import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface FactCheckSignalOptions {
  action: 'block' | 'warn';
  maxUnverifiedClaims?: number;
}

const PATTERNS: RegExp[] = [
  /\bstudies\s+show\b/i,
  /\bresearch\s+proves?\b/i,
  /\bscientists?\s+(say|found|discovered|confirmed)\b/i,
  /\baccording\s+to\s+(experts?|researchers?|scientists?)\b/i,
  /\b\d{1,3}(\.\d+)?%\s+(of|increase|decrease|more|less|higher|lower)\b/i,
  /\bin\s+\d{4},?\s+\w+/i,
  /\bit\s+is\s+(a\s+)?(?:well[- ]known|proven|established)\s+fact\b/i,
  /\beveryone\s+knows?\s+that\b/i,
  /\bclinical\s+trials?\s+(show|prove|demonstrate)\b/i,
  /\bstatistically\s+(significant|proven)\b/i,
];

export function factCheckSignal(options: FactCheckSignalOptions): Guard {
  const maxClaims = options.maxUnverifiedClaims ?? 3;

  return {
    name: 'fact-check-signal',
    version: '0.1.0',
    description: 'Detects signals that need fact-checking',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PATTERNS) {
        if (pattern.test(text)) matched.push(pattern.source);
      }

      const triggered = matched.length > maxClaims;
      const score = Math.min(matched.length / (maxClaims + 2), 1.0);

      return {
        guardName: 'fact-check-signal',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        message: triggered ? `Found ${matched.length} unverified claims (max ${maxClaims})` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: { claimsFound: matched.length, maxAllowed: maxClaims },
      };
    },
  };
}
