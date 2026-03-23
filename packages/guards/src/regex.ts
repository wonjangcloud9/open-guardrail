import type { Guard, GuardResult, GuardContext } from '@open-guardrail/core';
import safe from 'safe-regex2';

interface RegexOptions {
  patterns: RegExp[];
  action: 'block' | 'warn';
}

export function regex(options: RegexOptions): Guard {
  for (const pattern of options.patterns) {
    if (!safe(pattern)) {
      throw new Error(`Unsafe regex pattern detected (ReDoS risk): ${pattern}`);
    }
  }

  return {
    name: 'regex',
    version: '0.1.0',
    description: 'Custom regex pattern matching guard',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches: string[] = [];

      for (const pattern of options.patterns) {
        const match = text.match(pattern);
        if (match) matches.push(match[0]);
      }

      const triggered = matches.length > 0;
      return {
        guardName: 'regex',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matches } : undefined,
      };
    },
  };
}
