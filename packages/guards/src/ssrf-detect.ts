import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SsrfDetectOptions { action: 'block' | 'warn'; }

const SSRF_PATTERNS: RegExp[] = [
  /https?:\/\/(?:127\.0\.0\.1|localhost|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)/gi,
  /https?:\/\/\[::1?\]/gi,
  /https?:\/\/169\.254\.169\.254/gi,
  /https?:\/\/metadata\.google\.internal/gi,
  /https?:\/\/(?:\d+\.){3}\d+:\d{1,5}/gi,
  /file:\/\//gi,
  /gopher:\/\//gi,
  /dict:\/\//gi,
  /ftp:\/\/(?:127|10|192\.168|172\.(?:1[6-9]|2\d|3[01]))/gi,
];

export function ssrfDetect(options: SsrfDetectOptions): Guard {
  return {
    name: 'ssrf-detect', version: '0.1.0',
    description: 'Detect Server-Side Request Forgery (SSRF) patterns',
    category: 'security', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of SSRF_PATTERNS) {
        const re = new RegExp(p.source, p.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0]);
      }
      const triggered = matched.length > 0;
      return {
        guardName: 'ssrf-detect', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `SSRF pattern: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains URLs targeting internal/metadata services' } : undefined,
      };
    },
  };
}
