import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CreditDecisionExplainOptions {
  action: 'block' | 'warn';
}

const DECISION_PATTERNS: RegExp[] = [
  /loan\s+(approved|denied)/gi,
  /credit\s+application/gi,
  /\bcreditworthiness\b/gi,
  /credit\s+score/gi,
  /lending\s+decision/gi,
  /mortgage\s+(approved|denied)/gi,
];

const ADVERSE_NOTICE: RegExp[] = [
  /reason\s+for\s+denial/gi,
  /factors?\s+considered/gi,
  /adverse\s+action/gi,
];

const SPECIFIC_REASONS: RegExp[] = [
  /\bincome\b/gi,
  /debt[- ]to[- ]income/gi,
  /credit\s+history/gi,
  /\bemployment\b/gi,
  /\bcollateral\b/gi,
];

const PROHIBITED_FACTORS: RegExp[] = [
  /\brace\b/gi,
  /\breligion\b/gi,
  /\bgender\b/gi,
  /marital\s+status/gi,
  /national\s+origin/gi,
];

export function creditDecisionExplain(options: CreditDecisionExplainOptions): Guard {
  return {
    name: 'credit-decision-explain',
    version: '0.1.0',
    description: 'Enforce fair lending explanation requirements (ECOA/FCRA)',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      let hasDecision = false;
      for (const pattern of DECISION_PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) {
          hasDecision = true;
          break;
        }
      }

      if (!hasDecision) {
        return {
          guardName: 'credit-decision-explain',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      // Check for prohibited factors
      const prohibitedFound: string[] = [];
      for (const pattern of PROHIBITED_FACTORS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) {
          prohibitedFound.push(pattern.source);
        }
      }

      if (prohibitedFound.length > 0) {
        return {
          guardName: 'credit-decision-explain',
          passed: false,
          action: options.action,
          latencyMs: Math.round(performance.now() - start),
          details: { reason: 'prohibited-factors', prohibitedFound },
        };
      }

      // Check for adverse action notice
      let hasAdverseNotice = false;
      for (const pattern of ADVERSE_NOTICE) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) {
          hasAdverseNotice = true;
          break;
        }
      }

      // Check for specific reasons
      let hasSpecificReason = false;
      for (const pattern of SPECIFIC_REASONS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) {
          hasSpecificReason = true;
          break;
        }
      }

      const missingExplanation = !hasAdverseNotice || !hasSpecificReason;

      return {
        guardName: 'credit-decision-explain',
        passed: !missingExplanation,
        action: missingExplanation ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: missingExplanation
          ? { hasAdverseNotice, hasSpecificReason }
          : undefined,
      };
    },
  };
}
