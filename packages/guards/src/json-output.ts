import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface JsonOutputOptions {
  action: 'block' | 'warn';
  requireKeys?: string[];
  maxDepth?: number;
}

function getDepth(obj: unknown, current: number = 0): number {
  if (typeof obj !== 'object' || obj === null) return current;
  let max = current;
  for (const val of Object.values(obj as Record<string, unknown>)) {
    const d = getDepth(val, current + 1);
    if (d > max) max = d;
  }
  return max;
}

export function jsonOutput(options: JsonOutputOptions): Guard {
  return {
    name: 'json-output',
    version: '0.1.0',
    description: 'Validate LLM output is valid JSON with required keys',
    category: 'format',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const trimmed = text.trim();
      const violations: string[] = [];

      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        return {
          guardName: 'json-output',
          passed: false,
          action: options.action,
          message: 'Output is not valid JSON',
          latencyMs: Math.round(performance.now() - start),
          details: { reason: 'LLM output could not be parsed as JSON' },
        };
      }

      if (options.requireKeys && typeof parsed === 'object' && parsed !== null) {
        const keys = Object.keys(parsed as Record<string, unknown>);
        for (const key of options.requireKeys) {
          if (!keys.includes(key)) {
            violations.push(`Missing required key: "${key}"`);
          }
        }
      }

      if (options.maxDepth !== undefined) {
        const depth = getDepth(parsed);
        if (depth > options.maxDepth) {
          violations.push(`JSON depth ${depth} exceeds max ${options.maxDepth}`);
        }
      }

      const triggered = violations.length > 0;

      return {
        guardName: 'json-output',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? violations.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { violations, reason: 'JSON output does not meet structural requirements' }
          : { parsed: true },
      };
    },
  };
}
