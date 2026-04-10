import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PriceManipulationDetectOptions {
  action: 'block' | 'warn';
}

const PATTERNS: Array<[RegExp, string]> = [
  [/dynamic\s+pricing\s+based\s+on\s+user/i, 'dynamic pricing based on user profile'],
  [/personalized\s+price/i, 'personalized pricing'],
  [/price\s+discrimination/i, 'price discrimination'],
  [/a\/b\s+test\s+pricing/i, 'A/B test pricing'],
  [/surge\s+pricing/i, 'surge pricing'],
  [/hidden\s+fees?/i, 'hidden fees'],
  [/drip\s+pricing/i, 'drip pricing'],
  [/bait\s+and\s+switch/i, 'bait and switch'],
  [/decoy\s+pricing/i, 'decoy pricing'],
  [/anchor\s+pricing\s+to\s+manipulate/i, 'anchor pricing manipulation'],
  [/price\s+fixing/i, 'price fixing'],
  [/cartel\s+pricing/i, 'cartel pricing'],
  [/coordinated\s+pricing/i, 'coordinated pricing'],
  [/inflate\s+before\s+discount/i, 'inflated-before-discount'],
  [/fake\s+original\s+price/i, 'fake original price'],
  [/fake\s+sale/i, 'fake sale'],
  [/limited\s+time\s+only/i, 'urgency dark pattern'],
];

export function priceManipulationDetect(options: PriceManipulationDetectOptions): Guard {
  return {
    name: 'price-manipulation-detect',
    version: '0.1.0',
    description: 'Detect algorithmic price-fixing, dark patterns, and bait pricing',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const [re, label] of PATTERNS) {
        if (re.test(text)) matched.push(label);
      }

      const triggered = matched.length > 0;
      return {
        guardName: 'price-manipulation-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
