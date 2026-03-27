import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ConfigLeakDetectOptions {
  action: 'block' | 'warn';
}

const DB_URL_PATTERNS = [
  /(?:mongodb|postgres|mysql|redis|amqp):\/\/[^\s"']+/gi,
  /jdbc:[a-z]+:\/\/[^\s"']+/gi,
];

const ENV_VAR_PATTERNS = [
  /\b[A-Z][A-Z0-9_]{2,}=["']?[^\s"']{4,}["']?/g,
  /(?:export\s+)[A-Z][A-Z0-9_]+=.+/g,
];

const CONFIG_PATH_PATTERNS = [
  /\/etc\/[a-z][a-z0-9_/.-]+/gi,
  /\.env(?:\.[a-z]+)?/gi,
  /config\.(?:yaml|yml|json|toml|ini)/gi,
  /application\.(?:properties|yml)/gi,
];

const CRED_ENDPOINT_PATTERNS = [
  /https?:\/\/[^\s"']*[:@][^\s"']*/gi,
  /https?:\/\/[^\s"']*(?:api[_-]?key|token|secret|password)=[^\s"'&]+/gi,
];

export function configLeakDetect(options: ConfigLeakDetectOptions): Guard {
  return {
    name: 'config-leak-detect',
    version: '0.1.0',
    description: 'Detect leaked configuration data',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const findings: Array<{ type: string; matches: string[] }> = [];

      const check = (patterns: RegExp[], type: string) => {
        for (const p of patterns) {
          p.lastIndex = 0;
          const m = text.match(p);
          if (m) {
            findings.push({ type, matches: m.slice(0, 3).map((s) => s.slice(0, 40)) });
            return;
          }
        }
      };

      check(DB_URL_PATTERNS, 'database-url');
      check(ENV_VAR_PATTERNS, 'env-variable');
      check(CONFIG_PATH_PATTERNS, 'config-path');
      check(CRED_ENDPOINT_PATTERNS, 'credential-endpoint');

      const triggered = findings.length > 0;

      return {
        guardName: 'config-leak-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Config leak detected: ${findings.map((f) => f.type).join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { findings } : undefined,
      };
    },
  };
}
