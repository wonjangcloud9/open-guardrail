import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type SecretType =
  | 'env-var'
  | 'connection-string'
  | 'private-key'
  | 'bearer-token'
  | 'basic-auth'
  | 'webhook-url'
  | 'database-url';

interface SecretPatternOptions {
  action: 'block' | 'warn' | 'mask';
  types?: SecretType[];
}

const PATTERNS: Record<SecretType, RegExp> = {
  'env-var': /(?:API_KEY|SECRET|PASSWORD|TOKEN|PRIVATE_KEY|ACCESS_KEY|AUTH)\s*[=:]\s*['"]?[\w\-./+]{8,}['"]?/gi,
  'connection-string': /(?:mongodb|mysql|postgres|postgresql|redis|amqp|mssql):\/\/[^\s'"]+/gi,
  'private-key': /-----BEGIN\s+(?:RSA|DSA|EC|OPENSSH)?\s*PRIVATE\s+KEY-----/gi,
  'bearer-token': /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
  'basic-auth': /Basic\s+[A-Za-z0-9+/]{20,}={0,2}/g,
  'webhook-url': /https:\/\/hooks\.slack\.com\/[^\s'"]+/gi,
  'database-url': /DATABASE_URL\s*[=:]\s*['"]?[^\s'"]+['"]?/gi,
};

const MASK_LABELS: Record<SecretType, string> = {
  'env-var': '[ENV_SECRET]',
  'connection-string': '[CONNECTION_STRING]',
  'private-key': '[PRIVATE_KEY]',
  'bearer-token': '[BEARER_TOKEN]',
  'basic-auth': '[BASIC_AUTH]',
  'webhook-url': '[WEBHOOK_URL]',
  'database-url': '[DATABASE_URL]',
};

interface SecretMatch {
  type: SecretType;
  value: string;
  start: number;
  end: number;
}

const ALL_TYPES: SecretType[] = [
  'env-var', 'connection-string', 'private-key',
  'bearer-token', 'basic-auth', 'webhook-url', 'database-url',
];

function detect(text: string, types: SecretType[]): SecretMatch[] {
  const matches: SecretMatch[] = [];
  for (const type of types) {
    const re = new RegExp(PATTERNS[type].source, PATTERNS[type].flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({
        type,
        value: m[0],
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskText(text: string, matches: SecretMatch[]): string {
  let result = text;
  for (const m of matches) {
    result =
      result.slice(0, m.start) +
      MASK_LABELS[m.type] +
      result.slice(m.end);
  }
  return result;
}

export function secretPattern(options: SecretPatternOptions): Guard {
  const types = options.types ?? ALL_TYPES;

  return {
    name: 'secret-pattern',
    version: '0.1.0',
    description: 'Secret and credential pattern detection',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, types);
      const triggered = matches.length > 0;

      if (!triggered) {
        return {
          guardName: 'secret-pattern',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (options.action === 'mask') {
        return {
          guardName: 'secret-pattern',
          passed: true,
          action: 'override',
          overrideText: maskText(text, matches),
          latencyMs: Math.round(performance.now() - start),
          details: {
            detected: matches.map(({ type }) => ({ type })),
          },
        };
      }

      return {
        guardName: 'secret-pattern',
        passed: false,
        action: options.action,
        message: `Secret detected: ${matches.map((m) => m.type).join(', ')}`,
        latencyMs: Math.round(performance.now() - start),
        details: {
          detected: matches.map(({ type }) => ({ type })),
          reason: 'Text contains credentials, API keys, or connection strings that should not be exposed',
        },
      };
    },
  };
}
