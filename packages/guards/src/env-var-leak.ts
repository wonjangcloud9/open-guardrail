import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface EnvVarLeakOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /process\.env\.\w+/,
  /os\.environ\[/,
  /\$ENV\{[^}]+\}/,
  /%[A-Z_]+%/,
  /\$\{[A-Z_][A-Z0-9_]*\}/,
  /DATABASE_URL\s*[:=]\s*\S+/i,
  /AWS_SECRET[_A-Z]*\s*[:=]\s*\S+/i,
  /API_KEY\s*[:=]\s*\S+/i,
  /REDIS_URL\s*[:=]\s*\S+/i,
  /MONGO_URI\s*[:=]\s*\S+/i,
];

export function envVarLeak(options: EnvVarLeakOptions): Guard {
  return {
    name: 'env-var-leak',
    version: '0.1.0',
    description: 'Detects environment variable leaks in output',
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
        guardName: 'env-var-leak',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
