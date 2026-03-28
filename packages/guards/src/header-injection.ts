import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface HeaderInjectionOptions {
  action: 'block' | 'warn';
}

const HEADER_PATTERNS: RegExp[] = [
  /\r\n/,
  /%0[dD]%0[aA]/,
  /\\r\\n/,
  /Host:\s*[^\s]+/i,
  /X-Forwarded-For:\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i,
  /X-Forwarded-Host:/i,
  /Set-Cookie:\s*[^\s]*=/i,
  /Cookie:\s*[^\s]*=[^\s]*/i,
  /Content-Type:\s*[^\s]+.*\r?\n/i,
  /Transfer-Encoding:\s*chunked/i,
];

export function headerInjection(options: HeaderInjectionOptions): Guard {
  return {
    name: 'header-injection',
    version: '0.1.0',
    description: 'Detects HTTP header injection attempts',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of HEADER_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'header-injection',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
