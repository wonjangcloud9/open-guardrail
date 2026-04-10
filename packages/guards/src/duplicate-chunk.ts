import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DuplicateChunkOptions {
  action: 'block' | 'warn';
  similarityThreshold?: number;
  minChunkLength?: number;
}

function trigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 3 || b.length < 3) return a === b ? 1 : 0;
  const trigramsA = new Set<string>();
  for (let i = 0; i <= a.length - 3; i++) trigramsA.add(a.slice(i, i + 3));
  const trigramsB = new Set<string>();
  for (let i = 0; i <= b.length - 3; i++) trigramsB.add(b.slice(i, i + 3));
  let intersection = 0;
  for (const t of trigramsA) {
    if (trigramsB.has(t)) intersection++;
  }
  return (2 * intersection) / (trigramsA.size + trigramsB.size);
}

export function duplicateChunk(options: DuplicateChunkOptions): Guard {
  const threshold = options.similarityThreshold ?? 0.8;
  const minLen = options.minChunkLength ?? 50;

  return {
    name: 'duplicate-chunk',
    version: '0.1.0',
    description: 'Detects duplicate or near-duplicate chunks in RAG-retrieved text',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const chunks = text
        .split(/\n---\n|\n\n|---/)
        .map((c) => c.trim())
        .filter((c) => c.length >= minLen);

      let maxSim = 0;
      let dupPair: [number, number] | undefined;

      for (let i = 0; i < chunks.length; i++) {
        for (let j = i + 1; j < chunks.length; j++) {
          const sim = trigramSimilarity(
            chunks[i].toLowerCase(),
            chunks[j].toLowerCase(),
          );
          if (sim > maxSim) {
            maxSim = sim;
            dupPair = [i, j];
          }
        }
      }

      const triggered = maxSim >= threshold;

      return {
        guardName: 'duplicate-chunk',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? maxSim : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { similarity: maxSim, chunkIndices: dupPair }
          : undefined,
      };
    },
  };
}
