import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface HedgingOveruseOptions {
  action: 'block' | 'warn';
  maxHedgeRatio?: number;
}

const HEDGE_PATTERNS: RegExp[] = [
  /\bmaybe\b/i,
  /\bperhaps\b/i,
  /\bmight\b/i,
  /\bcould be\b/i,
  /\bpossibly\b/i,
  /\bit'?s unclear\b/i,
  /\bI'?m not sure\b/i,
  /\bit depends\b/i,
  /\barguably\b/i,
  /\bpotentially\b/i,
  /\bconceivably\b/i,
  /\bit seems\b/i,
  /\bappears to\b/i,
  /\bmay or may not\b/i,
];

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function hedgingOveruse(options: HedgingOveruseOptions): Guard {
  const maxRatio = options.maxHedgeRatio ?? 0.15;

  return {
    name: 'hedging-overuse',
    version: '0.1.0',
    description: 'Detect excessive hedging that undermines response usefulness',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const sentences = splitSentences(text);
      if (sentences.length === 0) {
        return {
          guardName: 'hedging-overuse',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      let hedgeCount = 0;
      const hedgeSentences: string[] = [];

      for (const sentence of sentences) {
        const hasHedge = HEDGE_PATTERNS.some((p) => p.test(sentence));
        if (hasHedge) {
          hedgeCount++;
          hedgeSentences.push(
            sentence.length > 80 ? sentence.slice(0, 77) + '...' : sentence,
          );
        }
      }

      const ratio = hedgeCount / sentences.length;
      const triggered = ratio > maxRatio;

      return {
        guardName: 'hedging-overuse',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Hedging ratio ${(ratio * 100).toFixed(1)}% exceeds ${(maxRatio * 100).toFixed(1)}% threshold`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              hedgeCount,
              totalSentences: sentences.length,
              ratio: Math.round(ratio * 1000) / 1000,
              hedgeSentences,
            }
          : { hedgeCount, totalSentences: sentences.length },
      };
    },
  };
}
