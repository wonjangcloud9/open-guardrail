import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AiBasicActKrOptions {
  action: 'block' | 'warn';
  /** Check for high-impact AI requirements */
  highImpact?: boolean;
}

const PROHIBITED_PATTERNS: RegExp[] = [
  /(인간\s*존엄성|인권)\s*(침해|���반|무시)/,
  /(차별|편향)\s*(조장|강화|확산)/,
  /(생명|신체)\s*(위험|���해|해)/,
  /(민주\s*주의|민주적\s*질서)\s*(훼손|위협)/,
  /(사회적\s*신용\s*점수|사회\s*점수\s*제)/,
  /(���시|추���)\s*(시스템|체계).*(시��|국민)/,
];

const HIGH_IMPACT_PATTERNS: RegExp[] = [
  /(��율\s*주행|자동\s*운전)/,
  /(��료|진단|치료)\s*(결정|판단|AI)/,
  /(채용|인사|고용)\s*(결정|판단|심사)/,
  /(신용\s*평가|대출\s*심사)/,
  /(��죄\s*예측|재범\s*예측)/,
  /(교육\s*평가|입학\s*심사)/,
  /(국가\s*안보|군사)\s*(활용|적용)/,
];

const TRANSPARENCY_PATTERNS: RegExp[] = [
  /(AI|인공지능)\s*(생성|작성|제작)/,
  /(딥페이크|합성\s*미디어)/,
  /(챗봇|가상\s*비서)/,
];

const ENGLISH_PROHIBITED: RegExp[] = [
  /\b(exploit|manipulate)\s+(vulnerable|elderly|minor|disabled)\b/i,
  /\bsocial\s+credit\s+scoring\b/i,
  /\bmass\s+surveillance\b/i,
];

export function aiBasicActKr(options: AiBasicActKrOptions): Guard {
  const highImpact = options.highImpact ?? true;

  return {
    name: 'ai-basic-act-kr',
    version: '0.1.0',
    description: '한국 AI 기본법 준수: 금지행위, 고위험 AI 요건, 투명성 의무 (2026.1.22 시행)',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];

      for (const p of PROHIBITED_PATTERNS) {
        if (p.test(text)) violations.push('prohibited-practice');
      }

      for (const p of ENGLISH_PROHIBITED) {
        if (p.test(text)) violations.push('prohibited-practice');
      }

      if (highImpact) {
        for (const p of HIGH_IMPACT_PATTERNS) {
          if (p.test(text)) {
            if (!/(영향\s*평가|안전성\s*검증|impact\s*assessment)/i.test(text)) {
              violations.push('high-impact-no-assessment');
            }
          }
        }
      }

      for (const p of TRANSPARENCY_PATTERNS) {
        if (p.test(text)) {
          if (!/(AI\s*(표시|��기|공개)|인공지능\s*(표시|생성물))/.test(text)) {
            violations.push('transparency-missing');
          }
        }
      }

      const uniqueViolations = [...new Set(violations)];
      const triggered = uniqueViolations.length > 0;

      return {
        guardName: 'ai-basic-act-kr',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(uniqueViolations.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations: uniqueViolations } : undefined,
      };
    },
  };
}
