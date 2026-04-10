import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface ConformityAssessmentOptions { action: 'block' | 'warn'; requiredFields?: string[]; }
const DEFAULT_FIELDS = ['timestamp', 'model', 'version', 'input_hash', 'risk_level'];
const DECISION_PATTERNS = /\b(?:decision|classification|prediction|result|recommendation|assessment|verdict|determination|ruling|approval|rejection)\s*[:=]/i;
export function conformityAssessment(options: ConformityAssessmentOptions): Guard {
  const required = options.requiredFields ?? DEFAULT_FIELDS;
  return { name: 'conformity-assessment', version: '0.1.0', description: 'Ensure outputs include conformity assessment logging fields (EU AI Act Art. 16)', category: 'compliance', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const isDecision = DECISION_PATTERNS.test(text);
      if (!isDecision) {
        return { guardName: 'conformity-assessment', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }
      const lower = text.toLowerCase();
      const found = required.filter(f => {
        const escaped = f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pat = new RegExp(`(?:"${escaped}"|'${escaped}'|${escaped})\\s*[:=]`, 'i');
        return pat.test(lower);
      });
      const threshold = 3;
      const triggered = found.length < threshold;
      return { guardName: 'conformity-assessment', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Decision output missing conformity assessment fields (found ${found.length}/${required.length})` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { fieldsFound: found, fieldsMissing: required.filter(f => !found.includes(f)), threshold, reason: 'EU AI Act Art. 16 requires conformity assessment logging for decisions' } : undefined,
      };
    },
  };
}
