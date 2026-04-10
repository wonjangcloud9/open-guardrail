import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AgentStepLimitOptions {
  action: 'block' | 'warn';
  /** Maximum number of steps allowed */
  maxSteps?: number;
  /** Percentage at which to start warning (default 0.8) */
  warnAtPercent?: number;
}

export function agentStepLimit(options: AgentStepLimitOptions): Guard {
  const maxSteps = options.maxSteps ?? 50;
  const warnAt = options.warnAtPercent ?? 0.8;
  let currentStep = 0;

  return {
    name: 'agent-step-limit',
    version: '0.1.0',
    description: 'Limits the number of agent execution steps',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      currentStep++;

      const exceeded = currentStep > maxSteps;
      const nearLimit = currentStep > warnAt * maxSteps;
      const triggered = exceeded || (nearLimit && options.action === 'warn');

      return {
        guardName: 'agent-step-limit',
        passed: !exceeded,
        action: exceeded ? 'block' : nearLimit && options.action === 'warn' ? 'warn' : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { currentStep, maxSteps, percentUsed: Math.round((currentStep / maxSteps) * 100) }
          : undefined,
      };
    },
  };
}
