import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface IdempotentResponseOptions {
  action: 'block' | 'warn';
}

const TIMESTAMP_PATTERNS: RegExp[] = [
  /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)\b/i,
  /\b(?:today|now)\s+(?:is|at)\s+/i,
];

const TEMPORAL_PATTERNS: RegExp[] = [
  /\bjust\s+now\b/i,
  /\bright\s+now\b/i,
  /\bat\s+this\s+(?:very\s+)?moment\b/i,
  /\bcurrently\s+(?:it\s+is|the\s+time)\b/i,
  /\bas\s+of\s+(?:right\s+)?now\b/i,
  /\bat\s+the\s+time\s+of\s+(?:writing|this\s+response)\b/i,
];

const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

const RANDOM_NUMBER_RE = /\b(?:random|generated)\s*(?::?\s*)\d+\b/i;

export function idempotentResponse(options: IdempotentResponseOptions): Guard {
  return {
    name: 'idempotent-response',
    version: '0.1.0',
    description: 'Detects potentially non-idempotent responses',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (TIMESTAMP_PATTERNS.some((p) => p.test(text))) {
        issues.push('timestamp_present');
      }
      if (TEMPORAL_PATTERNS.some((p) => p.test(text))) {
        issues.push('temporal_reference');
      }
      if (UUID_RE.test(text)) {
        issues.push('uuid_present');
      }
      if (RANDOM_NUMBER_RE.test(text)) {
        issues.push('random_number');
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'idempotent-response',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
