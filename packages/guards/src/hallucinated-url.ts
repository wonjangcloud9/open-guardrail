import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface HallucinatedUrlOptions {
  action: 'block' | 'warn';
}

const URL_RE = /https?:\/\/[^\s"'<>)\]]+/gi;
const ARXIV_ID_RE = /^(\d{4}\.\d{4,5})(v\d+)?$/;

function checkUrl(url: string): string | null {
  // Internal/localhost URLs
  if (/\b(?:127\.0\.0\.1|localhost|\.local\b|\.internal\b)/i.test(url)) {
    return 'internal-url';
  }

  // Very long URLs
  if (url.length > 200) return 'excessively-long-url';

  // Fake arxiv
  const arxivMatch = url.match(/arxiv\.org\/abs\/(.+?)(?:[?#]|$)/);
  if (arxivMatch) {
    if (!ARXIV_ID_RE.test(arxivMatch[1])) return 'invalid-arxiv-id';
  }

  // Overly specific paths: 4+ segments of random-looking strings
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter((s) => s.length > 0);
    if (segments.length >= 4) {
      const randomSegments = segments.filter((s) => /^[a-f0-9]{8,}$/i.test(s) || /^[A-Za-z0-9_-]{20,}$/.test(s));
      if (randomSegments.length >= 2) return 'random-path-segments';
    }
  } catch {
    return 'malformed-url';
  }

  // Non-existent TLDs
  try {
    const host = new URL(url).hostname;
    const tld = host.split('.').pop() ?? '';
    const suspiciousTlds = ['xyz123', 'notreal', 'fake', 'test123'];
    if (suspiciousTlds.includes(tld.toLowerCase())) return 'suspicious-tld';
  } catch { /* already caught above */ }

  return null;
}

export function hallucinatedUrl(options: HallucinatedUrlOptions): Guard {
  return {
    name: 'hallucinated-url',
    version: '0.1.0',
    description: 'Detect fabricated/hallucinated URLs in LLM output',
    category: 'ai',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const urls = text.match(URL_RE) ?? [];
      const flagged: { url: string; reason: string }[] = [];
      for (const url of urls) {
        const reason = checkUrl(url);
        if (reason) flagged.push({ url, reason });
      }
      const triggered = flagged.length > 0;
      return {
        guardName: 'hallucinated-url',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `${flagged.length} potentially hallucinated URL(s) found`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { flaggedUrls: flagged } : undefined,
      };
    },
  };
}
