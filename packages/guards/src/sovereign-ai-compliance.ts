import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface SovereignAiComplianceOptions { action: 'block' | 'warn'; jurisdiction?: string; }
const DATA_LOCALITY = /\b(?:process\s+in|store\s+in|host\s+in|transfer\s+(?:to|outside)|data\s+(?:residency|sovereignty|localization))\b/gi;
const MODEL_GOVERNANCE = /\b(?:(?:use|deploy|rely\s+on)\s+(?:a\s+)?(?:foreign|non[- ]domestic|overseas|external)\s+(?:AI|model|LLM)|cross[- ]border\s+AI\s+service)\b/gi;
const REGULATIONS: Record<string, RegExp> = {
  eu: /\b(?:EU\s+AI\s+Act|GDPR|General\s+Data\s+Protection)\b/gi,
  china: /\b(?:PIPL|CAC|Cyberspace\s+Administration|Chinese\s+AI\s+regulation)\b/gi,
  korea: /\b(?:PIPA|개인정보보호법|한국\s*AI|Korean\s+AI\s+regulation)\b/gi,
  us: /\b(?:Executive\s+Order\s+on\s+AI|NIST\s+AI\s+RMF|FedRAMP)\b/gi,
  brazil: /\b(?:LGPD|Brazilian\s+AI)\b/gi,
  canada: /\b(?:AIDA|Artificial\s+Intelligence\s+and\s+Data\s+Act)\b/gi,
};
const COMPLIANCE_ACK = /\b(?:in\s+compliance\s+with|compliant|authorized|approved\s+for|meets?\s+(?:regulatory|compliance)\s+requirements)\b/gi;
export function sovereignAiCompliance(options: SovereignAiComplianceOptions): Guard {
  const jurisdiction = (options.jurisdiction ?? 'global').toLowerCase();
  return { name: 'sovereign-ai-compliance', version: '0.1.0', description: 'Enforce jurisdiction-specific AI regulations', category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const issues: string[] = [];
      const hasDataLocality = DATA_LOCALITY.test(text); DATA_LOCALITY.lastIndex = 0;
      const hasModelGov = MODEL_GOVERNANCE.test(text); MODEL_GOVERNANCE.lastIndex = 0;
      const hasAck = COMPLIANCE_ACK.test(text); COMPLIANCE_ACK.lastIndex = 0;
      if (hasDataLocality && !hasAck) issues.push('data locality concern without compliance acknowledgment');
      if (hasModelGov && !hasAck) issues.push('cross-jurisdictional AI usage without compliance acknowledgment');
      if (jurisdiction !== 'global') {
        const reg = REGULATIONS[jurisdiction];
        if (reg) { const r = new RegExp(reg.source, reg.flags); if (!r.test(text) && (hasDataLocality || hasModelGov)) issues.push(`no reference to ${jurisdiction.toUpperCase()} regulations`); }
        for (const [jur, re] of Object.entries(REGULATIONS)) {
          if (jur === jurisdiction) continue;
          const r = new RegExp(re.source, re.flags);
          if (r.test(text) && !hasAck) issues.push(`references ${jur.toUpperCase()} regulation in ${jurisdiction.toUpperCase()} context`);
        }
      }
      const triggered = issues.length > 0;
      return { guardName: 'sovereign-ai-compliance', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Sovereign AI issue: ${issues[0]}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, jurisdiction } : undefined };
    },
  };
}
