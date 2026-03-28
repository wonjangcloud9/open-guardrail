import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface FinancialPiiOptions {
  action: 'block' | 'warn';
  maskFinancial?: boolean;
}

const PATTERNS: [RegExp, string][] = [
  [/\b\d{8,17}\b/g, 'bank account number'],
  [/\b\d{9}\b/g, 'routing number'],
  [/\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g, 'SWIFT/BIC code'],
  [/\b[A-Z]{2}\d{2}\s?[\dA-Z]{4}\s?(?:[\dA-Z]{4}\s?){2,7}[\dA-Z]{1,4}\b/g, 'IBAN'],
  [/\b\d{2}-\d{7}\b/g, 'EIN'],
  [/\b9\d{2}-\d{2}-\d{4}\b/g, 'ITIN'],
  [/\b(?:account|acct)\s*#?\s*\d{6,12}\b/gi, 'trading account'],
  [/\b(?:wire|transfer)\s+(?:ref|reference)\s*[:#]?\s*\w{6,20}\b/gi, 'wire transfer'],
];

function mask(text: string): string {
  let masked = text;
  for (const [pattern] of PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    masked = masked.replace(re, '[REDACTED]');
  }
  return masked;
}

export function financialPii(options: FinancialPiiOptions): Guard {
  const shouldMask = options.maskFinancial ?? true;

  return {
    name: 'financial-pii',
    version: '0.1.0',
    description:
      'Detects financial PII: bank accounts, SWIFT, IBAN, tax IDs, wire transfers',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const found: string[] = [];

      for (const [pattern, label] of PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) found.push(label);
      }

      const unique = [...new Set(found)];
      const triggered = unique.length > 0;

      return {
        guardName: 'financial-pii',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Financial PII detected: ${unique.join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              types: unique,
              ...(shouldMask ? { maskedText: mask(text) } : {}),
            }
          : undefined,
      };
    },
  };
}
