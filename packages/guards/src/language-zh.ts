import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LanguageZhOptions {
  action: 'block' | 'warn';
  minRatio?: number;
}

const CHINESE_RANGE = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g;

export function languageZh(options: LanguageZhOptions): Guard {
  const minRatio = options.minRatio ?? 0.3;

  return {
    name: 'language-zh',
    version: '0.1.0',
    description: 'Detects Chinese language presence',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const stripped = text.replace(/\s/g, '');
      if (stripped.length === 0) {
        return {
          guardName: 'language-zh',
          passed: false,
          action: options.action,
          score: 0,
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const matches = stripped.match(CHINESE_RANGE) || [];
      const ratio = matches.length / stripped.length;
      const passed = ratio >= minRatio;

      return {
        guardName: 'language-zh',
        passed,
        action: passed ? 'allow' : options.action,
        score: Math.round(ratio * 1000) / 1000,
        latencyMs: Math.round(performance.now() - start),
        details: { chineseRatio: Math.round(ratio * 1000) / 1000 },
      };
    },
  };
}
