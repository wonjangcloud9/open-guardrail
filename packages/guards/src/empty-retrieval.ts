import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface EmptyRetrievalOptions {
  action: 'block' | 'warn';
  emptyContextMarkers?: string[];
}

const DEFAULT_EMPTY_MARKERS = [
  'no results found', 'no documents', 'no relevant',
  'empty context', 'no matches', 'nothing retrieved',
  '0 results',
];

const CONFIDENT_ASSERTIONS: RegExp[] = [
  /\bthe\s+answer\s+is\b/i,
  /\bspecifically\b/i,
  /\bexactly\b/i,
  /\bcertainly\b/i,
  /\bdefinitely\b/i,
  /\bthe\s+data\s+shows?\b/i,
  /\baccording\s+to\b/i,
];

export function emptyRetrieval(options: EmptyRetrievalOptions): Guard {
  const markers = options.emptyContextMarkers ?? DEFAULT_EMPTY_MARKERS;

  return {
    name: 'empty-retrieval',
    version: '0.1.0',
    description: 'Detects confident answers despite no retrieval context',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();

      const hasEmptyMarker = markers.some((m) => lower.includes(m.toLowerCase()));
      const hasConfidence = CONFIDENT_ASSERTIONS.some((p) => p.test(text));

      const triggered = hasEmptyMarker && hasConfidence;

      return {
        guardName: 'empty-retrieval',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { reason: 'Confident assertion found alongside empty retrieval marker' }
          : undefined,
      };
    },
  };
}
