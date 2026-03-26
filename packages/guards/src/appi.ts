import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type AppiCheck =
  | 'personal-info'
  | 'sensitive-info'
  | 'third-party-transfer'
  | 'children-info';

interface AppiOptions {
  action: 'block' | 'warn';
  checks?: AppiCheck[];
}

const PERSONAL_INFO_KEYWORDS = [
  '個人情報の収集', '個人情報の利用', '個人情報の取得',
  '個人情報を収集', '個人情報を利用', '個人情報を取得',
  '同意なく', '同意なしに', '無断収集',
  '個人情報の提供', '本人の同意',
  '個人データ', '個人情報取扱',
];

const SENSITIVE_INFO_KEYWORDS = [
  '要配慮個人情報', '人種', '信条', '社会的身分',
  '病歴', '犯罪の経歴', '犯罪被害',
  '身体障害', '知的障害', '精神障害',
  '健康診断', '医師の指導', '遺伝情報',
];

const THIRD_PARTY_KEYWORDS = [
  '第三者提供', '第三者への提供', '第三者に提供',
  'データ移転', '情報共有', '外部提供',
  '委託処理', '国外移転', '越境移転',
  'オプトアウト',
];

const CHILDREN_KEYWORDS = [
  '未成年者', '児童の個人情報', '保護者の同意',
  '法定代理人', '未成年の個人情報',
  '子供の個人情報', '児童情報',
];

const CHECK_MAP: Record<AppiCheck, string[]> = {
  'personal-info': PERSONAL_INFO_KEYWORDS,
  'sensitive-info': SENSITIVE_INFO_KEYWORDS,
  'third-party-transfer': THIRD_PARTY_KEYWORDS,
  'children-info': CHILDREN_KEYWORDS,
};

const ALL_CHECKS: AppiCheck[] = [
  'personal-info',
  'sensitive-info',
  'third-party-transfer',
  'children-info',
];

export function appi(options: AppiOptions): Guard {
  const checks = options.checks ?? ALL_CHECKS;

  return {
    name: 'appi',
    version: '0.1.0',
    description: 'APPI (個人情報保護法) compliance guard',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const triggered: Record<string, string[]> = {};

      for (const c of checks) {
        const keywords = CHECK_MAP[c];
        const found: string[] = [];
        for (const kw of keywords) {
          if (text.includes(kw)) found.push(kw);
        }
        if (found.length > 0) triggered[c] = found;
      }

      const hasMatch = Object.keys(triggered).length > 0;

      return {
        guardName: 'appi',
        passed: !hasMatch,
        action: hasMatch ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: hasMatch ? { triggered } : undefined,
      };
    },
  };
}
