import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CostGuardOptions {
  action: 'block' | 'warn';
  maxTokens?: number;
  maxCostUsd?: number;
  estimateTokens?: (text: string) => number;
  costPerToken?: number;
}

function defaultEstimate(text: string): number {
  return Math.ceil(text.length / 4);
}

export function costGuard(options: CostGuardOptions): Guard {
  const estimate = options.estimateTokens ?? defaultEstimate;
  const costPerToken = options.costPerToken ?? 0.00001;

  return {
    name: 'cost-guard',
    version: '0.1.0',
    description: 'Token usage and cost limit guard',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const tokens = estimate(text);
      const cost = tokens * costPerToken;
      let triggered = false;
      const reasons: string[] = [];

      if (
        options.maxTokens !== undefined &&
        tokens > options.maxTokens
      ) {
        triggered = true;
        reasons.push(
          `tokens ${tokens} > max ${options.maxTokens}`,
        );
      }

      if (
        options.maxCostUsd !== undefined &&
        cost > options.maxCostUsd
      ) {
        triggered = true;
        reasons.push(
          `cost $${cost.toFixed(6)} > max $${options.maxCostUsd}`,
        );
      }

      return {
        guardName: 'cost-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: { tokens, costUsd: cost, reasons },
      };
    },
  };
}
