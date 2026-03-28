import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LanguageEsOptions {
  action: 'block' | 'warn';
  minRatio?: number;
}

const COMMON_ES_WORDS = new Set([
  'el', 'la', 'de', 'que', 'en', 'un', 'es', 'por', 'los', 'las',
  'del', 'se', 'con', 'una', 'su', 'para', 'al', 'no', 'son', 'lo',
  'como', 'pero', 'sus', 'le', 'ya', 'fue', 'este', 'ha', 'si', 'o',
  'ser', 'sobre', 'todo', 'tiene', 'muy', 'entre', 'desde', 'nos',
  'esta', 'hay', 'yo', 'cuando', 'mas', 'sin', 'donde', 'hasta',
  'cada', 'ese', 'ella', 'otro', 'era', 'puede', 'todos', 'asi',
  'cual', 'dos', 'tambien', 'tiempo', 'mismo', 'parte', 'hacer',
]);

const SPANISH_CHARS = /[áéíóúñ¡¿ü]/gi;

export function languageEs(options: LanguageEsOptions): Guard {
  const minRatio = options.minRatio ?? 0.3;

  return {
    name: 'language-es',
    version: '0.1.0',
    description: 'Spanish language detection guard',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      // Spanish character ratio
      const spanishChars = (text.match(SPANISH_CHARS) || []).length;
      const charScore = text.length > 0 ? Math.min(spanishChars / (text.length * 0.05), 1) : 0;

      // Common word frequency
      const words = text.toLowerCase().split(/\s+/).filter(Boolean);
      const esCount = words.filter((w) => COMMON_ES_WORDS.has(w)).length;
      const wordRatio = words.length > 0 ? esCount / words.length : 0;

      const score = charScore * 0.3 + wordRatio * 0.7;
      const passed = score >= minRatio;

      return {
        guardName: 'language-es',
        passed,
        action: passed ? 'allow' : options.action,
        score: 1 - score,
        latencyMs: Math.round(performance.now() - start),
        details: { charScore: +charScore.toFixed(3), wordRatio: +wordRatio.toFixed(3), combinedScore: +score.toFixed(3) },
      };
    },
  };
}
