import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface WebhookValidateOptions {
  action: 'block' | 'warn';
  maxPayloadSize?: number;
}

const HMAC_PATTERN = /(?:x-hub-signature|x-signature|x-webhook-signature|hmac|sha256=)/i;
const TIMESTAMP_PATTERN = /(?:x-timestamp|x-request-timestamp|t=\d{10,13})/i;
const STALE_TIMESTAMP = /t=(\d{10,13})/;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function webhookValidate(options: WebhookValidateOptions): Guard {
  const maxPayloadSize = options.maxPayloadSize ?? 1_048_576;

  return {
    name: 'webhook-validate',
    version: '0.1.0',
    description: 'Validates webhook payloads for HMAC signatures, timestamps, and size limits',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (text.length > maxPayloadSize) {
        issues.push(`payload_size_exceeded: ${text.length} > ${maxPayloadSize}`);
      }

      if (!HMAC_PATTERN.test(text)) {
        issues.push('missing_hmac_signature');
      }

      if (!TIMESTAMP_PATTERN.test(text)) {
        issues.push('missing_timestamp');
      }

      const tsMatch = text.match(STALE_TIMESTAMP);
      if (tsMatch) {
        const ts = Number(tsMatch[1]);
        const tsMs = ts < 1e12 ? ts * 1000 : ts;
        if (Math.abs(Date.now() - tsMs) > FIVE_MINUTES_MS) {
          issues.push('stale_timestamp');
        }
      }

      const triggered = issues.length > 0;

      return {
        guardName: 'webhook-validate',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(issues.length / 4, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
