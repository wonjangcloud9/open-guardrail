import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface NumberPrecisionOptions {
  action: 'block' | 'warn';
  maxDecimalPlaces?: number;
}

const DECIMAL_RE = /\b\d+\.(\d+)\b/g;

export function numberPrecision(options: NumberPrecisionOptions): Guard {
  const maxDp = options.maxDecimalPlaces ?? 6;

  return {
    name: 'number-precision',
    version: '0.1.0',
    description: 'Validates number precision in output',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const decimalLengths: number[] = [];

      DECIMAL_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = DECIMAL_RE.exec(text)) !== null) {
        const dp = match[1].length;
        decimalLengths.push(dp);
        if (dp > maxDp) {
          issues.push(`excessive_precision:${match[0]}(${dp}dp)`);
        }
      }

      if (decimalLengths.length >= 2) {
        const unique = new Set(decimalLengths);
        const range = Math.max(...decimalLengths) - Math.min(...decimalLengths);
        if (unique.size > 2 && range > 3) {
          issues.push('inconsistent_precision');
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'number-precision',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, maxDecimalPlaces: maxDp } : undefined,
      };
    },
  };
}
