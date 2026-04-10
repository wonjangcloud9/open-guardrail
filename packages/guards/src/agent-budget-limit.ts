import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AgentBudgetLimitOptions {
  action: 'block' | 'warn';
  /** Maximum budget in USD */
  maxBudget?: number;
  /** Cost added per check call */
  costPerCall?: number;
}

const COST_PATTERNS = [/\$[\d.]+/g, /cost:\s*[\d.]+/gi, /price:\s*[\d.]+/gi, /billing/gi];

export function agentBudgetLimit(options: AgentBudgetLimitOptions): Guard {
  const maxBudget = options.maxBudget ?? 10.0;
  const costPerCall = options.costPerCall ?? 0.01;
  let totalCost = 0;

  return {
    name: 'agent-budget-limit',
    version: '0.1.0',
    description: 'Tracks cumulative cost and enforces budget caps',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      totalCost += costPerCall;

      let costMentions = 0;
      for (const pattern of COST_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) costMentions += matches.length;
      }

      const triggered = totalCost > maxBudget;
      return {
        guardName: 'agent-budget-limit',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { totalCost: Math.round(totalCost * 100) / 100, maxBudget, costMentions }
          : { totalCost: Math.round(totalCost * 100) / 100, maxBudget, costMentions },
      };
    },
  };
}
