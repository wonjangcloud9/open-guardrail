import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface MedicalPiiOptions {
  action: 'block' | 'warn';
  maskMedical?: boolean;
}

const PATTERNS: [RegExp, string][] = [
  [/\b[A-Z]\d{2}(?:\.\d{1,4})?\b/g, 'ICD-10 code'],
  [/\bRx\s*#?\s*\d{6,12}\b/gi, 'prescription number'],
  [/\bMRN\s*[:#]?\s*\d{5,12}\b/gi, 'medical record number'],
  [/\b\d{3}-?\d{2}-?\d{4}\b/g, 'health insurance ID'],
  [/\b(?:blood\s+type|type)\s*[:\s]?\s*(?:A|B|AB|O)[+-]/gi, 'blood type'],
  [/\b(?:patient|pt)\s*[:#]?\s*\d{5,12}\b/gi, 'patient identifier'],
  [/\bNPI\s*[:#]?\s*\d{10}\b/gi, 'NPI number'],
];

function mask(text: string): string {
  let masked = text;
  for (const [pattern] of PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    masked = masked.replace(re, '[REDACTED]');
  }
  return masked;
}

export function medicalPii(options: MedicalPiiOptions): Guard {
  const shouldMask = options.maskMedical ?? true;

  return {
    name: 'medical-pii',
    version: '0.1.0',
    description:
      'Detects medical PII: ICD-10 codes, prescriptions, MRNs, insurance IDs',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const found: string[] = [];

      for (const [pattern, label] of PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) found.push(label);
      }

      const triggered = found.length > 0;

      return {
        guardName: 'medical-pii',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Medical PII detected: ${found.join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              types: found,
              ...(shouldMask ? { maskedText: mask(text) } : {}),
            }
          : undefined,
      };
    },
  };
}
