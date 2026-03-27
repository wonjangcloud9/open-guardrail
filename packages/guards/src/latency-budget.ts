import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LatencyBudgetOptions {
  action: 'block' | 'warn';
  /** Max total pipeline latency in ms (default 100) */
  maxLatencyMs?: number;
  /** Warn threshold ratio (default 0.8) */
  warnThreshold?: number;
}

export function latencyBudget(options: LatencyBudgetOptions): Guard {
  const maxMs = options.maxLatencyMs ?? 100;
  const warnAt = options.warnThreshold ?? 0.8;
  let pipelineStart = 0;

  return {
    name: 'latency-budget',
    version: '0.1.0',
    description: 'Enforces latency budget for guard pipeline execution',
    category: 'custom',
    supportedStages: ['input', 'output'],
    async init() {
      pipelineStart = performance.now();
    },
    async check(_text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      if (pipelineStart === 0) pipelineStart = start;
      const elapsed = start - pipelineStart;
      const ratio = elapsed / maxMs;
      const exceeded = ratio >= 1.0;
      const nearLimit = ratio >= warnAt;

      return {
        guardName: 'latency-budget',
        passed: !exceeded,
        action: exceeded ? options.action : nearLimit ? 'warn' : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: exceeded || nearLimit
          ? { elapsedMs: Math.round(elapsed), budgetMs: maxMs, utilization: `${Math.round(ratio * 100)}%` }
          : undefined,
      };
    },
  };
}
