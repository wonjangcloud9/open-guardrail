import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ApiResponseValidateOptions {
  action: 'block' | 'warn';
  /** Required status codes or success indicators */
  requireFields?: string[];
  /** Block if error patterns detected */
  blockErrors?: boolean;
}

const ERROR_PATTERNS = [
  /\b(?:error|exception|failure|fatal|critical)\b/i,
  /\b(?:500|502|503|504)\s+(?:internal\s+server|bad\s+gateway|service\s+unavailable)/i,
  /\b(?:timeout|connection\s+refused|ECONNREFUSED|ETIMEDOUT)\b/i,
  /\bstack\s*trace\b/i,
];

export function apiResponseValidate(options: ApiResponseValidateOptions): Guard {
  const blockErrors = options.blockErrors ?? true;
  const required = options.requireFields ?? [];

  return {
    name: 'api-response-validate',
    version: '0.1.0',
    description: 'Validates API response structure and detects error leakage',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];
      if (blockErrors) {
        for (const p of ERROR_PATTERNS) { const m = text.match(p); if (m) violations.push(`Error pattern: ${m[0]}`); }
      }
      if (required.length > 0) {
        try {
          const parsed = JSON.parse(text.trim());
          if (typeof parsed === 'object' && parsed !== null) {
            for (const f of required) { if (!(f in parsed)) violations.push(`Missing field: ${f}`); }
          }
        } catch { /* not JSON, skip field check */ }
      }
      const triggered = violations.length > 0;
      return { guardName: 'api-response-validate', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { violations } : undefined };
    },
  };
}
