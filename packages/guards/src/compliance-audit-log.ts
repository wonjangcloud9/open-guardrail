import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ComplianceAuditLogOptions {
  action?: 'block' | 'warn';
}

const PII_PATTERNS = [
  { name: 'email', pattern: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/ },
  { name: 'phone', pattern: /\b\d{3}[-.]?\d{3,4}[-.]?\d{4}\b/ },
  { name: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
];

const FINANCIAL_TERMS = [
  'investment', 'portfolio', 'dividend',
  'securities', 'stock', 'bond',
  'interest rate', 'credit score',
];

const MEDICAL_TERMS = [
  'diagnosis', 'prescription', 'treatment',
  'symptoms', 'patient', 'medical record',
  'blood pressure', 'dosage',
];

const LEGAL_TERMS = [
  'liability', 'jurisdiction', 'plaintiff',
  'defendant', 'statute', 'subpoena',
  'indemnification', 'breach of contract',
];

function findMatches(
  text: string,
  terms: string[],
): string[] {
  const lower = text.toLowerCase();
  return terms.filter((t) => lower.includes(t));
}

export function complianceAuditLog(
  options?: ComplianceAuditLogOptions,
): Guard {
  void options;

  return {
    name: 'compliance-audit-log',
    version: '0.1.0',
    description:
      'Audit logger that detects PII, financial, medical, and legal terms',
    category: 'custom',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const audit: Record<string, string[]> = {};

      const piiFound = PII_PATTERNS
        .filter((p) => p.pattern.test(text))
        .map((p) => p.name);
      if (piiFound.length > 0) audit.pii = piiFound;

      const fin = findMatches(text, FINANCIAL_TERMS);
      if (fin.length > 0) audit.financial = fin;

      const med = findMatches(text, MEDICAL_TERMS);
      if (med.length > 0) audit.medical = med;

      const leg = findMatches(text, LEGAL_TERMS);
      if (leg.length > 0) audit.legal = leg;

      const hasEntries = Object.keys(audit).length > 0;

      return {
        guardName: 'compliance-audit-log',
        passed: true,
        action: 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: hasEntries ? { audit } : undefined,
      };
    },
  };
}
