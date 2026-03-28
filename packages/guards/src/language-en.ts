import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LanguageEnOptions {
  action: 'block' | 'warn';
  minRatio?: number;
}

const COMMON_EN_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
  'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
  'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
  'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
  'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
  'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been',
]);

export function languageEn(options: LanguageEnOptions): Guard {
  const minRatio = options.minRatio ?? 0.5;

  return {
    name: 'language-en',
    version: '0.1.0',
    description: 'English language detection guard',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      // ASCII letter ratio
      const letters = text.replace(/[^a-zA-Z]/g, '').length;
      const asciiRatio = text.length > 0 ? letters / text.length : 0;

      // Common word frequency
      const words = text.toLowerCase().split(/\s+/).filter(Boolean);
      const enCount = words.filter((w) => COMMON_EN_WORDS.has(w)).length;
      const wordRatio = words.length > 0 ? enCount / words.length : 0;

      const score = asciiRatio * 0.4 + wordRatio * 0.6;
      const passed = score >= minRatio;

      return {
        guardName: 'language-en',
        passed,
        action: passed ? 'allow' : options.action,
        score: 1 - score,
        latencyMs: Math.round(performance.now() - start),
        details: { asciiRatio: +asciiRatio.toFixed(3), wordRatio: +wordRatio.toFixed(3), combinedScore: +score.toFixed(3) },
      };
    },
  };
}
