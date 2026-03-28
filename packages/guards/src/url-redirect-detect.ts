import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface UrlRedirectDetectOptions {
  action: 'block' | 'warn';
}

const REDIRECT_PATTERNS: RegExp[] = [
  /[?&](?:url|redirect|next|returnTo|return_to|goto|dest|destination|redir|continue|forward)\s*=\s*https?:\/\//i,
  /[?&](?:url|redirect|next|returnTo|return_to|goto)\s*=\s*\/\//i,
  /[?&](?:url|redirect)\s*=\s*data:/i,
  /Location:\s*https?:\/\/[^\s]*@/i,
  /https?:\/\/[^\/]*@[^\/]*\//i,
  /(?:url|redirect)\s*=\s*https?:\/\/.*[?&](?:token|key|secret|password|auth)/i,
  /(?:127\.0\.0\.1|localhost|0\.0\.0\.0|169\.254\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)/,
  /(?:url|redirect)\s*=\s*(?:ftp|file|gopher):\/\//i,
];

export function urlRedirectDetect(options: UrlRedirectDetectOptions): Guard {
  return {
    name: 'url-redirect-detect',
    version: '0.1.0',
    description: 'Detects URL redirect attacks including open redirects and SSRF',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of REDIRECT_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'url-redirect-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
