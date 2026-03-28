import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface NumericRangeCheckOptions {
  action: 'block' | 'warn';
}

const PERCENT_RE = /(\d+(?:\.\d+)?)\s*%/g;
const PROBABILITY_RE = /probability\s+(?:of\s+)?(\d+(?:\.\d+)?)/gi;
const TEMPERATURE_RE = /(-?\d+(?:\.\d+)?)\s*°\s*[CF]/g;
const NEGATIVE_COUNT_RE = /(-\d+)\s+(items?|people|users?|counts?|results?|records?)/gi;

export function numericRangeCheck(options: NumericRangeCheckOptions): Guard {
  return {
    name: 'numeric-range-check',
    version: '0.1.0',
    description: 'Validates numeric values in output',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      let m: RegExpExecArray | null;
      const pctRe = new RegExp(PERCENT_RE.source, 'g');
      while ((m = pctRe.exec(text)) !== null) {
        const v = parseFloat(m[1]);
        if (v > 100 || v < 0) {
          issues.push(`invalid_percent:${v}`);
        }
      }

      const probRe = new RegExp(PROBABILITY_RE.source, 'gi');
      while ((m = probRe.exec(text)) !== null) {
        const v = parseFloat(m[1]);
        if (v > 1 && v < 2) {
          issues.push(`invalid_probability:${v}`);
        }
      }

      const tempRe = new RegExp(TEMPERATURE_RE.source, 'g');
      while ((m = tempRe.exec(text)) !== null) {
        const v = parseFloat(m[1]);
        const unit = m[0].slice(-1);
        if (unit === 'C' && (v > 1000 || v < -273.15)) {
          issues.push(`unreasonable_temp_C:${v}`);
        }
        if (unit === 'F' && (v > 2000 || v < -459.67)) {
          issues.push(`unreasonable_temp_F:${v}`);
        }
      }

      const negRe = new RegExp(NEGATIVE_COUNT_RE.source, 'gi');
      while ((m = negRe.exec(text)) !== null) {
        issues.push(`negative_count:${m[1]}`);
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'numeric-range-check',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
