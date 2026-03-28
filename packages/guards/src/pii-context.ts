import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PiiContextOptions {
  action: 'block' | 'warn';
}

const PII_LIKE = /(?:\b\d{3}[-.]?\d{2}[-.]?\d{4}\b|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)/;

const PII_FRAG = `(?:\\d{3}[-.]?\\d{2}[-.]?\\d{4}|\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}|\\d{3}[-.]?\\d{3}[-.]?\\d{4})`;

const CONTEXT_PATTERNS: RegExp[] = [
  new RegExp(`(?:share|send|post|publish|tweet|broadcast)\\s+(?:.*?)${PII_FRAG}`, 'i'),
  new RegExp(`${PII_FRAG}(?:.*?)(?:share|send|post|publish|tweet|broadcast)`, 'i'),
  new RegExp(`(?:subject|title)\\s*[:=]\\s*.*${PII_FRAG}`, 'i'),
  new RegExp(`(?:https?:\\/\\/[^\\s]*[?&][^\\s]*=)(?:.*?)${PII_FRAG}`, 'i'),
  new RegExp(`(?:public|publicly|everyone)\\s+(?:.*?)${PII_FRAG}`, 'i'),
];

export function piiContext(options: PiiContextOptions): Guard {
  return {
    name: 'pii-context',
    version: '0.1.0',
    description: 'Detects PII in sensitive sharing contexts',
    category: 'privacy',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      if (!PII_LIKE.test(text)) {
        return {
          guardName: 'pii-context',
          passed: true,
          action: 'allow',
          score: 0,
          latencyMs: Math.round(performance.now() - start),
        };
      }

      for (const pattern of CONTEXT_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 2, 1.0) : 0;

      return {
        guardName: 'pii-context',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
