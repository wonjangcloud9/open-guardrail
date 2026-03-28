import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProfanityKoExtendedOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /ㅅㅂ/,
  /ㅈㄹ/,
  /ㄲㅈ/,
  /ㅂㅅ/,
  /ㅁㅊ/,
  /시발/,
  /씨발/,
  /좆/,
  /개새끼/,
  /미친놈/,
  /미친년/,
  /병신/,
  /또라이/,
  /찐따/,
  /돌아이/,
  /돌+아이/,
  /ㅆㅂ/,
  /ㅄ/,
  /시[빠바]럴/,
  /씨[빠바]럴/,
  /개[씹쌍]/,
  /느금마/,
  /지랄/,
  /꺼져/,
  /닥[쳐치]/,
  /엠창/,
  /니[애에]미/,
  /새[끼기]야/,
];

export function profanityKoExtended(options: ProfanityKoExtendedOptions): Guard {
  return {
    name: 'profanity-ko-extended',
    version: '0.1.0',
    description: 'Extended Korean profanity detection with internet slang',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'profanity-ko-extended',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedCount: matched.length } : undefined,
      };
    },
  };
}
