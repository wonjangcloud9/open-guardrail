import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LanguageJaOptions {
  action: 'block' | 'warn';
  minRatio?: number;
}

const JAPANESE_RANGE = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF65-\uFF9F]/g;

export function languageJa(options: LanguageJaOptions): Guard {
  const minRatio = options.minRatio ?? 0.3;

  return {
    name: 'language-ja',
    version: '0.1.0',
    description: 'Detects Japanese language presence',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const stripped = text.replace(/\s/g, '');
      if (stripped.length === 0) {
        return {
          guardName: 'language-ja',
          passed: false,
          action: options.action,
          score: 0,
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const matches = stripped.match(JAPANESE_RANGE) || [];
      const ratio = matches.length / stripped.length;
      const passed = ratio >= minRatio;

      return {
        guardName: 'language-ja',
        passed,
        action: passed ? 'allow' : options.action,
        score: Math.round(ratio * 1000) / 1000,
        latencyMs: Math.round(performance.now() - start),
        details: { japaneseRatio: Math.round(ratio * 1000) / 1000 },
      };
    },
  };
}
