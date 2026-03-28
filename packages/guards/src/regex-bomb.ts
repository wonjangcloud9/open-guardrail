import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RegexBombOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /\([^)]*[+*]\)[+*]/,
  /\([^)]*\|[^)]*\)\{/,
  /\(\.\*\)\{/,
  /\([^)]*[+*]\)\{[0-9,]+\}/,
  /\(\?:[^)]*[+*]\)[+*]/,
  /\([^)]*\+\)\+/,
  /\([^)]*\*\)\*/,
  /\(\.\+\)\+/,
  /\(\.\*\)\+/,
];

export function regexBomb(options: RegexBombOptions): Guard {
  return {
    name: 'regex-bomb',
    version: '0.1.0',
    description: 'Detects ReDoS patterns that cause catastrophic backtracking',
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
        guardName: 'regex-bomb',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
