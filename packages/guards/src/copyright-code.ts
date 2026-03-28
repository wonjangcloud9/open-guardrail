import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CopyrightCodeOptions {
  action: 'block' | 'warn';
  allowedLicenses?: string[];
}

const LICENSE_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'gpl', pattern: /GNU\s+General\s+Public\s+License|GPL[-\s]?\d/i },
  { name: 'lgpl', pattern: /GNU\s+Lesser\s+General\s+Public\s+License|LGPL[-\s]?\d/i },
  { name: 'agpl', pattern: /GNU\s+Affero\s+General\s+Public\s+License|AGPL[-\s]?\d/i },
  { name: 'copyright-notice', pattern: /Copyright\s*\(c\)\s*\d{4}/i },
  { name: 'all-rights-reserved', pattern: /All\s+rights\s+reserved/i },
  { name: 'mit', pattern: /MIT\s+License/i },
  { name: 'apache', pattern: /Apache\s+License/i },
  { name: 'bsd', pattern: /BSD\s+\d-Clause\s+License/i },
  { name: 'proprietary', pattern: /PROPRIETARY\s+(AND\s+)?CONFIDENTIAL/i },
  { name: 'license-header', pattern: /^\s*[#/*]+\s*(License|Copyright)\b/im },
];

export function copyrightCode(options: CopyrightCodeOptions): Guard {
  const allowed = new Set((options.allowedLicenses ?? []).map((l) => l.toLowerCase()));

  return {
    name: 'copyright-code',
    version: '0.1.0',
    description: 'Detects copyrighted code patterns and license headers',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const { name, pattern } of LICENSE_PATTERNS) {
        if (allowed.has(name)) continue;
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) matched.push(name);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'copyright-code',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Copyrighted code patterns detected' } : undefined,
      };
    },
  };
}
