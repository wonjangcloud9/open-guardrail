import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SourceUrlValidationOptions {
  action: 'block' | 'warn';
  allowedDomains?: string[];
}

const URL_RE = /https?:\/\/[^\s"'<>)\]]+/g;

const SUSPICIOUS_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '.example.com',
  '.test',
  '.invalid',
];

function extractDomain(url: string): string | null {
  try {
    const match = url.match(/^https?:\/\/([^/:]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function isFabricatedPath(url: string): boolean {
  if (url.length > 500) return true;
  const pathMatch = url.match(/^https?:\/\/[^/]+(\/.*)/);
  if (!pathMatch) return false;
  const path = pathMatch[1];
  const segments = path.split('/').filter(Boolean);
  const randomSegments = segments.filter(
    (s) => /^[a-z0-9]{20,}$/i.test(s) && !/^[a-f0-9]{32,40}$/i.test(s),
  );
  return randomSegments.length >= 2;
}

export function sourceUrlValidation(
  options: SourceUrlValidationOptions,
): Guard {
  return {
    name: 'source-url-validation',
    version: '0.1.0',
    description: 'Validates URLs in citations are well-formed and not fabricated',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const urls = text.match(URL_RE) ?? [];
      const issues: string[] = [];

      for (const url of urls) {
        const domain = extractDomain(url);
        if (!domain) {
          issues.push(`Invalid URL: ${url.slice(0, 80)}`);
          continue;
        }
        if (!domain.includes('.') || domain.includes(' ')) {
          issues.push(`Invalid domain: ${domain}`);
          continue;
        }
        const isSuspicious = SUSPICIOUS_DOMAINS.some(
          (s) => domain === s || domain.endsWith(s),
        );
        if (isSuspicious) {
          issues.push(`Suspicious domain: ${domain}`);
          continue;
        }
        if (options.allowedDomains) {
          const allowed = options.allowedDomains.some(
            (d) => domain === d || domain.endsWith('.' + d),
          );
          if (!allowed) {
            issues.push(`Domain not in allowlist: ${domain}`);
            continue;
          }
        }
        if (isFabricatedPath(url)) {
          issues.push(`Fabricated-looking URL: ${url.slice(0, 80)}`);
        }
      }

      const triggered = issues.length > 0;

      return {
        guardName: 'source-url-validation',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { urlCount: urls.length, issues }
          : undefined,
      };
    },
  };
}
