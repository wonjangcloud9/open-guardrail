import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type IsmsCheck =
  | 'personal-info'
  | 'sensitive-info'
  | 'third-party-transfer';

interface IsmsPOptions {
  action: 'block' | 'warn';
  checks?: IsmsCheck[];
}

const PERSONAL_INFO_KEYWORDS = [
  '개인정보 수집', '개인정보 이용', '개인정보 처리',
  '개인정보를 수집', '개인정보를 이용',
  '동의 없이', '동의없이', '무단 수집',
  '개인정보 제공', '정보주체 동의',
];

const SENSITIVE_INFO_KEYWORDS = [
  '건강정보', '사상', '신념', '노조', '정당',
  '정치적 견해', '유전정보', '범죄경력',
  '성생활', '생체인식', '인종', '민족',
];

const THIRD_PARTY_KEYWORDS = [
  '제3자 제공', '제3자 이전', '제삼자 제공',
  '데이터 이전', '정보 공유', '외부 제공',
  '위탁 처리', '국외 이전', '해외 전송',
];

const CHECK_MAP: Record<IsmsCheck, string[]> = {
  'personal-info': PERSONAL_INFO_KEYWORDS,
  'sensitive-info': SENSITIVE_INFO_KEYWORDS,
  'third-party-transfer': THIRD_PARTY_KEYWORDS,
};

const ALL_CHECKS: IsmsCheck[] = [
  'personal-info',
  'sensitive-info',
  'third-party-transfer',
];

export function ismsP(options: IsmsPOptions): Guard {
  const checks = options.checks ?? ALL_CHECKS;

  return {
    name: 'isms-p',
    version: '0.1.0',
    description: 'ISMS-P compliance keyword guard',
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
        guardName: 'isms-p',
        passed: !hasMatch,
        action: hasMatch ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: hasMatch ? { triggered } : undefined,
      };
    },
  };
}
