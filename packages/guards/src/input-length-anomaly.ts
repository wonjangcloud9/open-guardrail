import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface InputLengthAnomalyOptions {
  action: 'block' | 'warn';
  minLength?: number;
  maxLength?: number;
}

export function inputLengthAnomaly(options: InputLengthAnomalyOptions): Guard {
  const minLen = options.minLength ?? 3;
  const maxLen = options.maxLength ?? 50000;

  return {
    name: 'input-length-anomaly',
    version: '0.1.0',
    description: 'Detects anomalous input lengths that might indicate attacks',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const len = text.length;

      if (len < minLen) issues.push('too-short');
      if (len > maxLen) issues.push('too-long');

      const triggered = issues.length > 0;

      return {
        guardName: 'input-length-anomaly',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { issues, length: len, minLength: minLen, maxLength: maxLen }
          : undefined,
      };
    },
  };
}
