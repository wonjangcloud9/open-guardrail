import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type PipaCheck =
  | 'sensitive-info'
  | 'unique-id'
  | 'children-info';

interface PipaOptions {
  action: 'block' | 'warn';
  checks?: PipaCheck[];
}

const SENSITIVE_KEYWORDS = [
  '건강정보', '유전정보', '범죄경력',
  '생체인식', '생체정보', '인종정보',
  '민감정보 처리', '민감정보를 처리',
];

const UNIQUE_ID_KEYWORDS = [
  '주민등록번호', '여권번호', '면허번호',
  '운전면허', '외국인등록번호',
  '고유식별정보', '고유식별정보 처리',
];

const CHILDREN_KEYWORDS = [
  '14세 미만', '아동 개인정보', '법정대리인',
  '법정대리인 동의', '미성년자 개인정보',
  '아동 정보', '미성년 정보',
];

const CHECK_MAP: Record<PipaCheck, string[]> = {
  'sensitive-info': SENSITIVE_KEYWORDS,
  'unique-id': UNIQUE_ID_KEYWORDS,
  'children-info': CHILDREN_KEYWORDS,
};

const ALL_CHECKS: PipaCheck[] = [
  'sensitive-info',
  'unique-id',
  'children-info',
];

export function pipa(options: PipaOptions): Guard {
  const checks = options.checks ?? ALL_CHECKS;

  return {
    name: 'pipa',
    version: '0.1.0',
    description: 'PIPA (개인정보보호법) compliance guard',
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
        guardName: 'pipa',
        passed: !hasMatch,
        action: hasMatch ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: hasMatch ? { triggered } : undefined,
      };
    },
  };
}
