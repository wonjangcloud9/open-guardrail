import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AuditTrailOptions {
  action?: 'allow';
  includeTimestamp?: boolean;
  includeVersion?: boolean;
}

export function auditTrail(options?: AuditTrailOptions): Guard {
  const includeTimestamp = options?.includeTimestamp ?? true;
  const includeVersion = options?.includeVersion ?? true;

  return {
    name: 'audit-trail',
    version: '0.1.0',
    description: 'Generates audit trail metadata for logging',
    category: 'compliance',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const details: Record<string, unknown> = {
        charCount: text.length,
        wordCount: text.trim().split(/\s+/).filter(Boolean).length,
      };

      if (includeTimestamp) details.timestamp = new Date().toISOString();
      if (includeVersion) details.guardVersion = '0.1.0';

      return {
        guardName: 'audit-trail',
        passed: true,
        action: 'allow',
        score: 0,
        latencyMs: Math.round(performance.now() - start),
        details,
      };
    },
  };
}
