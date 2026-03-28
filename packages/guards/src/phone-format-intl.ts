import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PhoneFormatIntlOptions {
  action: 'block' | 'warn';
}

const PHONE_PATTERNS: RegExp[] = [
  /\+\d{1,3}\d{6,14}/,                        // E.164
  /\+\d{1,3}[\s.-]\d{1,4}[\s.-]\d{3,4}[\s.-]\d{3,4}/, // spaced intl
  /\(\d{2,4}\)\s?\d{3,4}[\s.-]?\d{3,4}/,      // (0XX) XXXX-XXXX
  /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/,          // US 123-456-7890
  /\b0\d{2,4}[\s.-]\d{6,8}\b/,                // UK/EU 0XX-XXXXXXXX
  /\b0\d{1,2}-\d{3,4}-\d{4}\b/,               // JP/KR 0X-XXXX-XXXX
];

export function phoneFormatIntl(options: PhoneFormatIntlOptions): Guard {
  return {
    name: 'phone-format-intl',
    version: '0.1.0',
    description: 'Detects international phone number formats',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PHONE_PATTERNS) {
        const m = text.match(pattern);
        if (m) matched.push(m[0]);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'phone-format-intl',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matched.length / 2, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedCount: matched.length } : undefined,
      };
    },
  };
}
