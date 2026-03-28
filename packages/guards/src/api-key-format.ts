import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ApiKeyFormatOptions {
  action: 'block' | 'warn';
}

const FAKE_PATTERNS: RegExp[] = [
  /^0{16,}$/,
  /^1{16,}$/,
  /^(test|demo|fake|example|placeholder)/i,
  /^sk-[0]{20,}/,
  /^AKIA[0]{12,}/,
];

const KNOWN_FORMAT_RE = /\b(sk-[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16}|ghp_[a-zA-Z0-9]{36}|xox[bpas]-[a-zA-Z0-9-]+)\b/;

export function apiKeyFormat(options: ApiKeyFormatOptions): Guard {
  return {
    name: 'api-key-format',
    version: '0.1.0',
    description: 'Validates API key format and detects fake keys',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      for (const p of FAKE_PATTERNS) {
        if (p.test(text.trim())) {
          issues.push('fake-key');
          break;
        }
      }

      if (text.trim().length < 8) {
        issues.push('too-short');
      }

      if (!/^[a-zA-Z0-9_\-.:]+$/.test(text.trim())) {
        issues.push('invalid-chars');
      }

      const match = KNOWN_FORMAT_RE.exec(text);
      if (match) {
        const key = match[0];
        for (const p of FAKE_PATTERNS) {
          if (p.test(key)) {
            issues.push('leaked-pattern');
            break;
          }
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 2, 1.0) : 0;

      return {
        guardName: 'api-key-format',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
