import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ConfidenceCheckOptions {
  action: 'block' | 'warn';
  mode?: 'require-hedging' | 'block-hedging';
}

const HEDGING_PATTERNS: RegExp[] = [
  /\bI('m| am) not (?:sure|certain|confident)\b/gi,
  /\bI think\b/gi,
  /\bprobably\b/gi,
  /\bpossibly\b/gi,
  /\bperhaps\b/gi,
  /\bmaybe\b/gi,
  /\bmight be\b/gi,
  /\bcould be\b/gi,
  /\bI believe\b/gi,
  /\bif I recall correctly\b/gi,
  /\bdon'?t quote me\b/gi,
  /\bit(?:'s| is) possible that\b/gi,
  /\bnot entirely sure\b/gi,
  /\bto the best of my knowledge\b/gi,
];

export function confidenceCheck(options: ConfidenceCheckOptions): Guard {
  const mode = options.mode ?? 'block-hedging';

  return {
    name: 'confidence-check',
    version: '0.1.0',
    description: 'Detect hedging/uncertainty language in LLM responses',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const p of HEDGING_PATTERNS) {
        const re = new RegExp(p.source, p.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0]);
      }

      const hasHedging = matched.length > 0;
      const triggered = mode === 'block-hedging' ? hasHedging : !hasHedging;

      return {
        guardName: 'confidence-check',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? mode === 'block-hedging'
            ? `Hedging language detected: "${matched[0]}"`
            : 'Response lacks appropriate hedging for uncertain claims'
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, mode, reason: mode === 'block-hedging' ? 'Response should express certainty, not hedge' : 'Uncertain claims should use hedging language' } : undefined,
      };
    },
  };
}
