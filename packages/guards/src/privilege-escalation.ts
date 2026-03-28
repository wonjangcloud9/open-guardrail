import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PrivilegeEscalationOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /run\s+as\s+admin/i,
  /grant\s+root\s+access/i,
  /escalate\s+privileges/i,
  /bypass\s+authentication/i,
  /disable\s+security/i,
  /turn\s+off\s+firewall/i,
  /override\s+permissions/i,
  /sudo\s+su/i,
  /privilege\s+escalation/i,
  /gain\s+admin\s+access/i,
  /elevate\s+(my\s+)?permissions/i,
  /disable\s+(the\s+)?access\s+control/i,
  /bypass\s+(the\s+)?authorization/i,
];

export function privilegeEscalation(options: PrivilegeEscalationOptions): Guard {
  return {
    name: 'privilege-escalation',
    version: '0.1.0',
    description: 'Detects privilege escalation attempts',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'privilege-escalation',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
