import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseDedupSentenceOptions {
  action: 'block' | 'warn';
  maxDuplicates?: number;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function responseDedupSentence(options: ResponseDedupSentenceOptions): Guard {
  const maxDup = options.maxDuplicates ?? 2;

  return {
    name: 'response-dedup-sentence',
    version: '0.1.0',
    description: 'Detects repeated sentences in AI output',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const sentences = splitSentences(text);
      const counts = new Map<string, number>();
      const duplicates: string[] = [];

      for (const s of sentences) {
        const key = normalize(s);
        if (!key) continue;
        const count = (counts.get(key) ?? 0) + 1;
        counts.set(key, count);
        if (count > maxDup && !duplicates.includes(key)) {
          duplicates.push(key);
        }
      }

      const triggered = duplicates.length > 0;
      const score = triggered ? Math.min(duplicates.length / 3, 1.0) : 0;

      return {
        guardName: 'response-dedup-sentence',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { duplicateCount: duplicates.length, samples: duplicates.slice(0, 3) }
          : undefined,
      };
    },
  };
}
