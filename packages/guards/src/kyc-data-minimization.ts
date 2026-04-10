import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface KycDataMinimizationOptions {
  action: 'block' | 'warn';
}

const KYC_CONTEXT: RegExp[] = [
  /\bkyc\b/gi,
  /know\s+your\s+customer/gi,
  /identity\s+verification/gi,
  /customer\s+verification/gi,
];

const EXCESSIVE_DATA: { name: string; pattern: RegExp }[] = [
  { name: 'religion', pattern: /\breligion\b|\breligious\s+affiliation\b/gi },
  { name: 'political-affiliation', pattern: /political\s+(affiliation|party|belief)/gi },
  { name: 'sexual-orientation', pattern: /sexual\s+orientation/gi },
  { name: 'genetic-data', pattern: /genetic\s+(data|information|testing)/gi },
  { name: 'union-membership', pattern: /union\s+membership/gi },
  { name: 'biometric-excessive', pattern: /\b(fingerprint|retina|iris|dna)\s+(scan|sample|data)/gi },
  { name: 'browsing-history', pattern: /browsing\s+history/gi },
  { name: 'social-media-password', pattern: /social\s+media\s+password/gi },
];

export function kycDataMinimization(options: KycDataMinimizationOptions): Guard {
  return {
    name: 'kyc-data-minimization',
    version: '0.1.0',
    description: 'Ensure KYC flows collect only legally required data',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      let isKycContext = false;
      for (const pattern of KYC_CONTEXT) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) {
          isKycContext = true;
          break;
        }
      }

      const excessiveFields: string[] = [];
      if (isKycContext) {
        for (const { name, pattern } of EXCESSIVE_DATA) {
          const re = new RegExp(pattern.source, pattern.flags);
          if (re.test(text)) {
            excessiveFields.push(name);
          }
        }
      }

      const triggered = excessiveFields.length > 0;

      return {
        guardName: 'kyc-data-minimization',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { excessiveFields } : undefined,
      };
    },
  };
}
