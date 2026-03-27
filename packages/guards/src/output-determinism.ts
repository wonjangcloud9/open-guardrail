import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface OutputDeterminismOptions {
  action: 'block' | 'warn';
  /** Detect hedging/uncertainty language (default true) */
  detectHedging?: boolean;
  /** Detect contradictions (default true) */
  detectContradictions?: boolean;
  /** Max hedging ratio before triggering (default 0.15) */
  maxHedgingRatio?: number;
}

const HEDGING = [
  'maybe', 'perhaps', 'possibly', 'might', 'could be', 'not sure',
  'i think', 'it seems', 'it appears', 'probably', 'likely',
  'i believe', 'in my opinion', 'it depends', 'hard to say',
  'not certain', 'unclear', 'uncertain', 'approximately',
];

const CONTRADICTION_PAIRS: [RegExp, RegExp][] = [
  [/\bis\b/i, /\bis\s+not\b/i],
  [/\byes\b/i, /\bno\b/i],
  [/\balways\b/i, /\bnever\b/i],
  [/\btrue\b/i, /\bfalse\b/i],
  [/\bcan\b/i, /\bcannot\b/i],
  [/\bshould\b/i, /\bshould\s+not\b/i],
];

export function outputDeterminism(options: OutputDeterminismOptions): Guard {
  const detectHedge = options.detectHedging ?? true;
  const detectContra = options.detectContradictions ?? true;
  const maxRatio = options.maxHedgingRatio ?? 0.15;

  return {
    name: 'output-determinism',
    version: '0.1.0',
    description: 'Detects hedging, uncertainty, and contradictions in output',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const words = lower.split(/\s+/).filter(Boolean);
      const issues: string[] = [];

      if (detectHedge) {
        let hedgeCount = 0;
        for (const h of HEDGING) {
          if (lower.includes(h)) hedgeCount++;
        }
        const ratio = hedgeCount / Math.max(words.length, 1);
        if (ratio > maxRatio) {
          issues.push(`High hedging ratio: ${Math.round(ratio * 100)}%`);
        }
      }

      if (detectContra) {
        for (const [a, b] of CONTRADICTION_PAIRS) {
          if (a.test(text) && b.test(text)) {
            issues.push(`Potential contradiction: ${a.source} vs ${b.source}`);
          }
        }
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'output-determinism',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
