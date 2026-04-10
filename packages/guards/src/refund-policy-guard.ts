import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RefundPolicyGuardOptions {
  action: 'block' | 'warn';
}

const TRANSACTION_PATTERNS = [
  /\bpurchase\b/i,
  /\border\b/i,
  /\bsubscrib/i,
  /\bpayment\b/i,
  /\bcharge\b/i,
  /\bbuy\b/i,
  /\bcheckout\b/i,
];

const CONSUMER_PROTECTION = [
  /\brefund\b/i,
  /\breturn\s+policy\b/i,
  /\bcancell?ation\b/i,
  /\bcooling[- ]off\s+period\b/i,
  /\bmoney[- ]?back\b/i,
  /\bcancel\s+anytime\b/i,
  /\bcancel\s+subscription\b/i,
  /\bopt\s+out\b/i,
];

export function refundPolicyGuard(options: RefundPolicyGuardOptions): Guard {
  return {
    name: 'refund-policy-guard',
    version: '0.1.0',
    description: 'Ensure agentic transactions include refund/cancellation rights',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      const hasTransaction = TRANSACTION_PATTERNS.some((p) => p.test(text));
      const hasProtection = CONSUMER_PROTECTION.some((p) => p.test(text));

      const triggered = hasTransaction && !hasProtection;
      return {
        guardName: 'refund-policy-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { reason: 'Transaction detected without consumer protection information' }
          : undefined,
      };
    },
  };
}
