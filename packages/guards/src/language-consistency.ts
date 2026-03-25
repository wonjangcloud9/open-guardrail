import type { Guard, GuardContext, GuardResult } from 'open-guardrail-core';

interface LanguageConsistencyOptions {
  action: 'block' | 'warn';
  /** Expected language(s) the response should match. If not set, uses metadata.inputLanguage. */
  expected?: string[];
}

const LANG_INDICATORS: Record<string, RegExp[]> = {
  ko: [/[\uAC00-\uD7AF]/g],
  ja: [/[\u3040-\u309F\u30A0-\u30FF]/g],
  zh: [/[\u4E00-\u9FFF]/g],
  en: [/\b(?:the|is|are|was|were|have|has|will|would|can|could|do|does|this|that|with|from|for|and|but|not)\b/gi],
  es: [/\b(?:el|la|los|las|es|son|está|están|tiene|tienen|para|con|por|como|pero|que|del|una|uno)\b/gi],
  fr: [/\b(?:le|la|les|est|sont|avec|pour|dans|sur|pas|des|une|que|qui|nous|vous|ils|mais|très)\b/gi],
  de: [/\b(?:der|die|das|ist|sind|haben|werden|nicht|mit|für|auf|ein|eine|oder|und|aber|auch)\b/gi],
};

function detectLanguage(text: string): string | null {
  const scores: Record<string, number> = {};
  const totalChars = text.length || 1;

  for (const [lang, patterns] of Object.entries(LANG_INDICATORS)) {
    let matchCount = 0;
    for (const p of patterns) {
      p.lastIndex = 0;
      const matches = text.match(p);
      matchCount += matches ? matches.length : 0;
    }
    scores[lang] = matchCount / totalChars;
  }

  let best: string | null = null;
  let bestScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore && score > 0.01) {
      best = lang;
      bestScore = score;
    }
  }

  return best;
}

export function languageConsistency(options: LanguageConsistencyOptions): Guard {
  return {
    name: 'language-consistency',
    version: '1.0.0',
    description: 'Verify response language matches expected language',
    category: 'content',
    supportedStages: ['output'],

    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      const expected = options.expected
        ?? (ctx.metadata?.inputLanguage ? [ctx.metadata.inputLanguage as string] : null);

      if (!expected || expected.length === 0) {
        return {
          guardName: 'language-consistency',
          passed: true,
          action: 'allow',
          message: 'No expected language set — skipped',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const detected = detectLanguage(text);

      if (!detected) {
        return {
          guardName: 'language-consistency',
          passed: true,
          action: 'allow',
          message: 'Could not detect language',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const matches = expected.includes(detected);

      return {
        guardName: 'language-consistency',
        passed: matches,
        action: matches ? 'allow' : options.action,
        score: matches ? 0 : 0.7,
        message: matches
          ? undefined
          : `Expected ${expected.join('/')} but detected ${detected}`,
        details: { detected, expected },
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}
