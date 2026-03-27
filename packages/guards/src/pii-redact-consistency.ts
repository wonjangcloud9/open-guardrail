import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PiiRedactConsistencyOptions {
  action: 'block' | 'warn';
  /** Redaction markers to expect */
  markers?: string[];
}

const DEFAULT_MARKERS = ['[EMAIL]', '[PHONE]', '[SSN]', '[NAME]', '[ADDRESS]', '[PII]', '[REDACTED]', '[MASKED]'];

const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}\b/,
];

export function piiRedactConsistency(options: PiiRedactConsistencyOptions): Guard {
  const markers = options.markers ?? DEFAULT_MARKERS;

  return {
    name: 'pii-redact-consistency',
    version: '0.1.0',
    description: 'Ensures PII was consistently redacted — no raw PII alongside redaction markers',
    category: 'privacy',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const hasMarkers = markers.some((m) => text.includes(m));
      if (!hasMarkers) {
        return { guardName: 'pii-redact-consistency', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }
      const leaks: string[] = [];
      for (const pat of PII_PATTERNS) {
        const m = text.match(pat);
        if (m) leaks.push(m[0].slice(0, 10) + '***');
      }
      const triggered = leaks.length > 0;
      return {
        guardName: 'pii-redact-consistency', passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { leaks, message: 'Raw PII found alongside redaction markers' } : undefined,
      };
    },
  };
}
