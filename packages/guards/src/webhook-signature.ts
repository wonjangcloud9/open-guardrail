import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface WebhookSignatureOptions {
  action: 'block' | 'warn';
  maxAgeMs?: number;
}

const SIGNATURE_PATTERNS = {
  missingHubSig: /^(?!.*x-hub-signature)/i,
  missingWebhookSig: /^(?!.*x-webhook-signature)/i,
  timestampOld: /timestamp[=:]\s*(\d+)/i,
  replayNonce: /nonce[=:]\s*(\S+)/i,
  duplicateDelivery: /x-delivery-id[=:]\s*(\S+).*x-delivery-id[=:]\s*\1/is,
};

export function webhookSignature(options: WebhookSignatureOptions): Guard {
  const maxAge = options.maxAgeMs ?? 300000;

  return {
    name: 'webhook-signature',
    version: '0.1.0',
    description: 'Validates webhook signature patterns and detects replay attacks',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (!/x-hub-signature/i.test(text) && /webhook/i.test(text)) {
        issues.push('missing_hub_signature');
      }
      if (!/x-webhook-signature/i.test(text) && /webhook/i.test(text)) {
        issues.push('missing_webhook_signature');
      }

      const tsMatch = text.match(SIGNATURE_PATTERNS.timestampOld);
      if (tsMatch) {
        const ts = parseInt(tsMatch[1], 10);
        const now = Date.now();
        if (now - ts > maxAge) {
          issues.push('timestamp_too_old');
        }
      }

      if (SIGNATURE_PATTERNS.duplicateDelivery.test(text)) {
        issues.push('replay_attack_pattern');
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'webhook-signature',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
