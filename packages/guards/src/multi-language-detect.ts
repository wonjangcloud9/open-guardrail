import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MultiLanguageDetectOptions {
  action: 'block' | 'warn';
  maxLanguages?: number;
}

const SCRIPT_RANGES: [string, RegExp][] = [
  ['Latin', /[A-Za-z\u00C0-\u024F]/],
  ['Cyrillic', /[\u0400-\u04FF]/],
  ['CJK', /[\u4E00-\u9FFF\u3400-\u4DBF]/],
  ['Arabic', /[\u0600-\u06FF]/],
  ['Devanagari', /[\u0900-\u097F]/],
  ['Thai', /[\u0E00-\u0E7F]/],
  ['Hebrew', /[\u0590-\u05FF]/],
  ['Greek', /[\u0370-\u03FF]/],
  ['Korean', /[\uAC00-\uD7AF\u1100-\u11FF]/],
  ['Japanese', /[\u3040-\u309F\u30A0-\u30FF]/],
];

export function multiLanguageDetect(options: MultiLanguageDetectOptions): Guard {
  const maxLangs = options.maxLanguages ?? 2;

  return {
    name: 'multi-language-detect',
    version: '0.1.0',
    description: 'Detects which language scripts are present',
    category: 'locale',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const detected: string[] = [];

      for (const [name, re] of SCRIPT_RANGES) {
        if (re.test(text)) {
          detected.push(name);
        }
      }

      const triggered = detected.length > maxLangs;
      const score = triggered
        ? Math.min((detected.length - maxLangs) / 3, 1.0)
        : 0;

      return {
        guardName: 'multi-language-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: { detectedScripts: detected, count: detected.length },
      };
    },
  };
}
