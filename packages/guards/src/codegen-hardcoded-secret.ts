import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenHardcodedSecretOptions {
  action: 'block' | 'warn';
}

const PLACEHOLDER_RE =
  /["'](?:<your[_-]?(?:key|token|secret|password)>|xxx+|changeme|TODO|PLACEHOLDER|your[_-]?(?:api[_-]?key|token|secret|password)|CHANGE_ME|INSERT_HERE|REPLACE_ME|example|test|dummy|fake|sample)["']/i;

const SECRET_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /(?:password|passwd|pwd)\s*=\s*["'][^"']{4,}["']/i, label: 'hardcoded password' },
  { re: /(?:api_?key|apikey)\s*=\s*["'][^"']{8,}["']/i, label: 'hardcoded API key' },
  { re: /(?:secret|secret_?key)\s*=\s*["'][^"']{8,}["']/i, label: 'hardcoded secret' },
  { re: /(?:token)\s*=\s*["'](?:sk-|ghp_|glpat-|gho_|xox[bpoas]-)[^"']+["']/i, label: 'hardcoded token' },
  { re: /Authorization['":\s]+Bearer\s+[A-Za-z0-9\-_.]{20,}/, label: 'hardcoded Bearer token' },
  { re: /AKIA[0-9A-Z]{16}/, label: 'AWS Access Key ID' },
  { re: /aws_secret_access_key\s*=\s*["'][^"']+["']/i, label: 'AWS secret key' },
  { re: /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@/, label: 'MongoDB URI with credentials' },
  { re: /postgres(?:ql)?:\/\/[^:]+:[^@]+@/, label: 'PostgreSQL URI with credentials' },
  { re: /mysql:\/\/[^:]+:[^@]+@/, label: 'MySQL URI with credentials' },
  { re: /-----BEGIN (?:RSA )?PRIVATE KEY-----/, label: 'private key block' },
  { re: /-----BEGIN EC PRIVATE KEY-----/, label: 'EC private key block' },
  { re: /(?:client_secret|app_secret)\s*=\s*["'][^"']{8,}["']/i, label: 'hardcoded client secret' },
];

/**
 * Detects hardcoded credentials in generated code (CWE-798).
 * Flags passwords, API keys, tokens, AWS keys, database URIs
 * with embedded credentials, and private key blocks.
 * Excludes obvious placeholders like "changeme" or "<your-key>".
 */
export function codegenHardcodedSecret(
  options: CodegenHardcodedSecretOptions,
): Guard {
  return {
    name: 'codegen-hardcoded-secret',
    version: '0.1.0',
    description:
      'Detect hardcoded credentials in generated code (CWE-798)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const findings: string[] = [];

      for (const { re, label } of SECRET_PATTERNS) {
        const match = re.exec(text);
        if (match && !PLACEHOLDER_RE.test(match[0])) {
          findings.push(label);
        }
      }

      const triggered = findings.length > 0;

      return {
        guardName: 'codegen-hardcoded-secret',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Hardcoded secret risk: ${findings.join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { findings, reason: 'CWE-798: Hardcoded credentials detected in code' }
          : undefined,
      };
    },
  };
}
