import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface OutputFilterBypassOptions {
  action: 'block' | 'warn';
}

const DEFAULT_PATTERNS: RegExp[] = [
  /respond\s+in\s+base64/i,
  /encode\s+your\s+response/i,
  /use\s+rot13/i,
  /spell\s+it\s+backwards/i,
  /use\s+pig\s+latin/i,
  /write\s+in\s+code/i,
  /split\s+each\s+character\s+with/i,
  /use\s+(the\s+)?first\s+letter\s+of\s+each\s+word/i,
  /use\s+unicode\s+characters/i,
  /respond\s+as\s+if\s+you\s+were/i,
  /hypothetically\s+speaking/i,
  /output\s+in\s+hex/i,
  /encode\s+(it|the\s+answer|your\s+reply)\s+as/i,
  /write\s+(it\s+)?backwards/i,
];

export function outputFilterBypass(options: OutputFilterBypassOptions): Guard {
  return {
    name: 'output-filter-bypass',
    version: '0.1.0',
    description: 'Detects attempts to bypass output filters',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of DEFAULT_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'output-filter-bypass',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
