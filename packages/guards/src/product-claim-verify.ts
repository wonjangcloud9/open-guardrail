import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ProductClaimVerifyOptions {
  action: 'block' | 'warn';
}

const UNSUBSTANTIATED: Array<[RegExp, string]> = [
  [/clinically\s+proven/i, 'clinically proven'],
  [/scientifically\s+proven/i, 'scientifically proven'],
  [/guaranteed\s+results?/i, 'guaranteed results'],
  [/miracle\s+cure/i, 'miracle cure'],
  [/fda\s+approved/i, 'FDA approved claim'],
  [/100%\s+effective/i, '100% effective'],
  [/no\s+side\s+effects?/i, 'no side effects'],
  [/instant\s+results?/i, 'instant results'],
  [/lose\s+weight\s+fast/i, 'lose weight fast'],
  [/anti[- ]?aging/i, 'anti-aging claim'],
  [/cures?\s+cancer/i, 'cures cancer'],
  [/prevents?\s+disease/i, 'prevents disease'],
  [/#1\s+rated/i, '#1 rated without source'],
  [/doctor\s+recommended/i, 'doctor recommended without citation'],
  [/all\s+natural\s+means?\s+safe/i, 'all natural means safe'],
];

export function productClaimVerify(options: ProductClaimVerifyOptions): Guard {
  return {
    name: 'product-claim-verify',
    version: '0.1.0',
    description: 'Block unsubstantiated product claims for FTC compliance',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const [re, label] of UNSUBSTANTIATED) {
        if (re.test(text)) matched.push(label);
      }

      const triggered = matched.length > 0;
      return {
        guardName: 'product-claim-verify',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { unsubstantiatedClaims: matched } : undefined,
      };
    },
  };
}
