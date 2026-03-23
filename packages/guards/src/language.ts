import type {
  Guard,
  GuardResult,
  GuardContext,
} from '@open-guardrail/core';

interface LanguageOptions {
  allowed: string[];
  action: 'block' | 'warn';
}

const COMMON_WORDS: Record<string, string[]> = {
  en: [
    'the', 'is', 'are', 'was', 'were',
    'have', 'has', 'this', 'that', 'with',
    'and', 'for', 'not', 'you', 'but',
  ],
  es: [
    'el', 'la', 'los', 'las', 'es',
    'son', 'del', 'por', 'para', 'como',
    'con', 'una', 'este', 'esta', 'pero',
  ],
  fr: [
    'le', 'la', 'les', 'est', 'sont',
    'des', 'une', 'avec', 'pour', 'dans',
    'pas', 'que', 'sur', 'mais', 'nous',
  ],
  de: [
    'der', 'die', 'das', 'ist', 'sind',
    'ein', 'eine', 'und', 'mit', 'nicht',
    'auf', 'ich', 'sie', 'den', 'auch',
  ],
};

interface ScriptRange {
  lang: string;
  ranges: [number, number][];
}

const SCRIPT_RANGES: ScriptRange[] = [
  {
    lang: 'ko',
    ranges: [
      [0xac00, 0xd7af],
      [0x1100, 0x11ff],
      [0x3130, 0x318f],
    ],
  },
  {
    lang: 'ja',
    ranges: [
      [0x3040, 0x309f],
      [0x30a0, 0x30ff],
    ],
  },
  {
    lang: 'zh',
    ranges: [
      [0x4e00, 0x9fff],
      [0x3400, 0x4dbf],
    ],
  },
  {
    lang: 'ar',
    ranges: [[0x0600, 0x06ff]],
  },
  {
    lang: 'ru',
    ranges: [[0x0400, 0x04ff]],
  },
  {
    lang: 'th',
    ranges: [[0x0e00, 0x0e7f]],
  },
  {
    lang: 'hi',
    ranges: [[0x0900, 0x097f]],
  },
];

function detectByScript(text: string): string | null {
  const counts: Record<string, number> = {};
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    for (const sr of SCRIPT_RANGES) {
      for (const [lo, hi] of sr.ranges) {
        if (code >= lo && code <= hi) {
          counts[sr.lang] =
            (counts[sr.lang] ?? 0) + 1;
        }
      }
    }
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [lang, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = lang;
      bestCount = count;
    }
  }
  return bestCount >= 2 ? best : null;
}

function detectByWords(text: string): string | null {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length === 0) return null;

  let best: string | null = null;
  let bestScore = 0;

  for (const [lang, common] of Object.entries(
    COMMON_WORDS,
  )) {
    let hits = 0;
    for (const w of words) {
      if (common.includes(w)) hits++;
    }
    const score = hits / words.length;
    if (score > bestScore) {
      best = lang;
      bestScore = score;
    }
  }

  return bestScore >= 0.1 ? best : null;
}

function detectLanguage(text: string): string | null {
  return detectByScript(text) ?? detectByWords(text);
}

export function language(
  options: LanguageOptions,
): Guard {
  return {
    name: 'language',
    version: '0.1.0',
    description: 'Language detection and filtering',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const detected = detectLanguage(text);
      const allowed =
        detected !== null &&
        options.allowed.includes(detected);
      const triggered = !allowed;

      return {
        guardName: 'language',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: { detectedLanguage: detected },
      };
    },
  };
}
