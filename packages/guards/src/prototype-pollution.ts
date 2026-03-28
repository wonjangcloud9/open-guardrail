import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PrototypePollutionOptions {
  action: 'block' | 'warn';
}

const POLLUTION_PATTERNS: RegExp[] = [
  /__proto__/,
  /constructor\s*\.\s*prototype/,
  /constructor\s*\[/,
  /Object\s*\.\s*assign\s*\(/,
  /Object\s*\.\s*defineProperty\s*\(/,
  /\["__proto__"\]/,
  /\['__proto__'\]/,
  /JSON\s*\.\s*parse\s*\(.*__proto__/,
  /prototype\s*\.\s*(?:toString|valueOf|hasOwnProperty)\s*=/,
  /\{\s*"__proto__"\s*:/,
];

export function prototypePollution(options: PrototypePollutionOptions): Guard {
  return {
    name: 'prototype-pollution',
    version: '0.1.0',
    description: 'Detects prototype pollution attempts',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of POLLUTION_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'prototype-pollution',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
