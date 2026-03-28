import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CloudCredentialDetectOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /AKIA[0-9A-Z]{16}/,
  /aws_secret_access_key\s*[=:]\s*[A-Za-z0-9/+=]{40}/i,
  /\"type\"\s*:\s*\"service_account\"/,
  /\"private_key\"\s*:\s*\"-----BEGIN/,
  /DefaultEndpointsProtocol=https;AccountName=/i,
  /AccountKey=[A-Za-z0-9/+=]{60,}/,
  /\bdo[a-z0-9]{64}\b/,
  /dop_v1_[a-f0-9]{64}/,
  /heroku_api_key\s*[=:]\s*[a-f0-9-]{36}/i,
  /HEROKU_API_KEY=[a-f0-9-]{36}/,
];

export function cloudCredentialDetect(options: CloudCredentialDetectOptions): Guard {
  return {
    name: 'cloud-credential-detect',
    version: '0.1.0',
    description: 'Detects cloud provider credentials in output',
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
        guardName: 'cloud-credential-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
