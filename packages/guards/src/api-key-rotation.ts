import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ApiKeyRotationOptions {
  action: 'block' | 'warn';
}

const EXPIRED_PATTERNS: RegExp[] = [
  /\b(?:expired|revoked|deprecated)\s*(?:key|token|api[_-]?key|secret)/i,
  /(?:key|token|api[_-]?key)\s*(?:is\s+)?(?:expired|revoked|deprecated)/i,
  /(?:sk|pk|ak)[-_][a-zA-Z0-9]{16,}.*(?:2019|2020|2021|2022)/i,
  /(?:AKIA|AGPA|AIDA|AROA)[A-Z0-9]{16}.*(?:expired|old|deprecated)/i,
  /(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*["']?(?:expired|revoked|deprecated|old|invalid)/i,
  /\bdo\s+not\s+use\b.*(?:key|token|secret)/i,
  /\b(?:rotate|replace|renew)\s+(?:this\s+)?(?:key|token|secret)/i,
];

export function apiKeyRotation(options: ApiKeyRotationOptions): Guard {
  return {
    name: 'api-key-rotation',
    version: '0.1.0',
    description: 'Detects expired or deprecated API keys',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of EXPIRED_PATTERNS) {
        if (pattern.test(text)) matched.push(pattern.source);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'api-key-rotation',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matched.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
