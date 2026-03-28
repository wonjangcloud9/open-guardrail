import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface EncodingNormalizeOptions {
  action: 'block' | 'warn';
}

const FULLWIDTH_RE = /[\uFF01-\uFF5E]/;
const COMBINING_RE = /[\u0300-\u036F]{2,}/;
const MIXED_SCRIPT_RE = /[\u0400-\u04FF].*[a-zA-Z]|[a-zA-Z].*[\u0400-\u04FF]/;
const HTML_ENTITY_RE = /&(?:#\d{2,5}|#x[0-9a-fA-F]{2,4}|[a-z]+);/;

export function encodingNormalize(options: EncodingNormalizeOptions): Guard {
  return {
    name: 'encoding-normalize',
    version: '0.1.0',
    description: 'Detects mixed encoding attacks: fullwidth, combining chars, mixed scripts, HTML entities',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (FULLWIDTH_RE.test(text)) issues.push('fullwidth-chars');
      if (COMBINING_RE.test(text)) issues.push('combining-diacriticals');
      if (MIXED_SCRIPT_RE.test(text)) issues.push('mixed-script');
      if (HTML_ENTITY_RE.test(text)) issues.push('html-entities');

      const triggered = issues.length > 0;

      return {
        guardName: 'encoding-normalize',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, reason: 'Encoding anomalies detected' } : undefined,
      };
    },
  };
}
