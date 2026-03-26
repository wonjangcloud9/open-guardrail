import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ReadingTimeOptions {
  action: 'block' | 'warn';
  maxMinutes?: number;
  wordsPerMinute?: number;
}

function estimateReadingTime(text: string, wpm: number): { minutes: number; words: number } {
  const words = text.split(/\s+/).filter((w) => w.length > 0).length;
  const minutes = Math.round((words / wpm) * 10) / 10;
  return { minutes, words };
}

export function readingTime(options: ReadingTimeOptions): Guard {
  const maxMinutes = options.maxMinutes ?? 5;
  const wpm = options.wordsPerMinute ?? 200;

  return {
    name: 'reading-time',
    version: '0.1.0',
    description: 'Estimate and limit reading time',
    category: 'content',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const { minutes, words } = estimateReadingTime(text, wpm);
      const triggered = minutes > maxMinutes;

      return {
        guardName: 'reading-time',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: { estimatedMinutes: minutes, wordCount: words, maxMinutes },
      };
    },
  };
}
