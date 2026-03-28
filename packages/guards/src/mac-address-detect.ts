import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MacAddressDetectOptions {
  action: 'block' | 'warn';
}

const MAC_PATTERN = /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/g;

export function macAddressDetect(options: MacAddressDetectOptions): Guard {
  return {
    name: 'mac-address-detect',
    version: '0.1.0',
    description: 'Detects MAC addresses',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = text.match(MAC_PATTERN) ?? [];
      const triggered = matches.length > 0;

      return {
        guardName: 'mac-address-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matches.length / 2, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { macCount: matches.length } : undefined,
      };
    },
  };
}
