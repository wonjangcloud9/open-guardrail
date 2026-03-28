import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface UnicodeSafetyOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /[\u202A\u202B\u202C\u202D\u202E]/,
  /[\u2066\u2067\u2068\u2069]/,
  /[\u200E\u200F]/,
  /[\uFEFF](?!^)/,
  /[\u{E0001}-\u{E007F}]/u,
  /[\uFE00-\uFE0F]/,
  /[\u200B\u200C\u200D]/,
  /[\u2060\u2061\u2062\u2063\u2064]/,
  /[\u00AD]/,
  /[\u034F\u115F\u1160\u17B4\u17B5]/,
];

export function unicodeSafety(options: UnicodeSafetyOptions): Guard {
  return {
    name: 'unicode-safety',
    version: '0.1.0',
    description: 'Comprehensive Unicode safety checks',
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
        guardName: 'unicode-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
