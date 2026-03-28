import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseStructureJsonOptions {
  action: 'block' | 'warn';
  requiredKeys?: string[];
}

export function responseStructureJson(options: ResponseStructureJsonOptions): Guard {
  const requiredKeys = options.requiredKeys ?? [];

  return {
    name: 'response-structure-json',
    version: '0.1.0',
    description: 'Validates expected JSON structure in responses',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      let parsed: unknown;
      try {
        parsed = JSON.parse(text.trim());
      } catch {
        issues.push('invalid-json');
        return {
          guardName: 'response-structure-json',
          passed: false,
          action: options.action,
          score: 1.0,
          latencyMs: Math.round(performance.now() - start),
          details: { issues },
        };
      }

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        issues.push('not-object');
      } else {
        const obj = parsed as Record<string, unknown>;
        for (const key of requiredKeys) {
          if (!(key in obj)) {
            issues.push(`missing-key:${key}`);
          } else if (obj[key] === null || obj[key] === undefined) {
            issues.push(`null-value:${key}`);
          }
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / requiredKeys.length || 1, 1.0) : 0;

      return {
        guardName: 'response-structure-json',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
