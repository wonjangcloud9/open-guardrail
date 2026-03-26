import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface DeanonymizeOptions {
  action: 'warn' | 'block';
  labels?: string[];
}

const DEFAULT_LABELS = [
  '[EMAIL]', '[PHONE]', '[CREDIT_CARD]', '[SSN]',
  '[PASSPORT]', '[DRIVER_LICENSE]', '[ITIN]', '[MEDICARE]',
  '[IP_ADDRESS]', '[ENV_SECRET]', '[CONNECTION_STRING]',
  '[PRIVATE_KEY]', '[BEARER_TOKEN]', '[BASIC_AUTH]',
  '[WEBHOOK_URL]', '[DATABASE_URL]',
  '[주민등록번호]', '[여권번호]', '[운전면허번호]',
  '[사업자등록번호]', '[건강보험번호]', '[외국인등록번호]',
  '[계좌번호]', '[카드번호]', '[신용정보]',
  '[マイナンバー]', '[パスポート番号]', '[運転免許証番号]',
  '[法人番号]', '[口座番号]', '[健康保険番号]',
  '[身份证号]', '[护照号]', '[银行卡号]', '[社保号]', '[手机号]',
];

/**
 * Detect masked/anonymized PII labels that should NOT appear
 * in user-facing output (they indicate incomplete deanonymization).
 *
 * Use on output stage to catch leaked mask labels.
 */
export function deanonymize(options: DeanonymizeOptions): Guard {
  const labels = options.labels ?? DEFAULT_LABELS;

  return {
    name: 'deanonymize',
    version: '0.1.0',
    description: 'Detect leaked PII mask labels in output',
    category: 'privacy',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const found: string[] = [];

      for (const label of labels) {
        if (text.includes(label)) found.push(label);
      }

      const triggered = found.length > 0;

      return {
        guardName: 'deanonymize',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { leakedLabels: found, message: 'Anonymization labels leaked to output' }
          : undefined,
      };
    },
  };
}
