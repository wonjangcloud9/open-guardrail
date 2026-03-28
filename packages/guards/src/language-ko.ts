import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LanguageKoOptions {
  action: 'block' | 'warn';
  minRatio?: number;
}

const KOREAN_RANGE = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g;

export function languageKo(options: LanguageKoOptions): Guard {
  const minRatio = options.minRatio ?? 0.3;

  return {
    name: 'language-ko',
    version: '0.1.0',
    description: 'Detects Korean language presence',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const stripped = text.replace(/\s/g, '');
      if (stripped.length === 0) {
        return {
          guardName: 'language-ko',
          passed: false,
          action: options.action,
          score: 0,
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const matches = stripped.match(KOREAN_RANGE) || [];
      const ratio = matches.length / stripped.length;
      const passed = ratio >= minRatio;

      return {
        guardName: 'language-ko',
        passed,
        action: passed ? 'allow' : options.action,
        score: Math.round(ratio * 1000) / 1000,
        latencyMs: Math.round(performance.now() - start),
        details: { koreanRatio: Math.round(ratio * 1000) / 1000 },
      };
    },
  };
}
