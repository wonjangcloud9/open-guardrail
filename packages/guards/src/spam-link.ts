import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SpamLinkOptions {
  action: 'block' | 'warn';
  maxUrls?: number;
}

const URL_RE = /https?:\/\/[^\s]+/gi;
const SHORTENER_RE = /https?:\/\/(bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|adf\.ly|shorte\.st)/gi;
const AFFILIATE_RE = /[?&](ref|aff|affiliate|partner|click_?id)=/gi;
const UTM_HEAVY_RE = /utm_[a-z]+=\S+.*utm_[a-z]+=\S+.*utm_[a-z]+=\S+/gi;
const SUSPICIOUS_TLD_RE = /https?:\/\/[^\s]+\.(xyz|top|click|work|loan|racing|gq|ml|cf|tk|buzz)\b/gi;

export function spamLink(options: SpamLinkOptions): Guard {
  const maxUrls = options.maxUrls ?? 3;

  return {
    name: 'spam-link',
    version: '0.1.0',
    description: 'Detects spam link patterns',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      const urls = text.match(URL_RE) ?? [];
      if (urls.length > maxUrls) {
        issues.push(`too_many_urls:${urls.length}`);
      }

      const shorteners = text.match(SHORTENER_RE) ?? [];
      if (shorteners.length >= 2) {
        issues.push(`shorteners:${shorteners.length}`);
      }

      if (AFFILIATE_RE.test(text)) {
        issues.push('affiliate_params');
      }

      if (UTM_HEAVY_RE.test(text)) {
        issues.push('heavy_tracking');
      }

      if (SUSPICIOUS_TLD_RE.test(text)) {
        issues.push('suspicious_tld');
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'spam-link',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, urlCount: urls.length } : undefined,
      };
    },
  };
}
