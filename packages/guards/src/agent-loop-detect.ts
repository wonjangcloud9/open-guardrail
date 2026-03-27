import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AgentLoopDetectOptions {
  action: 'block' | 'warn';
  /** Max allowed repetitions of similar content */
  maxRepetitions?: number;
  /** Similarity threshold 0-1 (default 0.8) */
  similarityThreshold?: number;
  /** Window size for tracking recent messages */
  windowSize?: number;
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function trigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 3 || b.length < 3) return a === b ? 1 : 0;

  const trigramsA = new Set<string>();
  const trigramsB = new Set<string>();

  for (let i = 0; i <= a.length - 3; i++) trigramsA.add(a.slice(i, i + 3));
  for (let i = 0; i <= b.length - 3; i++) trigramsB.add(b.slice(i, i + 3));

  let intersection = 0;
  for (const t of trigramsA) {
    if (trigramsB.has(t)) intersection++;
  }

  return (2 * intersection) / (trigramsA.size + trigramsB.size);
}

export function agentLoopDetect(options: AgentLoopDetectOptions): Guard {
  const maxReps = options.maxRepetitions ?? 3;
  const threshold = options.similarityThreshold ?? 0.8;
  const windowSize = options.windowSize ?? 10;
  const history: string[] = [];

  return {
    name: 'agent-loop-detect',
    version: '0.1.0',
    description: 'Detects repetitive loop patterns in agent conversations',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const normalized = normalizeText(text);
      let similarCount = 0;

      for (const prev of history) {
        if (trigramSimilarity(normalized, prev) >= threshold) {
          similarCount++;
        }
      }

      history.push(normalized);
      if (history.length > windowSize) history.shift();

      const triggered = similarCount >= maxReps;
      return {
        guardName: 'agent-loop-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { similarCount, maxRepetitions: maxReps, windowSize }
          : undefined,
      };
    },
  };
}
