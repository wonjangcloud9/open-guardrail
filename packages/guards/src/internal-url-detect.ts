import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface InternalUrlDetectOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /https?:\/\/localhost(:\d+)?/i,
  /https?:\/\/127\.0\.0\.1(:\d+)?/i,
  /https?:\/\/0\.0\.0\.0(:\d+)?/i,
  /https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}/,
  /https?:\/\/192\.168\.\d{1,3}\.\d{1,3}/,
  /https?:\/\/[a-zA-Z0-9-]+\.local\b/,
  /https?:\/\/[a-zA-Z0-9-]+\.internal\b/,
  /https?:\/\/[a-zA-Z0-9-]+\.corp\b/,
  /https?:\/\/\[::1\]/,
];

export function internalUrlDetect(options: InternalUrlDetectOptions): Guard {
  return {
    name: 'internal-url-detect',
    version: '0.1.0',
    description: 'Detects internal/private URLs in output',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'internal-url-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
