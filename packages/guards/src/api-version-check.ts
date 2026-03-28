import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ApiVersionCheckOptions {
  action: 'block' | 'warn';
}

const DEPRECATED_PATTERNS: RegExp[] = [
  /api[\/\-_]?v[0-1](?:\b|\/)/i,
  /version\s*[:=]\s*['"]?[0-1]\b/i,
  /sdk[\/\-_]?v?[0-2]\.\d+/i,
  /api-version\s*=\s*20(?:1[0-9]|20|21)/i,
  /deprecated.*(?:api|endpoint|version)/i,
  /(?:api|endpoint|version).*deprecated/i,
  /v1\s*(?:is|was|has been)\s*(?:removed|sunset|eol)/i,
  /end[- ]?of[- ]?life\s+(?:api|version)/i,
];

export function apiVersionCheck(options: ApiVersionCheckOptions): Guard {
  return {
    name: 'api-version-check',
    version: '0.1.0',
    description: 'Validates API version references and detects deprecated versions',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of DEPRECATED_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'api-version-check',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
