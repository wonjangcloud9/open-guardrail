import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface SecretScanningOptions {
  action: 'block' | 'warn';
}

const SECRET_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'aws_access_key', pattern: /AKIA[0-9A-Z]{16}/ },
  {
    name: 'aws_secret_key',
    pattern: /(?:aws_secret|secret_key)\s*[:=]\s*\S{20,}/i,
  },
  {
    name: 'gcp_service_account',
    pattern: /"type"\s*:\s*"service_account"/,
  },
  { name: 'gcp_api_key', pattern: /AIza[0-9A-Za-z_-]{35}/ },
  {
    name: 'azure_key',
    pattern: /(?:AccountKey|azure_key)\s*[:=]\s*\S{20,}/i,
  },
  {
    name: 'private_key',
    pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  },
  {
    name: 'jwt_token',
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./,
  },
  {
    name: 'database_url',
    pattern:
      /(?:postgres|mysql|mongodb|redis):\/\/[^\s"']+:[^\s"']+@/i,
  },
  {
    name: 'env_secret',
    pattern:
      /(?:PASSWORD|SECRET|TOKEN|API_KEY)\s*[:=]\s*['"]?\S{8,}/i,
  },
];

export function secretScanning(
  options: SecretScanningOptions,
): Guard {
  return {
    name: 'secret-scanning',
    version: '0.1.0',
    description:
      'Detects secrets: AWS/GCP/Azure keys, JWTs, private keys, DB URLs',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const found = SECRET_PATTERNS
        .filter((p) => p.pattern.test(text))
        .map((p) => p.name);
      const triggered = found.length > 0;

      return {
        guardName: 'secret-scanning',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { secretTypes: found }
          : undefined,
      };
    },
  };
}
