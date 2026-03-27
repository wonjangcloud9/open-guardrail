import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ContextWindowOverflowOptions {
  action: 'block' | 'warn';
  /** Approximate max tokens (default 128000) */
  maxTokens?: number;
  /** Characters per token estimate (default 4) */
  charsPerToken?: number;
  /** Warn threshold as ratio of max (default 0.9) */
  warnThreshold?: number;
}

export function contextWindowOverflow(options: ContextWindowOverflowOptions): Guard {
  const maxTokens = options.maxTokens ?? 128_000;
  const charsPerToken = options.charsPerToken ?? 4;
  const warnAt = options.warnThreshold ?? 0.9;
  let accumulated = 0;

  return {
    name: 'context-window-overflow',
    version: '0.1.0',
    description: 'Prevents context window overflow in RAG and agent pipelines',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const estimatedTokens = Math.ceil(text.length / charsPerToken);
      accumulated += estimatedTokens;

      const ratio = accumulated / maxTokens;
      const overflowed = ratio >= 1.0;
      const nearLimit = ratio >= warnAt;

      const triggered = overflowed || (nearLimit && options.action === 'warn');

      return {
        guardName: 'context-window-overflow',
        passed: !overflowed,
        action: overflowed ? options.action : nearLimit ? 'warn' : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              estimatedTokens: accumulated,
              maxTokens,
              utilization: Math.round(ratio * 100) + '%',
            }
          : undefined,
      };
    },
  };
}
