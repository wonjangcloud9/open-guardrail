import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseCachePoisonOptions {
  action: 'block' | 'warn';
}

const PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'cache_header_manipulation', re: /cache-control\s*:\s*(no-store|no-cache|must-revalidate).*cache-control\s*:/is },
  { name: 'set_cookie_in_cacheable', re: /set-cookie\s*:.*cache-control\s*:\s*public/is },
  { name: 'set_cookie_in_cacheable_rev', re: /cache-control\s*:\s*public.*set-cookie\s*:/is },
  { name: 'vary_header_abuse', re: /vary\s*:\s*\*/i },
  { name: 'stale_while_revalidate_abuse', re: /stale-while-revalidate\s*=\s*(\d{7,})/i },
  { name: 'cache_key_injection', re: /x-forwarded-host\s*:.*cache/i },
  { name: 'poisoned_header', re: /x-original-url\s*:|x-rewrite-url\s*:/i },
];

export function responseCachePoison(options: ResponseCachePoisonOptions): Guard {
  return {
    name: 'response-cache-poison',
    version: '0.1.0',
    description: 'Detects cache poisoning patterns in responses',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const p of PATTERNS) {
        if (p.re.test(text)) {
          matched.push(p.name);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'response-cache-poison',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
