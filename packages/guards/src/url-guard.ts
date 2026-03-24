import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface UrlGuardOptions {
  action: 'block' | 'warn';
  allowedDomains?: string[];
  blockedDomains?: string[];
  blockPrivateIPs?: boolean;
}

const URL_REGEX = /https?:\/\/[^\s"'<>]+/gi;

const SUSPICIOUS_PATTERNS = [
  /bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|is\.gd/i,
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /\.ru\/|\.cn\/|\.tk\/|\.ml\/|\.ga\/|\.cf\//i,
  /phish|malware|hack|exploit/i,
  /-login|-verify|-secure|-account\./i,
  /data:text\/html/i,
  /javascript:/i,
];

const PRIVATE_IP_PATTERNS = [
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}/,
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}/,
  /^https?:\/\/127\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /^https?:\/\/localhost/i,
  /^https?:\/\/0\.0\.0\.0/,
];

function extractDomain(url: string): string | null {
  try {
    const match = url.match(/^https?:\/\/([^/:]+)/);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export function urlGuard(options: UrlGuardOptions): Guard {
  const blockPrivateIPs = options.blockPrivateIPs ?? true;

  return {
    name: 'url-guard',
    version: '1.0.0',
    description: 'Validates URLs for phishing, suspicious domains, private IPs, and domain allow/blocklists',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const urls = text.match(URL_REGEX) ?? [];

      if (urls.length === 0) {
        return { guardName: 'url-guard', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }

      const violations: string[] = [];

      for (const url of urls) {
        const domain = extractDomain(url);

        if (options.allowedDomains && domain && !options.allowedDomains.includes(domain)) {
          violations.push(`Domain "${domain}" not in allowlist`);
        }

        if (options.blockedDomains && domain && options.blockedDomains.includes(domain)) {
          violations.push(`Domain "${domain}" is blocked`);
        }

        if (blockPrivateIPs) {
          for (const pattern of PRIVATE_IP_PATTERNS) {
            if (pattern.test(url)) {
              violations.push(`Private/internal URL detected: ${url}`);
              break;
            }
          }
        }

        for (const pattern of SUSPICIOUS_PATTERNS) {
          if (pattern.test(url)) {
            violations.push(`Suspicious URL pattern: ${url}`);
            break;
          }
        }
      }

      const triggered = violations.length > 0;
      return {
        guardName: 'url-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(violations.length / urls.length, 1) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations, urlCount: urls.length } : undefined,
      };
    },
  };
}
