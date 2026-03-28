import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseFormatJsonOptions {
  action: 'block' | 'warn';
  maxDepth?: number;
  maxArrayLength?: number;
  requiredFields?: string[];
}

function measureDepth(obj: unknown, current = 0): number {
  if (current > 100) return current;
  if (typeof obj === 'object' && obj !== null) {
    let max = current + 1;
    for (const val of Object.values(obj)) {
      max = Math.max(max, measureDepth(val, current + 1));
    }
    return max;
  }
  return current;
}

function checkArrayLengths(obj: unknown, maxLen: number): boolean {
  if (Array.isArray(obj)) {
    if (obj.length > maxLen) return true;
    return obj.some((item) => checkArrayLengths(item, maxLen));
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).some((v) => checkArrayLengths(v, maxLen));
  }
  return false;
}

export function responseFormatJson(options: ResponseFormatJsonOptions): Guard {
  const maxDepth = options.maxDepth ?? 10;
  const maxArrayLen = options.maxArrayLength ?? 1000;

  return {
    name: 'response-format-json',
    version: '0.1.0',
    description: 'Validates JSON responses for structure and constraints',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        issues.push('invalid_json');
        return {
          guardName: 'response-format-json',
          passed: false,
          action: options.action,
          score: 1.0,
          latencyMs: Math.round(performance.now() - start),
          details: { issues },
        };
      }

      const depth = measureDepth(parsed);
      if (depth > maxDepth) {
        issues.push(`depth_exceeded:${depth}`);
      }

      if (checkArrayLengths(parsed, maxArrayLen)) {
        issues.push('array_length_exceeded');
      }

      if (options.requiredFields && typeof parsed === 'object' && parsed !== null) {
        for (const field of options.requiredFields) {
          if (!(field in (parsed as Record<string, unknown>))) {
            issues.push(`missing_field:${field}`);
          }
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'response-format-json',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
