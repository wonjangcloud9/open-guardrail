import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CurrencyFormatOptions {
  action: 'block' | 'warn';
}

const CURRENCY_PATTERNS: RegExp[] = [
  /\$[\d,.\s]+€|€[\d,.\s]+\$|£[\d,.\s]+\$|\$[\d,.\s]+£|¥[\d,.\s]+\$|\$[\d,.\s]+¥/,
  /\$[\d,]+\.\d{3,}/,
  /€[\d,]+\.\d{3,}/,
  /£[\d,]+\.\d{3,}/,
  /-\$|-€|-£|-¥/,
  /(?:USD|EUR|GBP|JPY)\s*[\$€£¥]|[\$€£¥]\s*(?:USD|EUR|GBP|JPY)/i,
  /\$[\d,]+\s*(?:euros?|pounds?|yen)/i,
  /€[\d,]+\s*(?:dollars?|pounds?|yen)/i,
  /£[\d,]+\s*(?:dollars?|euros?|yen)/i,
];

export function currencyFormat(options: CurrencyFormatOptions): Guard {
  return {
    name: 'currency-format',
    version: '0.1.0',
    description: 'Validates currency formatting consistency',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of CURRENCY_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'currency-format',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
