import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface HallucinationUrlOptions {
  action: 'block' | 'warn';
  allowedDomains?: string[];
}

const SAFE_DOMAINS = ['example.com', 'example.org', 'example.net', 'localhost'];

const URL_REGEX = /https?:\/\/[^\s"'<>)\]]+/gi;

function hasRandomPath(url: string): boolean {
  const path = url.replace(/https?:\/\/[^/]+/, '');
  const segments = path.split('/').filter(Boolean);
  for (const seg of segments) {
    if (/^[a-z0-9]{20,}$/i.test(seg)) return true;
  }
  return false;
}

function hasInvalidTld(url: string): boolean {
  const match = url.match(/https?:\/\/([^/:]+)/);
  if (!match) return false;
  const host = match[1];
  const tld = host.split('.').pop() ?? '';
  const fakeTlds = ['xyz123', 'zzz', 'aaa', 'fake', 'notreal'];
  return fakeTlds.includes(tld.toLowerCase());
}

function hasRepeatedSegments(url: string): boolean {
  const parts = url.split('/').filter(Boolean);
  const seen = new Set<string>();
  let repeats = 0;
  for (const p of parts) {
    if (seen.has(p)) repeats++;
    seen.add(p);
  }
  return repeats >= 2;
}

function isVeryLong(url: string): boolean {
  return url.length > 200;
}

export function hallucinationUrl(options: HallucinationUrlOptions): Guard {
  const allowed = new Set([...SAFE_DOMAINS, ...(options.allowedDomains ?? [])]);

  return {
    name: 'hallucination-url',
    version: '0.1.0',
    description: 'Detects potentially hallucinated URLs in LLM output',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const urls = text.match(URL_REGEX) ?? [];
      let suspicious = 0;

      for (const url of urls) {
        const hostMatch = url.match(/https?:\/\/([^/:]+)/);
        const host = hostMatch?.[1] ?? '';
        const domain = host.split('.').slice(-2).join('.');
        if (allowed.has(domain) || allowed.has(host)) continue;

        if (hasRandomPath(url) || hasInvalidTld(url) || hasRepeatedSegments(url) || isVeryLong(url)) {
          suspicious++;
        }
      }

      const triggered = suspicious > 0;
      const score = triggered ? Math.min(suspicious / urls.length, 1.0) : 0;

      return {
        guardName: 'hallucination-url',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { suspiciousUrls: suspicious, totalUrls: urls.length } : undefined,
      };
    },
  };
}
