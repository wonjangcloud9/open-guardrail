import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ModelDenialOptions {
  action: 'block' | 'warn';
  maxInputLength?: number;
  maxRepetitions?: number;
}

export function modelDenial(options: ModelDenialOptions): Guard {
  const maxLen = options.maxInputLength ?? 100000;
  const maxRep = options.maxRepetitions ?? 100;

  return {
    name: 'model-denial',
    version: '0.1.0',
    description: 'Detects model denial-of-service attempts',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (text.length > maxLen) {
        issues.push('input_too_long');
      }

      const repeatedChar = /(.)\1{99,}/.test(text);
      if (repeatedChar) {
        issues.push('repeated_characters');
      }

      const bracketDepth = countMaxNesting(text);
      if (bracketDepth > 50) {
        issues.push('deeply_nested');
      }

      const repetitivePattern = /(.{3,}?)\1{10,}/.test(text);
      if (repetitivePattern) {
        issues.push('repetitive_pattern');
      }

      const longWord = /\S{200,}/.test(text);
      if (longWord) {
        issues.push('extremely_long_word');
      }

      const repMatch = text.match(/(.)\1+/g) ?? [];
      const maxFound = repMatch.reduce(
        (m, s) => Math.max(m, s.length),
        0,
      );
      if (maxFound > maxRep) {
        issues.push('exceeds_max_repetitions');
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'model-denial',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}

function countMaxNesting(text: string): number {
  let max = 0;
  let depth = 0;
  for (const ch of text) {
    if (ch === '{' || ch === '[' || ch === '(') {
      depth++;
      if (depth > max) max = depth;
    } else if (ch === '}' || ch === ']' || ch === ')') {
      depth--;
    }
  }
  return max;
}
