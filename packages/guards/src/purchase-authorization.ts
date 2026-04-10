import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PurchaseAuthorizationOptions {
  action: 'block' | 'warn';
  /** Maximum allowed purchase amount in USD */
  maxAmount?: number;
  /** Allowed product/merchant categories */
  allowedCategories?: string[];
}

const PURCHASE_PATTERNS = [
  /\bbuy\b/i,
  /\bpurchase\b/i,
  /\border\b/i,
  /\bcheckout\b/i,
  /\badd\s+to\s+cart\b/i,
  /\bpay\s+\$/i,
  /\bsubscribe\b/i,
  /\bcharge\s+\$/i,
];

const AUTO_BUY_PATTERNS = [
  /\bauto[- ]?buy\b/i,
  /\bautomatic\s+purchase\b/i,
  /\bbuy\s+without\s+confirmation\b/i,
];

const AMOUNT_RE = /\$([\d,]+(?:\.\d{1,2})?)/g;

export function purchaseAuthorization(options: PurchaseAuthorizationOptions): Guard {
  const maxAmount = options.maxAmount ?? 500;
  const allowedCategories = options.allowedCategories;

  return {
    name: 'purchase-authorization',
    version: '0.1.0',
    description: 'Enforce spend limits and merchant restrictions for AI-initiated purchases',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const reasons: string[] = [];

      const hasPurchaseIntent = PURCHASE_PATTERNS.some((p) => p.test(text));

      // Extract dollar amounts
      const amounts: number[] = [];
      let m: RegExpExecArray | null;
      const re = new RegExp(AMOUNT_RE.source, AMOUNT_RE.flags);
      while ((m = re.exec(text)) !== null) {
        amounts.push(parseFloat(m[1].replace(/,/g, '')));
      }

      const overLimit = amounts.filter((a) => a > maxAmount);
      if (overLimit.length > 0) {
        reasons.push(`Amount exceeds limit: ${overLimit.map((a) => `$${a}`).join(', ')} > $${maxAmount}`);
      }

      // Check auto-buy without confirmation
      if (AUTO_BUY_PATTERNS.some((p) => p.test(text))) {
        reasons.push('Auto-purchase without user confirmation detected');
      }

      // Check allowed categories
      if (allowedCategories && hasPurchaseIntent) {
        const lower = text.toLowerCase();
        const hasAllowed = allowedCategories.some((c) => lower.includes(c.toLowerCase()));
        if (!hasAllowed) {
          reasons.push('Product/merchant category not in allowed list');
        }
      }

      const triggered = reasons.length > 0;
      return {
        guardName: 'purchase-authorization',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { reasons, amounts, maxAmount } : undefined,
      };
    },
  };
}
