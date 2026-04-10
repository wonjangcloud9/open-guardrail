import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ChunkBoundaryLeakOptions {
  action: 'block' | 'warn';
  customSeparators?: string[];
}

const DEFAULT_SEPARATORS = [
  '---', '===', '###END###',
  'Document:', 'Chunk:', 'Source:',
  '<|endoftext|>', '[SEP]', '<<CONTEXT>>',
  'metadata:', 'chunk_id:', 'embedding:',
  'score:', 'relevance_score:',
  '\n---\n', 'Retrieved from:', 'passage_id:',
];

export function chunkBoundaryLeak(options: ChunkBoundaryLeakOptions): Guard {
  const separators = options.customSeparators
    ? [...DEFAULT_SEPARATORS, ...options.customSeparators]
    : DEFAULT_SEPARATORS;

  return {
    name: 'chunk-boundary-leak',
    version: '0.1.0',
    description: 'Detects RAG chunk metadata or separators leaking into output',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const found: string[] = [];

      for (const sep of separators) {
        if (lower.includes(sep.toLowerCase())) {
          found.push(sep);
        }
      }

      const triggered = found.length > 0;

      return {
        guardName: 'chunk-boundary-leak',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { leakedSeparators: found } : undefined,
      };
    },
  };
}
