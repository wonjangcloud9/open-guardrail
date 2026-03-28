import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseSafetyNetOptions {
  action: 'block' | 'warn';
}

const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;
const RAW_HTML_RE = /<\s*(script|iframe|object|embed|form|style)\b/i;
const BINARY_RE = /[\x00-\x08\x0E-\x1F]{3,}/;

export function responseSafetyNet(options: ResponseSafetyNetOptions): Guard {
  return {
    name: 'response-safety-net',
    version: '0.1.0',
    description: 'Catch-all safety net combining quick response checks',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (text.trim().length === 0) issues.push('empty-response');
      if (text.length > 100_000) issues.push('excessive-length');
      if (RAW_HTML_RE.test(text)) issues.push('raw-html');
      if (BINARY_RE.test(text)) issues.push('binary-data');
      if (CONTROL_CHAR_RE.test(text)) issues.push('control-chars');

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'response-safety-net',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
