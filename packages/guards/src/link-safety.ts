import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LinkSafetyOptions {
  action: 'block' | 'warn';
  allowShortened?: boolean;
}

const URL_PATTERN = /https?:\/\/[^\s"'<>]+|data:[^\s"'<>]+|javascript:[^\s"'<>]+/gi;

const SHORTENER_DOMAINS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
  'is.gd', 'buff.ly', 'adf.ly', 'bl.ink', 'short.io',
  'rb.gy', 'cutt.ly', 'shorturl.at',
];

const SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.gq'];

const DATA_URI = /^data:/i;
const JAVASCRIPT_URI = /^javascript:/i;
const IP_URL = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i;
const PUNYCODE = /xn--/i;

export function linkSafety(options: LinkSafetyOptions): Guard {
  const allowShortened = options.allowShortened ?? false;

  return {
    name: 'link-safety',
    version: '0.1.0',
    description: 'Validates links/URLs for safety',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const urls = text.match(URL_PATTERN) || [];
      const issues: string[] = [];

      for (const url of urls) {
        if (DATA_URI.test(url)) issues.push(`data_uri: ${url.slice(0, 30)}`);
        if (JAVASCRIPT_URI.test(url)) issues.push(`javascript_uri: ${url.slice(0, 30)}`);
        if (IP_URL.test(url)) issues.push(`ip_url: ${url.slice(0, 40)}`);
        if (PUNYCODE.test(url)) issues.push(`punycode_homograph: ${url.slice(0, 40)}`);

        const lower = url.toLowerCase();
        if (!allowShortened) {
          for (const domain of SHORTENER_DOMAINS) {
            if (lower.includes(domain)) {
              issues.push(`shortened_url: ${domain}`);
              break;
            }
          }
        }

        for (const tld of SUSPICIOUS_TLDS) {
          if (lower.includes(tld + '/') || lower.endsWith(tld)) {
            issues.push(`suspicious_tld: ${tld}`);
            break;
          }
        }
      }

      const unique = [...new Set(issues)];
      const triggered = unique.length > 0;

      return {
        guardName: 'link-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(unique.length / 3, 1.0) : 0,
        message: triggered ? `Unsafe links detected: ${unique.length} issue(s)` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues: unique, urlCount: urls.length } : undefined,
      };
    },
  };
}
