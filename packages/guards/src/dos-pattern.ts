import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DosPatternOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /zip\s*bomb/i,
  /billion\s*laughs/i,
  /fork\s*bomb/i,
  /:\(\)\s*\{\s*:\|:\s*&\s*\}\s*;?\s*:/,
  /resource\s+exhaustion/i,
  /infinite\s+(recursion|loop|request)/i,
  /while\s*\(\s*true\s*\)/i,
  /memory\s+exhaustion/i,
  /stack\s+overflow\s+attack/i,
  /xml\s+entity\s+expansion/i,
  /decompression\s+bomb/i,
  /denial.of.service/i,
  /(?:repeat|generate|create)\s+(?:\d{6,}|infinite|unlimited)\s/i,
];

export function dosPattern(options: DosPatternOptions): Guard {
  return {
    name: 'dos-pattern',
    version: '0.1.0',
    description: 'Detects denial-of-service patterns',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'dos-pattern',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
