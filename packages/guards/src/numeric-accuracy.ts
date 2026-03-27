import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface NumericAccuracyOptions {
  action: 'block' | 'warn';
  /** Known facts: key-value pairs of label -> expected number */
  facts?: Record<string, number>;
  /** Tolerance ratio (default 0.1 = 10%) */
  tolerance?: number;
}

export function numericAccuracy(options: NumericAccuracyOptions): Guard {
  const facts = options.facts ?? {};
  const tolerance = options.tolerance ?? 0.1;

  return {
    name: 'numeric-accuracy',
    version: '0.1.0',
    description: 'Validates numeric claims against known facts',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];
      const lower = text.toLowerCase();
      for (const [label, expected] of Object.entries(facts)) {
        if (!lower.includes(label.toLowerCase())) continue;
        const numbers = text.match(/[\d,]+\.?\d*/g) ?? [];
        for (const numStr of numbers) {
          const num = parseFloat(numStr.replace(/,/g, ''));
          if (isNaN(num)) continue;
          if (Math.abs(num - expected) / Math.max(Math.abs(expected), 1) > tolerance) {
            violations.push(`${label}: expected ~${expected}, found ${num}`);
          }
        }
      }
      const triggered = violations.length > 0;
      return { guardName: 'numeric-accuracy', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { violations } : undefined };
    },
  };
}
