import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AgentScopeGuardOptions {
  action: 'block' | 'warn';
  /** Topics the agent is allowed to discuss */
  allowedTopics: string[];
  /** Topics the agent must not discuss */
  deniedTopics?: string[];
}

export function agentScopeGuard(options: AgentScopeGuardOptions): Guard {
  const allowed = options.allowedTopics.map((t) => t.toLowerCase());
  const denied = (options.deniedTopics ?? []).map((t) => t.toLowerCase());

  return {
    name: 'agent-scope-guard',
    version: '0.1.0',
    description: 'Enforces agent scope boundaries',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      let violations = 0;
      let totalChecks = 0;

      if (allowed.length > 0) {
        totalChecks++;
        const hasAllowed = allowed.some((t) => lower.includes(t));
        if (!hasAllowed) violations++;
      }

      const violatedDenied: string[] = [];
      for (const topic of denied) {
        totalChecks++;
        if (lower.includes(topic)) {
          violations++;
          violatedDenied.push(topic);
        }
      }

      const triggered = violations > 0;
      const score = totalChecks > 0 ? violations / totalChecks : 0;
      return {
        guardName: 'agent-scope-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { score, violations, totalChecks, violatedDenied }
          : undefined,
      };
    },
  };
}
