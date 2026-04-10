import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ApiResponseContractOptions {
  action: 'block' | 'warn';
  requiredFields?: string[];
}

const SENSITIVE_KEYS = ['password', 'secret', 'token', 'api_key', 'apikey', 'private_key'];
const MAX_FIELD_LENGTH = 10000;

function checkObject(obj: Record<string, unknown>, requiredFields: string[]): string[] {
  const issues: string[] = [];

  // Check for status/data/result presence
  const hasStructure = 'status' in obj || 'data' in obj || 'result' in obj;
  if (!hasStructure) issues.push('missing-status-or-data-field');

  // Required fields check
  for (const f of requiredFields) {
    if (!(f in obj)) {
      issues.push(`missing-required:${f}`);
    } else if (obj[f] === null || obj[f] === undefined) {
      issues.push(`null-required:${f}`);
    }
  }

  // Check for sensitive keys and field size
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      issues.push(`sensitive-key:${key}`);
    }
    if (typeof val === 'string' && val.length > MAX_FIELD_LENGTH) {
      issues.push(`oversized-field:${key}`);
    }
  }

  return issues;
}

export function apiResponseContract(options: ApiResponseContractOptions): Guard {
  return {
    name: 'api-response-contract',
    version: '0.1.0',
    description: 'Validate structured API responses match expected contract',
    category: 'format',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text.trim());
      } catch {
        // Not JSON — guard does not apply
        return {
          guardName: 'api-response-contract',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return {
          guardName: 'api-response-contract',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const issues = checkObject(parsed as Record<string, unknown>, options.requiredFields ?? []);
      const triggered = issues.length > 0;
      return {
        guardName: 'api-response-contract',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `API contract issues: ${issues.join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
