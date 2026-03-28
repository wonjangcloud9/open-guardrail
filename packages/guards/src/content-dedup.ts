import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ContentDedupOptions {
  action: 'block' | 'warn';
  blockSize?: number;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash.toString(36);
}

export function contentDedup(options: ContentDedupOptions): Guard {
  const blockSize = options.blockSize ?? 100;

  return {
    name: 'content-dedup',
    version: '0.1.0',
    description: 'Detects duplicate content blocks in responses',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const normalized = text.replace(/\s+/g, ' ').trim();

      if (normalized.length < blockSize) {
        return {
          guardName: 'content-dedup',
          passed: true,
          action: 'allow',
          score: 0,
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const seen = new Map<string, number>();
      let duplicates = 0;
      const totalBlocks = Math.floor(normalized.length / blockSize);

      for (let i = 0; i <= normalized.length - blockSize; i += blockSize) {
        const block = normalized.slice(i, i + blockSize);
        const h = simpleHash(block);
        const prev = seen.get(h);
        if (prev !== undefined && normalized.slice(prev, prev + blockSize) === block) {
          duplicates++;
        } else {
          seen.set(h, i);
        }
      }

      const triggered = duplicates > 0;
      const score = triggered ? Math.min(duplicates / Math.max(totalBlocks, 1), 1.0) : 0;

      return {
        guardName: 'content-dedup',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { duplicateBlocks: duplicates, totalBlocks } : undefined,
      };
    },
  };
}
