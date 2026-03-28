import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ApiResponseTimeOptions {
  action: 'block' | 'warn';
}

const UNREALISTIC_PATTERNS = [
  /\binstant(aneous)?\s+(response|processing|result)/i,
  /\breal[\s-]?time\b.*\b(analys|process|comput|translat)/i,
  /\b(zero|0)\s*(ms|millisecond|latency)\b/i,
  /\bno\s+(delay|latency|wait)\b/i,
  /\bimmediate(ly)?\s+(process|analyz|translat|comput)/i,
];

const SLA_VIOLATION_PATTERNS = [
  /\bguarantee[ds]?\s+(100%\s+)?(uptime|availability)/i,
  /\b(99\.999+|100)%\s+(uptime|availability)/i,
  /\bnever\s+(goes?\s+down|fail|timeout)/i,
  /\bzero\s+(downtime|failures)/i,
];

export function apiResponseTime(options: ApiResponseTimeOptions): Guard {
  return {
    name: 'api-response-time',
    version: '0.1.0',
    description: 'Detects unrealistic response time claims and SLA violations in text',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      for (const p of UNREALISTIC_PATTERNS) {
        if (p.test(text)) issues.push('unrealistic_claim');
      }
      for (const p of SLA_VIOLATION_PATTERNS) {
        if (p.test(text)) issues.push('sla_violation');
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'api-response-time',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(issues.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
