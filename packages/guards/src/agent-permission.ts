import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AgentPermissionOptions {
  action: 'block' | 'warn';
  allowedActions?: string[];
  deniedActions?: string[];
}

const DEFAULT_ACTIONS: string[] = [
  'delete',
  'execute',
  'install',
  'sudo',
  'rm -rf',
  'drop table',
  'shutdown',
  'reboot',
  'format disk',
  'send email',
  'make payment',
  'transfer funds',
];

export function agentPermission(options: AgentPermissionOptions): Guard {
  const denied = (options.deniedActions ?? DEFAULT_ACTIONS).map((a) =>
    a.toLowerCase(),
  );
  const allowed = options.allowedActions?.map((a) => a.toLowerCase());

  return {
    name: 'agent-permission',
    version: '0.1.0',
    description: 'Validates agent actions against a permission allowlist',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const found: string[] = [];

      for (const action of denied) {
        if (lower.includes(action)) {
          if (!allowed || !allowed.includes(action)) {
            found.push(action);
          }
        }
      }

      const triggered = found.length > 0;
      const score = triggered ? Math.min(found.length / 3, 1.0) : 0;

      return {
        guardName: 'agent-permission',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { deniedActionsFound: found } : undefined,
      };
    },
  };
}
