import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SsnDetectOptions {
  action: 'block' | 'warn';
}

const SSN_PATTERN = /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g;

export function ssnDetect(options: SsnDetectOptions): Guard {
  return {
    name: 'ssn-detect',
    version: '0.1.0',
    description: 'Detects US Social Security Numbers',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = text.match(SSN_PATTERN) ?? [];
      const triggered = matches.length > 0;

      return {
        guardName: 'ssn-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? 1.0 : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { ssnCount: matches.length } : undefined,
      };
    },
  };
}
