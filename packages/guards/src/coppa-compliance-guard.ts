import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface CoppaComplianceGuardOptions { action: 'block' | 'warn'; }
const CHILD_CTX = /\b(?:child|minor|under\s+13|elementary\s+school|grade\s+school|(?:I\s+am|I'm)\s+(?:[5-9]|1[0-2])\s+years?\s+old)\b/i;
const DATA_COLLECT = /\b(?:your\s+(?:name|email|address|phone|location)|share\s+your|tell\s+me\s+your)\b/i;
const PARENTAL = /\b(?:parental\s+consent|parent(?:'s|al)?\s+permission|guardian\s+consent)\b/i;
export function coppaComplianceGuard(options: CoppaComplianceGuardOptions): Guard {
  return { name: 'coppa-compliance-guard', version: '0.1.0', description: 'Block collection of data from children under 13 (COPPA)', category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const hasChild = CHILD_CTX.test(text);
      const hasCollect = DATA_COLLECT.test(text);
      const hasConsent = PARENTAL.test(text);
      const triggered = hasChild && hasCollect && !hasConsent;
      return { guardName: 'coppa-compliance-guard', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? 'Child data collection detected without parental consent' : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { childContextDetected: hasChild, dataCollectionDetected: hasCollect, parentalConsentFound: hasConsent } : undefined,
      };
    },
  };
}
