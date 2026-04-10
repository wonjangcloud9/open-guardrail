import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface FedrampDataBoundaryOptions { action: 'block' | 'warn'; }
const GOV_CONTEXT = /\b(?:federal|\.gov|agency|classified|government\s+data|dod|department\s+of)\b/gi;
const TRANSFER_PATTERNS = [
  /\b(?:send\s+to|upload\s+to|store\s+in|transfer\s+to|export\s+to|share\s+externally|migrate\s+to)\b/gi,
];
const NON_COMPLIANT_CLOUD = /\b(?:S3\s+bucket|Azure\s+blob|GCS|Google\s+Cloud\s+Storage)\b/gi;
const FEDRAMP_QUALIFIERS = /\b(?:FedRAMP\s+authorized|gov[- ]?cloud|GovCloud|IL[45])\b/gi;
const THIRD_PARTY = /\b(?:Dropbox|Box\.com|OneDrive|iCloud|mega\.nz|WeTransfer)\b/gi;
export function fedrampDataBoundary(options: FedrampDataBoundaryOptions): Guard {
  return { name: 'fedramp-data-boundary', version: '0.1.0', description: 'Enforce data residency within FedRAMP boundaries', category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const issues: string[] = [];
      const hasGovContext = GOV_CONTEXT.test(text); GOV_CONTEXT.lastIndex = 0;
      if (hasGovContext) {
        for (const p of TRANSFER_PATTERNS) { const re = new RegExp(p.source, p.flags); if (re.test(text)) issues.push('cross-boundary transfer detected'); }
        if (NON_COMPLIANT_CLOUD.test(text)) { NON_COMPLIANT_CLOUD.lastIndex = 0;
          if (!FEDRAMP_QUALIFIERS.test(text)) { issues.push('non-FedRAMP-qualified cloud storage'); } FEDRAMP_QUALIFIERS.lastIndex = 0;
        } NON_COMPLIANT_CLOUD.lastIndex = 0;
        if (THIRD_PARTY.test(text)) { issues.push('third-party external service'); } THIRD_PARTY.lastIndex = 0;
      }
      const triggered = issues.length > 0;
      return { guardName: 'fedramp-data-boundary', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `FedRAMP boundary violation: ${issues.join('; ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, govContextDetected: hasGovContext } : undefined };
    },
  };
}
