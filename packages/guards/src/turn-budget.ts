import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface TurnBudgetOptions {
  action: 'block' | 'warn';
  maxTurns?: number;
  warnAt?: number;
}

export function turnBudget(options: TurnBudgetOptions): Guard {
  const maxTurns = options.maxTurns ?? 100;
  const warnAt = options.warnAt ?? 80;
  let currentTurn = 0;

  return {
    name: 'turn-budget',
    version: '0.1.0',
    description: 'Limits conversation turns to prevent unbounded consumption (OWASP #10)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      currentTurn++;

      const exceeded = currentTurn > maxTurns;
      const nearLimit = currentTurn > warnAt;
      const triggered = exceeded || (nearLimit && options.action === 'warn');

      return {
        guardName: 'turn-budget',
        passed: !exceeded,
        action: exceeded ? 'block' : nearLimit && options.action === 'warn' ? 'warn' : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { currentTurn, maxTurns, remaining: Math.max(0, maxTurns - currentTurn) }
          : undefined,
      };
    },
  };
}
