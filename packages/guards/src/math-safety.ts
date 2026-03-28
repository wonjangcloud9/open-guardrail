import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MathSafetyOptions {
  action: 'block' | 'warn';
}

const DIVISION_BY_ZERO = /(?:\/\s*0(?:\s|$|[.,;)])|divid(?:e|ed|ing)\s+by\s+zero)/i;
const OVERFLOW_PATTERN = /(?:10\s*\*\*\s*\d{4,}|2\s*\*\*\s*\d{3,}|\d{20,})/;
const NAN_PATTERN = /(?:NaN|(?:^|\s)nan(?:\s|$)|not\s+a\s+number)/i;
const INFINITE_LOOP = /(?:while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)|infinite\s+loop)/i;
const SCI_NOTATION_ABUSE = /\d+[eE][+-]?\d{4,}/;

export function mathSafety(options: MathSafetyOptions): Guard {
  return {
    name: 'math-safety',
    version: '0.1.0',
    description: 'Validates mathematical content safety',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (DIVISION_BY_ZERO.test(text)) issues.push('division-by-zero');
      if (OVERFLOW_PATTERN.test(text)) issues.push('potential-overflow');
      if (NAN_PATTERN.test(text)) issues.push('nan-propagation');
      if (INFINITE_LOOP.test(text)) issues.push('infinite-loop');
      if (SCI_NOTATION_ABUSE.test(text)) issues.push('scientific-notation-abuse');

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'math-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
