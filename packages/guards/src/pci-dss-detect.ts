import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PciDssDetectOptions {
  action: 'block' | 'warn';
  /** Mask detected card numbers in output (default true) */
  maskCards?: boolean;
}

function luhnCheck(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

const CARD_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g;
const CVV_PATTERN = /\b(?:cvv|cvc|cvv2|cvc2|security\s*code)\s*[:=]?\s*\d{3,4}\b/gi;
const EXPIRY_PATTERN = /\b(?:exp(?:iry|iration)?|valid\s*(?:thru|through))\s*[:=]?\s*(?:0[1-9]|1[0-2])\s*[/\-]\s*\d{2,4}\b/gi;
const CARDHOLDER_PATTERN = /\b(?:cardholder|card\s*holder|account\s*holder)\s*[:=]?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g;
const UNENCRYPTED_STORAGE = /(?:store|save|log|write|insert|persist)\s+(?:credit\s*card|card\s*number|pan|payment\s*card)\s+(?:in\s+)?(?:plain\s*text|unencrypted|clear\s*text|log|database|file)/gi;

function maskCardNumber(text: string): string {
  return text.replace(CARD_PATTERN, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 13 && digits.length <= 19 && luhnCheck(digits)) {
      const last4 = digits.slice(-4);
      return `****-****-****-${last4}`;
    }
    return match;
  });
}

export function pciDssDetect(options: PciDssDetectOptions): Guard {
  const shouldMask = options.maskCards ?? true;

  return {
    name: 'pci-dss-detect',
    version: '0.1.0',
    description: 'Detects PCI DSS violations including credit card numbers and cardholder data',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];

      const cardMatches = text.match(CARD_PATTERN) ?? [];
      for (const m of cardMatches) {
        const digits = m.replace(/\D/g, '');
        if (digits.length >= 13 && digits.length <= 19 && luhnCheck(digits)) {
          violations.push('credit_card_number');
          break;
        }
      }

      if (CVV_PATTERN.test(text)) violations.push('cvv_exposed');
      CVV_PATTERN.lastIndex = 0;

      if (EXPIRY_PATTERN.test(text)) violations.push('card_expiry');
      EXPIRY_PATTERN.lastIndex = 0;

      if (CARDHOLDER_PATTERN.test(text)) violations.push('cardholder_data');
      CARDHOLDER_PATTERN.lastIndex = 0;

      if (UNENCRYPTED_STORAGE.test(text)) violations.push('unencrypted_storage');
      UNENCRYPTED_STORAGE.lastIndex = 0;

      const triggered = violations.length > 0;
      const score = triggered ? Math.min(violations.length / 3, 1.0) : 0;

      return {
        guardName: 'pci-dss-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations } : undefined,
        ...(triggered && shouldMask ? { overrideText: maskCardNumber(text) } : {}),
      };
    },
  };
}
