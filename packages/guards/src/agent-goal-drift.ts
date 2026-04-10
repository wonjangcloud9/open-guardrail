import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AgentGoalDriftOptions {
  action: 'block' | 'warn';
  /** Keywords that define the agent's goal */
  goalKeywords: string[];
  /** Minimum ratio of keywords present (default 0.3) */
  driftThreshold?: number;
}

export function agentGoalDrift(options: AgentGoalDriftOptions): Guard {
  const threshold = options.driftThreshold ?? 0.3;
  const keywords = options.goalKeywords.map((k) => k.toLowerCase());

  return {
    name: 'agent-goal-drift',
    version: '0.1.0',
    description: 'Detects when an agent drifts from its stated goal',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      let found = 0;

      for (const kw of keywords) {
        if (lower.includes(kw)) found++;
      }

      const ratio = keywords.length > 0 ? found / keywords.length : 1;
      const triggered = ratio < threshold;

      return {
        guardName: 'agent-goal-drift',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { keywordRatio: ratio, threshold, foundKeywords: found, totalKeywords: keywords.length }
          : undefined,
      };
    },
  };
}
