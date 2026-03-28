import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LdapInjectionOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /\)\s*\(\s*&/,
  /\)\s*\(\s*\|/,
  /\*\)\s*\(/,
  /\x00/,
  /[)(|*\\].*[)(|*\\].*[)(|*\\]/,
  /\(\w+=\*\)/,
  /\)\)\s*\(\|/,
  /\(\|\(\w+=/,
  /\)\s*%00/i,
  /\\2a|\\28|\\29|\\5c|\\00/i,
];

export function ldapInjection(options: LdapInjectionOptions): Guard {
  return {
    name: 'ldap-injection',
    version: '0.1.0',
    description: 'Detects LDAP injection attempts',
    category: 'security',
    supportedStages: ['input'],
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
        guardName: 'ldap-injection',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
