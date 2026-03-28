import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface IbanDetectOptions {
  action: 'block' | 'warn';
}

const IBAN_PATTERN = /\b[A-Z]{2}\d{2}\s?[A-Z0-9]{4}(?:\s?[A-Z0-9]{4}){1,7}(?:\s?[A-Z0-9]{1,4})?\b/g;

export function ibanDetect(options: IbanDetectOptions): Guard {
  return {
    name: 'iban-detect',
    version: '0.1.0',
    description: 'Detects IBAN numbers for European banking',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = text.match(IBAN_PATTERN) ?? [];
      const triggered = matches.length > 0;

      return {
        guardName: 'iban-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? 1.0 : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { ibanCount: matches.length } : undefined,
      };
    },
  };
}
