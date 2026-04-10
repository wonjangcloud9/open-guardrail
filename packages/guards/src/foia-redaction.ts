import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface FoiaRedactionOptions { action: 'block' | 'warn'; }
const FOIA_CONTEXT = /\b(?:FOIA\s+request|public\s+records?\s+request|freedom\s+of\s+information)\b/gi;
const EXEMPTIONS: Record<string, RegExp> = {
  'exemption-1-national-security': /\b(?:classified|national\s+defense|foreign\s+relations|intelligence\s+source)\b/gi,
  'exemption-4-trade-secrets': /\b(?:trade\s+secret|proprietary|confidential\s+business|commercial\s+information)\b/gi,
  'exemption-5-deliberative': /\b(?:draft\s+policy|internal\s+deliberation|pre[- ]decisional|attorney[- ]work\s+product)\b/gi,
  'exemption-6-personal-privacy': /\b(?:social\s+security\s+number|SSN|date\s+of\s+birth|medical\s+(?:record|history|condition)|home\s+address)\b/gi,
  'exemption-7-law-enforcement': /\b(?:ongoing\s+investigation|confidential\s+informant|surveillance\s+(?:target|operation)|law\s+enforcement\s+technique)\b/gi,
};
export function foiaRedaction(options: FoiaRedactionOptions): Guard {
  return { name: 'foia-redaction', version: '0.1.0', description: 'Flag content requiring FOIA redaction before public release', category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const flagged: string[] = [];
      const hasFoiaCtx = FOIA_CONTEXT.test(text); FOIA_CONTEXT.lastIndex = 0;
      if (hasFoiaCtx) {
        for (const [exemption, re] of Object.entries(EXEMPTIONS)) {
          const r = new RegExp(re.source, re.flags);
          if (r.test(text)) flagged.push(exemption);
        }
      }
      const triggered = flagged.length > 0;
      return { guardName: 'foia-redaction', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `FOIA redaction needed: ${flagged.join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { exemptions: flagged, foiaContextDetected: hasFoiaCtx } : undefined };
    },
  };
}
