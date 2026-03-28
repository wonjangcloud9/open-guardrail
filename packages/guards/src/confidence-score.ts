import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ConfidenceScoreOptions {
  action: 'block' | 'warn';
  maxHedging?: number;
  maxOverconfidence?: number;
}

const HEDGING_PATTERNS: RegExp[] = [
  /\bI think\b/i,
  /\bmaybe\b/i,
  /\bprobably\b/i,
  /\bnot sure\b/i,
  /\bmight be\b/i,
  /\bI believe\b/i,
  /\bapproximately\b/i,
  /\broughly\b/i,
];

const OVERCONFIDENCE_PATTERNS: RegExp[] = [
  /\bdefinitely\b/i,
  /\b100%\s*certain\b/i,
  /\babsolutely\b/i,
  /\bwithout a doubt\b/i,
  /\bguaranteed\b/i,
];

export function confidenceScore(options: ConfidenceScoreOptions): Guard {
  const maxHedging = options.maxHedging ?? 3;
  const maxOverconfidence = options.maxOverconfidence ?? 2;

  return {
    name: 'confidence-score',
    version: '0.1.0',
    description: 'Analyzes output confidence signals for hedging and overconfidence',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      let hedgingCount = 0;
      let overconfidenceCount = 0;

      for (const pattern of HEDGING_PATTERNS) {
        const matches = text.match(new RegExp(pattern.source, 'gi'));
        if (matches) hedgingCount += matches.length;
      }

      for (const pattern of OVERCONFIDENCE_PATTERNS) {
        const matches = text.match(new RegExp(pattern.source, 'gi'));
        if (matches) overconfidenceCount += matches.length;
      }

      const triggered = hedgingCount > maxHedging || overconfidenceCount > maxOverconfidence;
      const total = hedgingCount + overconfidenceCount;
      const score = triggered ? Math.min(total / (maxHedging + maxOverconfidence), 1.0) : 0;

      return {
        guardName: 'confidence-score',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: { hedging_count: hedgingCount, overconfidence_count: overconfidenceCount },
      };
    },
  };
}
