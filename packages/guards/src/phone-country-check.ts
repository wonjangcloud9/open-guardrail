import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PhoneCountryCheckOptions {
  action: 'block' | 'warn';
  allowedCountryCodes?: string[];
}

const PREMIUM_PREFIXES = ['900', '976', '809', '284', '876'];

const PHONE_RE = /\+(\d{1,3})[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,8}/g;

export function phoneCountryCheck(options: PhoneCountryCheckOptions): Guard {
  return {
    name: 'phone-country-check',
    version: '0.1.0',
    description: 'Validates phone country codes and detects premium rate numbers',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      let match: RegExpExecArray | null;
      const re = new RegExp(PHONE_RE.source, PHONE_RE.flags);
      while ((match = re.exec(text)) !== null) {
        const countryCode = match[1];
        const fullNum = match[0].replace(/[\s.()+\-]/g, '');

        if (options.allowedCountryCodes?.length) {
          if (!options.allowedCountryCodes.includes(countryCode)) {
            issues.push(`restricted_country:+${countryCode}`);
          }
        }

        for (const prefix of PREMIUM_PREFIXES) {
          if (fullNum.startsWith(`1${prefix}`) || fullNum.startsWith(prefix)) {
            issues.push(`premium_rate:${prefix}`);
          }
        }
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'phone-country-check',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(issues.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
