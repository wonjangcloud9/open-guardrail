import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ConfidenceCalibrationOptions {
  action: 'block' | 'warn';
  maxHighConfidenceRatio?: number;
}

const HIGH_CONFIDENCE: RegExp[] = [
  /\bdefinitely\b/i,
  /\bcertainly\b/i,
  /\babsolutely\b/i,
  /\bwithout\s+doubt\b/i,
  /\bguaranteed\b/i,
  /\b100\s*%/,
  /\balways\b/i,
  /\bnever\b/i,
  /\bimpossible\b/i,
  /\bundeniable\b/i,
];

const HEDGING: RegExp[] = [
  /\bmaybe\b/i,
  /\bperhaps\b/i,
  /\bpossibly\b/i,
  /\bmight\b/i,
  /\bcould\s+be\b/i,
  /\buncertain\b/i,
  /\blikely\b/i,
];

const OPINION_WORDS: RegExp[] = [
  /\bopinion\b/i,
  /\bbelieve\b/i,
  /\bthink\b/i,
  /\bfeel\b/i,
  /\bsubjective\b/i,
  /\bdebatable\b/i,
  /\bargue\b/i,
  /\bcontroversial\b/i,
  /\bperspective\b/i,
  /\bviewpoint\b/i,
];

function countMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const p of patterns) {
    const m = text.match(new RegExp(p.source, p.flags + 'g'));
    if (m) count += m.length;
  }
  return count;
}

export function confidenceCalibration(options: ConfidenceCalibrationOptions): Guard {
  const maxRatio = options.maxHighConfidenceRatio ?? 0.5;

  return {
    name: 'confidence-calibration',
    version: '0.1.0',
    description: 'Detect miscalibrated confidence in model outputs',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      const highCount = countMatches(text, HIGH_CONFIDENCE);
      const hedgeCount = countMatches(text, HEDGING);
      const total = highCount + hedgeCount;
      const ratio = total > 0 ? highCount / total : 0;
      const isSubjective = OPINION_WORDS.some((p) => p.test(text));
      const triggered = ratio > maxRatio && isSubjective && highCount > 0;

      return {
        guardName: 'confidence-calibration',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(ratio, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { highConfidenceCount: highCount, hedgingCount: hedgeCount, ratio: Math.round(ratio * 100) / 100 }
          : undefined,
      };
    },
  };
}
