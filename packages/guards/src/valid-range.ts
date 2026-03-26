import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ValidRangeOptions {
  action: 'block' | 'warn';
  min?: number;
  max?: number;
  extractPattern?: string;
}

export function validRange(options: ValidRangeOptions): Guard {
  const pattern = options.extractPattern
    ? new RegExp(options.extractPattern, 'g')
    : /-?\d+(?:\.\d+)?/g;

  return {
    name: 'valid-range',
    version: '0.1.0',
    description: 'Validate numbers are within allowed range',
    category: 'format',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const re = new RegExp(pattern.source, pattern.flags);
      const matches = text.match(re);
      const outOfRange: { value: number; reason: string }[] = [];

      if (matches) {
        for (const m of matches) {
          const num = parseFloat(m);
          if (isNaN(num)) continue;
          if (options.min !== undefined && num < options.min) {
            outOfRange.push({ value: num, reason: `below min (${options.min})` });
          }
          if (options.max !== undefined && num > options.max) {
            outOfRange.push({ value: num, reason: `above max (${options.max})` });
          }
        }
      }

      const triggered = outOfRange.length > 0;

      return {
        guardName: 'valid-range',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { outOfRange } : undefined,
      };
    },
  };
}
