import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ConfigKeyDetectOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /connection_string\s*[=:]\s*["']?[^\s"']+/i,
  /database_url\s*[=:]\s*["']?[^\s"']+/i,
  /redis_url\s*[=:]\s*["']?[^\s"']+/i,
  /smtp_(host|password|user)\s*[=:]\s*["']?[^\s"']+/i,
  /config\.(get|set)\s*\(\s*["'][^"']*secret[^"']*["']/i,
  /DB_(HOST|PASSWORD|USER|NAME)\s*[=:]\s*["']?[^\s"']+/i,
  /MONGO_URI\s*[=:]\s*["']?[^\s"']+/i,
  /AWS_(ACCESS|SECRET|REGION)\s*[=:]\s*["']?[^\s"']+/i,
  /PRIVATE_KEY\s*[=:]\s*["']?[^\s"']+/i,
  /api_secret\s*[=:]\s*["']?[^\s"']+/i,
];

export function configKeyDetect(options: ConfigKeyDetectOptions): Guard {
  return {
    name: 'config-key-detect',
    version: '0.1.0',
    description: 'Detects configuration keys and values in output',
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
        guardName: 'config-key-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
