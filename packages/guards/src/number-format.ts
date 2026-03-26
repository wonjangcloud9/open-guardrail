import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface NumberFormatOptions {
  action: 'block' | 'warn';
  allowDecimals?: boolean;
  allowNegative?: boolean;
  allowPercentage?: boolean;
  allowCurrency?: boolean;
}

const CURRENCY_RE = /[$\u20AC\u00A3\u00A5\u20A9\u5143]\s*[\d,.]+/g;
const PERCENTAGE_RE = /\d+(?:\.\d+)?%/g;
const NEGATIVE_RE = /-\d+(?:\.\d+)?/g;
const DECIMAL_RE = /\d+\.\d+/g;

export function numberFormat(options: NumberFormatOptions): Guard {
  const allowDecimals = options.allowDecimals ?? true;
  const allowNegative = options.allowNegative ?? true;
  const allowPercentage = options.allowPercentage ?? true;
  const allowCurrency = options.allowCurrency ?? true;

  return {
    name: 'number-format',
    version: '0.1.0',
    description: 'Validate number formats in text',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];

      if (!allowCurrency && CURRENCY_RE.test(text)) {
        violations.push('Currency values not allowed');
      }
      if (!allowPercentage && PERCENTAGE_RE.test(text)) {
        violations.push('Percentages not allowed');
      }
      if (!allowNegative && NEGATIVE_RE.test(text)) {
        violations.push('Negative numbers not allowed');
      }
      if (!allowDecimals && DECIMAL_RE.test(text)) {
        violations.push('Decimal numbers not allowed');
      }

      const triggered = violations.length > 0;

      return {
        guardName: 'number-format',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? violations.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { violations, reason: 'Number format does not meet requirements' }
          : undefined,
      };
    },
  };
}
