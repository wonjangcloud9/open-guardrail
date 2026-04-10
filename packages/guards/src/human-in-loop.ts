import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface HumanInLoopOptions {
  action: 'block' | 'warn';
  sensitivePatterns?: string[];
  approvalMarkers?: string[];
}

const DEFAULT_SENSITIVE: string[] = [
  'delete',
  'payment',
  'transfer',
  'deploy',
  'publish',
  'execute',
  'send_email',
  'modify_production',
];

const DEFAULT_APPROVAL: string[] = [
  '[APPROVED]',
  '[HUMAN_CONFIRMED]',
  '[USER_CONSENT]',
  'approved_by:',
];

export function humanInLoop(options: HumanInLoopOptions): Guard {
  const sensitive = options.sensitivePatterns ?? DEFAULT_SENSITIVE;
  const approval = options.approvalMarkers ?? DEFAULT_APPROVAL;

  return {
    name: 'human-in-loop',
    version: '0.1.0',
    description:
      'Detects whether sensitive operations have human approval markers',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();

      const matched = sensitive.filter((p) =>
        lower.includes(p.toLowerCase()),
      );
      const hasSensitive = matched.length > 0;
      const hasApproval = approval.some((m) =>
        text.includes(m),
      );

      const triggered = hasSensitive && !hasApproval;
      return {
        guardName: 'human-in-loop',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              sensitiveOperations: matched,
              approvalFound: false,
            }
          : undefined,
      };
    },
  };
}
