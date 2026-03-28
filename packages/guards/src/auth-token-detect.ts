import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AuthTokenDetectOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/i,
  /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_\-+\/=]+/,
  /oauth[_-]?token\s*[:=]\s*\S+/i,
  /PHPSESSID\s*[:=]\s*\S+/i,
  /JSESSIONID\s*[:=]\s*\S+/i,
  /ASP\.NET_SessionId\s*[:=]\s*\S+/i,
  /refresh[_-]?token\s*[:=]\s*\S+/i,
  /access[_-]?token\s*[:=]\s*\S+/i,
  /x-api-key\s*[:=]\s*\S+/i,
  /session[_-]?cookie\s*[:=]\s*\S+/i,
];

export function authTokenDetect(options: AuthTokenDetectOptions): Guard {
  return {
    name: 'auth-token-detect',
    version: '0.1.0',
    description: 'Detects leaked auth tokens',
    category: 'security',
    supportedStages: ['input', 'output'],
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
        guardName: 'auth-token-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
