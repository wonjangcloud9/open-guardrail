import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ApiEndpointSafetyOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /\/(admin|debug|internal|_debug|_admin|_internal)\//i,
  /\/(api\/v0|api\/beta|api\/test|api\/dev)\b/i,
  /localhost:\d+\/api/i,
  /127\.0\.0\.1:\d+\/api/i,
  /\/api\/[^v\s][^/\s]*(?:\/[^/\s]+)*(?!\bv\d)/i,
  /\/(swagger|graphql-playground|phpmyadmin|actuator)\b/i,
  /\/api(?!\/v\d)[^/\s]*\s/i,
  /\/(health|metrics|status|info|env)(?:\/|\s|$)/i,
  /\/(\.env|\.git|\.config|wp-admin)/i,
  /\/api\/deprecated\//i,
];

export function apiEndpointSafety(options: ApiEndpointSafetyOptions): Guard {
  return {
    name: 'api-endpoint-safety',
    version: '0.1.0',
    description: 'Validates API endpoint references for safety',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'api-endpoint-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
