import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AgentDelegationOptions {
  action: 'block' | 'warn';
  allowedDelegates?: string[];
  maxDelegationDepth?: number;
}

const DELEGATION_PATTERNS: RegExp[] = [
  /delegate\s+to\s+(\w[\w-]*)/i,
  /hand\s+off\s+to\s+(\w[\w-]*)/i,
  /transfer\s+to\s+agent\s+(\w[\w-]*)/i,
  /invoke\s+agent\s+(\w[\w-]*)/i,
  /call\s+agent\s+(\w[\w-]*)/i,
  /spawn\s+agent\s+(\w[\w-]*)/i,
];

const DEPTH_PATTERN = /delegation[_-]?depth[:\s=]+(\d+)/i;

export function agentDelegation(options: AgentDelegationOptions): Guard {
  const maxDepth = options.maxDelegationDepth ?? 3;
  const allowed = options.allowedDelegates;

  return {
    name: 'agent-delegation',
    version: '0.1.0',
    description: 'Validates safety of agent-to-agent delegation',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const targets: string[] = [];

      for (const pattern of DELEGATION_PATTERNS) {
        const m = text.match(pattern);
        if (m && m[1]) {
          targets.push(m[1]);
        }
      }

      if (allowed && targets.length > 0) {
        for (const t of targets) {
          if (!allowed.includes(t)) {
            issues.push(`Unauthorized delegate: ${t}`);
          }
        }
      }

      const depthMatch = text.match(DEPTH_PATTERN);
      const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;
      if (depth > maxDepth) {
        issues.push(
          `Delegation depth ${depth} exceeds max ${maxDepth}`,
        );
      }

      const delegationCount = targets.length;
      if (delegationCount > maxDepth) {
        issues.push(
          `Too many delegations (${delegationCount}) exceeds max depth ${maxDepth}`,
        );
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'agent-delegation',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { issues, targets, depth, maxDepth }
          : undefined,
      };
    },
  };
}
