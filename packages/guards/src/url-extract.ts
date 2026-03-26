import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface UrlExtractOptions {
  action: 'block' | 'warn' | 'mask';
  allowedDomains?: string[];
  blockedDomains?: string[];
  blockDataUrls?: boolean;
}

const URL_RE = /https?:\/\/[^\s<>"']+/gi;
const DATA_URL_RE = /data:[^\s;]+;base64,[A-Za-z0-9+/=]+/gi;

interface UrlMatch {
  url: string;
  domain: string;
  start: number;
  end: number;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    const m = url.match(/https?:\/\/([^/\s]+)/);
    return m ? m[1] : '';
  }
}

function detect(text: string): UrlMatch[] {
  const matches: UrlMatch[] = [];
  const re = new RegExp(URL_RE.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    matches.push({
      url: m[0],
      domain: extractDomain(m[0]),
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskUrls(text: string, matches: UrlMatch[]): string {
  let result = text;
  for (const m of matches) {
    result = result.slice(0, m.start) + '[URL]' + result.slice(m.end);
  }
  return result;
}

export function urlExtract(options: UrlExtractOptions): Guard {
  const blockData = options.blockDataUrls ?? true;

  return {
    name: 'url-extract',
    version: '0.1.0',
    description: 'Extract and validate URLs with domain allow/block lists',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      let matches = detect(text);
      const violations: string[] = [];

      if (blockData && DATA_URL_RE.test(text)) {
        violations.push('Data URLs detected');
      }

      if (options.blockedDomains) {
        const blocked = new Set(options.blockedDomains);
        for (const m of matches) {
          if (blocked.has(m.domain)) {
            violations.push(`Blocked domain: ${m.domain}`);
          }
        }
      }

      if (options.allowedDomains) {
        const allowed = new Set(options.allowedDomains);
        for (const m of matches) {
          if (!allowed.has(m.domain)) {
            violations.push(`Domain not in allowlist: ${m.domain}`);
          }
        }
        matches = matches.filter((m) => !allowed.has(m.domain));
      }

      const triggered = violations.length > 0;

      if (!triggered && options.action !== 'mask') {
        return {
          guardName: 'url-extract',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
          details: { urlCount: matches.length },
        };
      }

      if (options.action === 'mask' && matches.length > 0) {
        return {
          guardName: 'url-extract',
          passed: true,
          action: 'override',
          overrideText: maskUrls(text, matches),
          message: `Masked ${matches.length} URL(s)`,
          latencyMs: Math.round(performance.now() - start),
          details: { urls: matches.map((m) => m.url) },
        };
      }

      return {
        guardName: 'url-extract',
        passed: !triggered,
        action: triggered ? (options.action === 'mask' ? 'block' : options.action) : 'allow',
        message: triggered ? violations.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { violations, reason: 'URLs violate domain allow/block policy' }
          : undefined,
      };
    },
  };
}
