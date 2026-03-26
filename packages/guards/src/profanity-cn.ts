import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ProfanityCnOptions {
  action: 'block' | 'warn';
  detectVariants?: boolean;
}

const BASE_WORDS: string[] = [
  '他妈的', '操你妈', '你妈逼', '傻逼', '草泥马',
  '混蛋', '王八蛋', '狗屎', '去死', '废物',
  '白痴', '智障', '脑残', '贱人', '婊子',
  '滚蛋', '放屁', '妈的', '靠', '卧槽',
  '牛逼', '装逼', '逗比', '屌丝',
];

const PINYIN_VARIANTS: Record<string, string> = {
  'TMD': '他妈的',
  'tmd': '他妈的',
  'cnm': '操你妈',
  'CNM': '操你妈',
  'nmb': '你妈逼',
  'NMB': '你妈逼',
  'sb': '傻逼',
  'SB': '傻逼',
  'wc': '卧槽',
  'WC': '卧槽',
  'nb': '牛逼',
  'NB': '牛逼',
};

const VARIANT_PATTERNS: [RegExp, string][] = [
  [/[操草艹肏]你[妈吗嗎马]/g, '操你妈'],
  [/[傻煞][逼比屄]/g, '傻逼'],
  [/[草艹肏]泥[马馬]/g, '草泥马'],
  [/他[妈吗嗎马]的/g, '他妈的'],
  [/[卧我][槽草艹]/g, '卧槽'],
  [/[牛🐂][逼比屄]/g, '牛逼'],
  [/[装裝][逼比屄]/g, '装逼'],
];

function findBase(text: string): string[] {
  const found: string[] = [];
  for (const w of BASE_WORDS) {
    if (text.includes(w)) found.push(w);
  }
  return found;
}

function findPinyinVariants(text: string): string[] {
  const found: string[] = [];
  for (const [abbr, word] of Object.entries(PINYIN_VARIANTS)) {
    const re = new RegExp(`\\b${abbr}\\b`);
    if (re.test(text)) found.push(`${abbr}(${word})`);
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

export function profanityCn(options: ProfanityCnOptions): Guard {
  const detectVariantsFlag = options.detectVariants ?? true;

  return {
    name: 'profanity-cn',
    version: '0.1.0',
    description: 'Chinese profanity detection',
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
        matched.push(...findPinyinVariants(text));
        matched.push(...findVariants(text));
      }

      const unique = [...new Set(matched)];
      const triggered = unique.length > 0;

      return {
        guardName: 'profanity-cn',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched: unique } : undefined,
      };
    },
  };
}
