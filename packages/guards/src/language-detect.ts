import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface LanguageDetectOptions {
  action: 'block' | 'warn';
  required?: string[];
  forbidden?: string[];
}

const SCRIPT_RANGES: Record<string, [number, number][]> = {
  ko: [[0xAC00, 0xD7AF], [0x1100, 0x11FF], [0x3130, 0x318F]],
  ja: [[0x3040, 0x309F], [0x30A0, 0x30FF]],
  zh: [[0x4E00, 0x9FFF], [0x3400, 0x4DBF]],
  ar: [[0x0600, 0x06FF], [0x0750, 0x077F]],
  hi: [[0x0900, 0x097F]],
  th: [[0x0E00, 0x0E7F]],
  ru: [[0x0400, 0x04FF]],
  he: [[0x0590, 0x05FF]],
};

const COMMON_WORDS: Record<string, string[]> = {
  en: ['the', 'is', 'are', 'was', 'have', 'has', 'this', 'that', 'with', 'and', 'for', 'not', 'you', 'but'],
  es: ['el', 'la', 'los', 'las', 'es', 'son', 'del', 'por', 'para', 'con'],
  fr: ['le', 'la', 'les', 'est', 'sont', 'des', 'une', 'avec', 'pour', 'dans'],
  de: ['der', 'die', 'das', 'ist', 'sind', 'ein', 'eine', 'und', 'mit', 'nicht'],
  pt: ['o', 'os', 'um', 'uma', 'com', 'para', 'que', 'por', 'como'],
  id: ['yang', 'dan', 'di', 'ini', 'itu', 'dengan', 'untuk', 'dari'],
  vi: ['la', 'cua', 'va', 'co', 'trong', 'nhu', 'cho', 'duoc'],
};

function detectLanguages(text: string): Map<string, number> {
  const scores = new Map<string, number>();
  const total = text.length || 1;

  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    for (const [lang, ranges] of Object.entries(SCRIPT_RANGES)) {
      for (const [lo, hi] of ranges) {
        if (code >= lo && code <= hi) {
          scores.set(lang, (scores.get(lang) ?? 0) + 1);
        }
      }
    }
  }

  const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 0);
  for (const [lang, common] of Object.entries(COMMON_WORDS)) {
    let hits = 0;
    for (const w of words) {
      if (common.includes(w)) hits++;
    }
    if (hits > 0) {
      scores.set(lang, (scores.get(lang) ?? 0) + hits * 3);
    }
  }

  const result = new Map<string, number>();
  for (const [lang, count] of scores) {
    result.set(lang, Math.round((count / total) * 100) / 100);
  }
  return result;
}

export function languageDetect(options: LanguageDetectOptions): Guard {
  return {
    name: 'language-detect',
    version: '0.1.0',
    description: 'Enhanced multi-language detection with required/forbidden lists',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const detected = detectLanguages(text);
      const langs = [...detected.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([lang]) => lang);

      let triggered = false;
      const violations: string[] = [];

      if (options.required && options.required.length > 0) {
        const hasRequired = langs.some((l) => options.required!.includes(l));
        if (!hasRequired && langs.length > 0) {
          triggered = true;
          violations.push(`Required language(s) not detected: ${options.required.join(', ')}`);
        }
      }

      if (options.forbidden) {
        const hasForbidden = langs.filter((l) => options.forbidden!.includes(l));
        if (hasForbidden.length > 0) {
          triggered = true;
          violations.push(`Forbidden language(s) detected: ${hasForbidden.join(', ')}`);
        }
      }

      return {
        guardName: 'language-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? violations.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: {
          detected: Object.fromEntries(detected),
          primaryLanguage: langs[0] ?? 'unknown',
          violations: triggered ? violations : undefined,
          reason: triggered ? 'Text language does not match requirements' : undefined,
        },
      };
    },
  };
}
