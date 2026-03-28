import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ContextUtilizationOptions {
  action: 'block' | 'warn';
  minOverlap?: number;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2),
  );
}

export function contextUtilization(options: ContextUtilizationOptions): Guard {
  const minOverlap = options.minOverlap ?? 0.1;

  return {
    name: 'context-utilization',
    version: '0.1.0',
    description: 'Checks if provided context was used in the response',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const context = (ctx as unknown as Record<string, unknown>).context as string | undefined;

      if (!context) {
        return {
          guardName: 'context-utilization',
          passed: true,
          action: 'allow',
          score: 0,
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const contextTokens = tokenize(context);
      const responseTokens = tokenize(text);

      if (contextTokens.size === 0) {
        return {
          guardName: 'context-utilization',
          passed: true,
          action: 'allow',
          score: 0,
          latencyMs: Math.round(performance.now() - start),
        };
      }

      let overlap = 0;
      for (const token of contextTokens) {
        if (responseTokens.has(token)) overlap++;
      }

      const ratio = overlap / contextTokens.size;
      const triggered = ratio < minOverlap;
      const score = triggered ? 1.0 - ratio : 0;

      return {
        guardName: 'context-utilization',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: { overlapRatio: Math.round(ratio * 100) / 100 },
      };
    },
  };
}
