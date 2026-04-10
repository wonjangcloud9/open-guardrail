import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MarketManipulationOptions {
  action: 'block' | 'warn';
}

const MANIPULATION_PATTERNS: RegExp[] = [
  /pump\s+and\s+dump/gi,
  /\bspoofing\b/gi,
  /layering\s+orders/gi,
  /wash\s+trading/gi,
  /cornering\s+the\s+market/gi,
  /insider\s+information/gi,
  /front\s+running/gi,
  /\bchurning\b/gi,
  /painting\s+the\s+tape/gi,
  /bear\s+raid/gi,
  /short\s+and\s+distort/gi,
  /this\s+stock\s+is\s+guaranteed\s+to/gi,
  /buy\s+before\s+it\s+moons/gi,
  /secret\s+tip/gi,
  /insider\s+knowledge/gi,
];

const COORDINATED_PATTERNS: RegExp[] = [
  /we\s+should\s+all\s+buy/gi,
  /everyone\s+buy\s+at/gi,
  /let'?s\s+drive\s+the\s+price/gi,
];

export function marketManipulation(options: MarketManipulationOptions): Guard {
  return {
    name: 'market-manipulation',
    version: '0.1.0',
    description: 'Prevent generating content constituting market manipulation',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches: string[] = [];

      for (const pattern of MANIPULATION_PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) {
          matches.push(pattern.source);
        }
      }

      for (const pattern of COORDINATED_PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) {
          matches.push(pattern.source);
        }
      }

      const triggered = matches.length > 0;

      return {
        guardName: 'market-manipulation',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matches } : undefined,
      };
    },
  };
}
