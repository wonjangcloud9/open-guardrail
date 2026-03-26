import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ProfanityJpOptions {
  action: 'block' | 'warn';
  detectVariants?: boolean;
}

const BASE_WORDS: string[] = [
  'くそ', 'クソ', 'ばか', 'バカ', '馬鹿',
  'あほ', 'アホ', '阿呆', 'しね', 'シネ',
  '死ね', 'きもい', 'キモい', 'キモイ',
  'うざい', 'ウザい', 'ウザイ',
  'ふざけるな', 'ブス', 'デブ',
  'ちくしょう', 'くたばれ', 'ゴミ',
  'カス', 'ボケ', 'ぼけ',
  'きちがい', 'キチガイ',
  'クズ', 'くず',
];

const KANJI_WORDS: string[] = [
  '糞', '阿呆', '馬鹿', '畜生',
  '気違い', '屑',
];

const VARIANT_PATTERNS: [RegExp, string][] = [
  [/く[そソ]/g, 'くそ'],
  [/ば[かカ]/g, 'ばか'],
  [/バ[カか]/g, 'バカ'],
  [/し[ねネ]/g, 'しね'],
  [/う[ざザ][いイ]/g, 'うざい'],
  [/き[もモ][いイ]/g, 'きもい'],
  [/ク[ソそ]/g, 'クソ'],
  [/氏[ねネ]/g, '死ね'],
  [/タヒ[ねネ]?/g, '死ね'],
];

function findBase(text: string): string[] {
  const found: string[] = [];
  for (const w of BASE_WORDS) {
    if (text.includes(w)) found.push(w);
  }
  for (const w of KANJI_WORDS) {
    if (text.includes(w)) found.push(w);
  }
  return found;
}

function findVariants(text: string): string[] {
  const found: string[] = [];
  for (const [pattern, label] of VARIANT_PATTERNS) {
    const re = new RegExp(pattern.source, 'g');
    if (re.test(text)) found.push(label);
  }
  return found;
}

export function profanityJp(options: ProfanityJpOptions): Guard {
  const detectVariantsFlag = options.detectVariants ?? true;

  return {
    name: 'profanity-jp',
    version: '0.1.0',
    description: 'Japanese profanity detection',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      matched.push(...findBase(text));

      if (detectVariantsFlag) {
        matched.push(...findVariants(text));
      }

      const unique = [...new Set(matched)];
      const triggered = unique.length > 0;

      return {
        guardName: 'profanity-jp',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched: unique } : undefined,
      };
    },
  };
}
