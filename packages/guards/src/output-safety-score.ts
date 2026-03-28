import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface OutputSafetyScoreOptions {
  action: 'block' | 'warn';
  threshold?: number;
}

const TOXICITY_MARKERS = [
  /\b(kill|murder|destroy|hate|stupid|idiot|moron)\b/i,
];

const PII_HINTS = [
  /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
];

const INJECTION_HINTS = [
  /ignore\s+(all\s+)?previous/i,
  /system\s+prompt/i,
  /\bjailbreak\b/i,
];

export function outputSafetyScore(options: OutputSafetyScoreOptions): Guard {
  const threshold = options.threshold ?? 0.7;

  return {
    name: 'output-safety-score',
    version: '0.1.0',
    description: 'Aggregates multiple safety signals into one score',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      let toxScore = 0;
      let piiScore = 0;
      let injScore = 0;

      for (const p of TOXICITY_MARKERS) {
        if (p.test(text)) { toxScore += 0.3; }
      }
      toxScore = Math.min(toxScore, 1.0);

      for (const p of PII_HINTS) {
        if (p.test(text)) { piiScore += 0.4; }
      }
      piiScore = Math.min(piiScore, 1.0);

      for (const p of INJECTION_HINTS) {
        if (p.test(text)) { injScore += 0.35; }
      }
      injScore = Math.min(injScore, 1.0);

      const safetyScore = 1.0 - (toxScore * 0.3 + piiScore * 0.3 + injScore * 0.4);
      const finalScore = Math.max(0, Math.min(1, Math.round(safetyScore * 100) / 100));

      const triggered = finalScore < threshold;

      return {
        guardName: 'output-safety-score',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: 1.0 - finalScore,
        latencyMs: Math.round(performance.now() - start),
        details: {
          safetyScore: finalScore,
          toxicity: Math.round(toxScore * 100) / 100,
          pii: Math.round(piiScore * 100) / 100,
          injection: Math.round(injScore * 100) / 100,
        },
      };
    },
  };
}
