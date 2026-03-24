import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RepetitionDetectOptions {
  action: 'block' | 'warn';
  maxRepeatRatio?: number;
  minTextLength?: number;
}

function detectRepetition(text: string): { ratio: number; repeatedPhrase?: string } {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 10) return { ratio: 0 };

  // Check for repeated n-grams (3-word phrases)
  const ngrams = new Map<string, number>();
  for (let i = 0; i <= words.length - 3; i++) {
    const ngram = words.slice(i, i + 3).join(' ').toLowerCase();
    ngrams.set(ngram, (ngrams.get(ngram) ?? 0) + 1);
  }

  let maxCount = 0;
  let maxNgram = '';
  for (const [ngram, count] of ngrams) {
    if (count > maxCount) {
      maxCount = count;
      maxNgram = ngram;
    }
  }

  const totalNgrams = Math.max(words.length - 2, 1);
  const ratio = maxCount / totalNgrams;

  return { ratio, repeatedPhrase: maxCount > 2 ? maxNgram : undefined };
}

function detectCharRepetition(text: string): number {
  if (text.length < 20) return 0;

  // Check for long runs of the same character
  let maxRun = 0;
  let currentRun = 1;
  for (let i = 1; i < text.length; i++) {
    if (text[i] === text[i - 1]) {
      currentRun++;
      maxRun = Math.max(maxRun, currentRun);
    } else {
      currentRun = 1;
    }
  }

  return maxRun / text.length;
}

export function repetitionDetect(options: RepetitionDetectOptions): Guard {
  const maxRepeatRatio = options.maxRepeatRatio ?? 0.3;
  const minTextLength = options.minTextLength ?? 50;

  return {
    name: 'repetition-detect',
    version: '1.0.0',
    description: 'Detects repetitive LLM output: repeated phrases, character loops, degenerate text',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      if (text.length < minTextLength) {
        return { guardName: 'repetition-detect', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }

      const { ratio, repeatedPhrase } = detectRepetition(text);
      const charRatio = detectCharRepetition(text);

      const triggered = ratio > maxRepeatRatio || charRatio > 0.1;
      const score = Math.max(ratio, charRatio);

      return {
        guardName: 'repetition-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(score, 1) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { repeatRatio: ratio, charRepeatRatio: charRatio, repeatedPhrase } : undefined,
      };
    },
  };
}
