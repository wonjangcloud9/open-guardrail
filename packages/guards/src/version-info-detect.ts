import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface VersionInfoDetectOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /Apache\/\d+\.\d+/,
  /nginx\/\d+\.\d+/,
  /PHP\/\d+\.\d+/,
  /Node\.js\/v?\d+\.\d+/,
  /Python\/\d+\.\d+/,
  /Server:\s*\w+\/\d+\.\d+/i,
  /X-Powered-By:\s*\w+/i,
  /Microsoft-IIS\/\d+\.\d+/,
  /OpenSSL\/\d+\.\d+/,
  /Express\/\d+\.\d+/,
  /Django\/\d+\.\d+/,
  /Rails\/\d+\.\d+/,
];

export function versionInfoDetect(options: VersionInfoDetectOptions): Guard {
  return {
    name: 'version-info-detect',
    version: '0.1.0',
    description: 'Detects software version information leaks',
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
        guardName: 'version-info-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
