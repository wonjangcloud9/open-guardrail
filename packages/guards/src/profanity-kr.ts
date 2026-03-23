import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ProfanityKrOptions {
  action: 'block' | 'warn';
  detectVariants?: boolean;
}

const BASE_WORDS: string[] = [
  '시발', '씨발', '개새끼', '병신', '지랄',
  '미친놈', '미친년', '좆', '닥쳐', '꺼져',
  '개년', '썅', '엿먹어',
];

const CHOSEONG_MAP: Record<string, string> = {
  'ㅅㅂ': '시발',
  'ㅆㅂ': '씨발',
  'ㄱㅅㄲ': '개새끼',
  'ㅂㅅ': '병신',
  'ㅈㄹ': '지랄',
};

const VARIANT_PATTERNS: [RegExp, string][] = [
  [/시[1!]발/g, '시발'],
  [/씨[빨팔]/g, '씨발'],
  [/시[.\s]발/g, '시발'],
  [/씨[.\s]발/g, '씨발'],
  [/s발/gi, '시발'],
  [/개[새세]끼/g, '개새끼'],
  [/병[씬신]/g, '병신'],
  [/ㅂr보/g, '바보'],
];

function findBase(text: string): string[] {
  const found: string[] = [];
  for (const w of BASE_WORDS) {
    if (text.includes(w)) found.push(w);
  }
  return found;
}

function findChoseong(text: string): string[] {
  const found: string[] = [];
  for (const [abbr, word] of Object.entries(CHOSEONG_MAP)) {
    if (text.includes(abbr)) found.push(`${abbr}(${word})`);
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

export function profanityKr(options: ProfanityKrOptions): Guard {
  const detectVariantsFlag = options.detectVariants ?? true;

  return {
    name: 'profanity-kr',
    version: '0.1.0',
    description: 'Korean profanity detection',
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
        matched.push(...findChoseong(text));
        matched.push(...findVariants(text));
      }

      const unique = [...new Set(matched)];
      const triggered = unique.length > 0;

      return {
        guardName: 'profanity-kr',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched: unique } : undefined,
      };
    },
  };
}
