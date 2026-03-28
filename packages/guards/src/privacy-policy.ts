import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PrivacyPolicyOptions {
  action: 'block' | 'warn';
  checkCoppa?: boolean;
  checkCcpa?: boolean;
}

const BASE_PATTERNS: RegExp[] = [
  /sell\s+your\s+data/i,
  /share\s+with\s+third\s+parties\s+without\s+notice/i,
  /track\s+without\s+consent/i,
  /no\s+opt[\s-]?out/i,
  /cannot\s+request\s+deletion/i,
  /permanent\s+cookie/i,
  /fingerprinting\s+without\s+disclosure/i,
];

const COPPA_PATTERNS: RegExp[] = [
  /collect\s+data\s+from\s+children\s+under\s+13/i,
  /children\s+under\s+13/i,
];

const CCPA_PATTERNS: RegExp[] = [
  /no\s+right\s+to\s+know/i,
  /cannot\s+opt[\s-]?out\s+of\s+sale/i,
  /deny\s+deletion\s+request/i,
];

export function privacyPolicy(options: PrivacyPolicyOptions): Guard {
  const checkCoppa = options.checkCoppa ?? true;
  const checkCcpa = options.checkCcpa ?? true;

  const patterns = [
    ...BASE_PATTERNS,
    ...(checkCoppa ? COPPA_PATTERNS : []),
    ...(checkCcpa ? CCPA_PATTERNS : []),
  ];

  return {
    name: 'privacy-policy',
    version: '0.1.0',
    description: 'Checks for privacy policy compliance violations',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of patterns) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'privacy-policy',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
