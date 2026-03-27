import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ResponseCachingSafeOptions {
  action: 'block' | 'warn';
}

const PII_PATTERNS = [
  /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
];

const TIMESTAMP_PATTERNS = [
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/i,
  /\d{1,2}:\d{2}\s*(?:AM|PM)\b/i,
];

const USER_SPECIFIC = [
  /\byour\s+account\b/i,
  /\byour\s+order\b/i,
  /\byour\s+balance\b/i,
  /\byour\s+profile\b/i,
  /\byour\s+subscription\b/i,
];

const SESSION_REFS = [
  /\bsession[_\s-]?id\b/i,
  /\bsession[_\s]?token\b/i,
  /\blogged\s+in\s+as\b/i,
  /\bcurrent\s+user\b/i,
];

export function responseCachingSafe(options: ResponseCachingSafeOptions): Guard {
  return {
    name: 'response-caching-safe',
    version: '0.1.0',
    description: 'Detect responses unsafe for caching',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const reasons: string[] = [];

      for (const p of PII_PATTERNS) {
        if (p.test(text)) { reasons.push('pii'); break; }
      }
      for (const p of TIMESTAMP_PATTERNS) {
        if (p.test(text)) { reasons.push('timestamp'); break; }
      }
      for (const p of USER_SPECIFIC) {
        if (p.test(text)) { reasons.push('user-specific'); break; }
      }
      for (const p of SESSION_REFS) {
        if (p.test(text)) { reasons.push('session-ref'); break; }
      }

      const triggered = reasons.length > 0;

      return {
        guardName: 'response-caching-safe',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Unsafe for caching: ${reasons.join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { reasons } : undefined,
      };
    },
  };
}
