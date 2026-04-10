import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface TcpaComplianceOptions { action: 'block' | 'warn'; }
const AUTO_DIAL = /\b(?:auto[- ]?dial|robocall|automated\s+call)\b/i;
const CONSENT = /\b(?:consent|opted\s+in|agreed\s+to)\b/i;
const CALL_LIST = /\b(?:call\s+list|contact\s+list)\b/i;
const DNC_CHECK = /\b(?:do[- ]not[- ]call\s+check|DNC\s+verified)\b/i;
const LATE_HOURS = /\b(?:call\s+at\s+)?(?:1[1-2]\s*(?:PM|pm)|midnight|[1-5]\s*(?:AM|am)|before\s+8\s*(?:AM|am))\b/i;
const MARKETING = /\b(?:marketing\s+call|promotional)\b/i;
const OPT_OUT = /\b(?:opt\s+out|unsubscribe|stop)\b/i;
export function tcpaCompliance(options: TcpaComplianceOptions): Guard {
  return { name: 'tcpa-compliance', version: '0.1.0', description: 'Telephone Consumer Protection Act compliance checks', category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const violations: string[] = [];
      if (AUTO_DIAL.test(text) && !CONSENT.test(text)) violations.push('Auto-dial without consent');
      if (CALL_LIST.test(text) && !DNC_CHECK.test(text)) violations.push('Call list without DNC check');
      if (LATE_HOURS.test(text)) violations.push('Call during restricted hours');
      if (MARKETING.test(text) && !OPT_OUT.test(text)) violations.push('Marketing call without opt-out');
      const triggered = violations.length > 0;
      return { guardName: 'tcpa-compliance', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `TCPA violation: ${violations.join('; ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations } : undefined,
      };
    },
  };
}
