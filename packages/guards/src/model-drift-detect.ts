import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ModelDriftDetectOptions {
  action: 'block' | 'warn';
  /** Rolling window size (default 20) */
  windowSize?: number;
}

const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'happy', 'positive', 'wonderful',
  'fantastic', 'amazing', 'love', 'best', 'perfect', 'helpful',
  'thank', 'nice', 'beautiful', 'brilliant', 'success', 'enjoy',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'horrible', 'sad', 'negative', 'awful',
  'worst', 'hate', 'fail', 'wrong', 'ugly', 'stupid', 'error',
  'problem', 'broken', 'useless', 'annoying', 'disappointing',
]);

interface ResponseStats {
  wordCount: number;
  diversity: number;
  sentimentRatio: number;
}

function computeStats(text: string): ResponseStats {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const unique = new Set(words).size;
  const diversity = wordCount > 0 ? unique / wordCount : 0;

  let pos = 0;
  let neg = 0;
  for (const w of words) {
    if (POSITIVE_WORDS.has(w)) pos++;
    if (NEGATIVE_WORDS.has(w)) neg++;
  }
  const total = pos + neg;
  const sentimentRatio = total > 0 ? pos / total : 0.5;

  return { wordCount, diversity, sentimentRatio };
}

export function modelDriftDetect(options: ModelDriftDetectOptions): Guard {
  const windowSize = options.windowSize ?? 20;
  const history: ResponseStats[] = [];

  return {
    name: 'model-drift-detect',
    version: '0.1.0',
    description: 'Detects output distribution shift vs baseline behavior',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const current = computeStats(text);
      const warming = history.length < windowSize;

      let triggered = false;
      let driftType: string | undefined;
      let magnitude = 0;

      if (!warming) {
        const avgLen = history.reduce((s, h) => s + h.wordCount, 0) / history.length;
        const avgDiv = history.reduce((s, h) => s + h.diversity, 0) / history.length;
        const avgSent = history.reduce((s, h) => s + h.sentimentRatio, 0) / history.length;

        if (avgLen > 0 && current.wordCount > avgLen * 3) {
          triggered = true;
          driftType = 'length_spike';
          magnitude = current.wordCount / avgLen;
        } else if (avgDiv > 0 && current.diversity < avgDiv * 0.5) {
          triggered = true;
          driftType = 'vocabulary_drop';
          magnitude = 1 - current.diversity / avgDiv;
        } else if (
          (avgSent > 0.6 && current.sentimentRatio < 0.4) ||
          (avgSent < 0.4 && current.sentimentRatio > 0.6)
        ) {
          triggered = true;
          driftType = 'sentiment_flip';
          magnitude = Math.abs(current.sentimentRatio - avgSent);
        }
      }

      history.push(current);
      if (history.length > windowSize) history.shift();

      return {
        guardName: 'model-drift-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { driftType, magnitude: Math.round(magnitude * 100) / 100, windowSize }
          : undefined,
      };
    },
  };
}
