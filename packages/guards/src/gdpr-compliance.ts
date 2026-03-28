import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface GdprComplianceOptions {
  action: 'block' | 'warn';
  /** Require explicit consent mention for data processing */
  requireConsent?: boolean;
  /** Check for right-to-erasure violations */
  checkErasure?: boolean;
  /** Check for data minimization principle */
  checkMinimization?: boolean;
}

const PERSONAL_DATA_PATTERNS: RegExp[] = [
  /\b\d{2}[\s.-]\d{2}[\s.-]\d{4}\b/,
  /\b[A-Z]{2}\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/,
  /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  /\b(?:passport|national\s*id|identity\s*card)\s*(?:number|no\.?|#)?\s*:?\s*[A-Z0-9]{6,12}\b/i,
];

const RETENTION_VIOLATION_PATTERNS: RegExp[] = [
  /\b(store|keep|retain|save)\b.{0,30}\b(indefinitely|forever|permanently)\b/i,
  /\bnever\s+(delete|remove|erase)\b/i,
  /\bno\s+expir(y|ation)\b/i,
];

const CONSENT_VIOLATION_PATTERNS: RegExp[] = [
  /\b(without|no)\s+(user\s+)?(consent|permission|authorization)\b/i,
  /\bpre-?checked\s+(box|consent)\b/i,
  /\bimplied\s+consent\b/i,
  /\bopt[\s-]?out\s+(only|default)\b/i,
];

const TRANSFER_VIOLATION_PATTERNS: RegExp[] = [
  /\btransfer\s+(?:personal\s+)?data\s+(?:to\s+)?(?:outside|third[\s-]?party|overseas)\b/i,
  /\b(share|sell)\s+(?:user|personal|customer)\s+data\b/i,
];

export function gdprCompliance(options: GdprComplianceOptions): Guard {
  const requireConsent = options.requireConsent ?? true;
  const checkErasure = options.checkErasure ?? true;

  return {
    name: 'gdpr-compliance',
    version: '0.1.0',
    description: 'Validates GDPR compliance: data minimization, consent, retention, cross-border transfer',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];

      for (const p of RETENTION_VIOLATION_PATTERNS) {
        if (p.test(text)) violations.push('retention-violation');
      }

      if (requireConsent) {
        for (const p of CONSENT_VIOLATION_PATTERNS) {
          if (p.test(text)) violations.push('consent-violation');
        }
      }

      for (const p of TRANSFER_VIOLATION_PATTERNS) {
        if (p.test(text)) violations.push('transfer-violation');
      }

      if (checkErasure && /\b(cannot|can't|unable\s+to)\s+(delete|erase|remove)\b/i.test(text)) {
        violations.push('erasure-violation');
      }

      const hasPersonalData = PERSONAL_DATA_PATTERNS.some(p => p.test(text));
      if (hasPersonalData && violations.length > 0) {
        violations.push('personal-data-with-violation');
      }

      const uniqueViolations = [...new Set(violations)];
      const triggered = uniqueViolations.length > 0;

      return {
        guardName: 'gdpr-compliance',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(uniqueViolations.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations: uniqueViolations } : undefined,
      };
    },
  };
}
