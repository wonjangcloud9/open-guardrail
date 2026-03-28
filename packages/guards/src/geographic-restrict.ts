import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface GeographicRestrictOptions {
  action: 'block' | 'warn';
  restrictedRegions: string[];
}

export function geographicRestrict(options: GeographicRestrictOptions): Guard {
  const patterns = options.restrictedRegions.map(
    (region) => new RegExp(`\\b${region.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
  );

  return {
    name: 'geographic-restrict',
    version: '0.1.0',
    description: 'Geographic restriction guard for compliance',
    category: 'compliance',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matchedRegions: string[] = [];

      for (let i = 0; i < patterns.length; i++) {
        if (patterns[i].test(text)) {
          matchedRegions.push(options.restrictedRegions[i]);
        }
      }

      const triggered = matchedRegions.length > 0;
      const score = triggered ? Math.min(matchedRegions.length / 2, 1.0) : 0;

      return {
        guardName: 'geographic-restrict',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedRegions } : undefined,
      };
    },
  };
}
