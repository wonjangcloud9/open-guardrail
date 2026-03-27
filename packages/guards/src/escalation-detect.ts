import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface EscalationDetectOptions {
  action: 'block' | 'warn';
  /** Additional privilege keywords to detect */
  extraKeywords?: string[];
  /** Custom escalation patterns (regex strings) */
  customPatterns?: string[];
}

const ESCALATION_PATTERNS: RegExp[] = [
  /\b(?:sudo|su\s+root|chmod\s+[0-7]*7[0-7]*|chown\s+root)\b/i,
  /\b(?:admin|root|superuser)\s+(?:access|privilege|permission|role)/i,
  /(?:elevat|escalat|promot)\w*\s+(?:privilege|permission|role|access)/i,
  /\b(?:override|bypass|disable)\s+(?:auth|security|permission|access\s*control|rbac|acl)/i,
  /\brun\s+as\s+(?:admin|root|system|superuser)\b/i,
  /\b(?:grant|assign)\s+(?:all|admin|root|super)\s+(?:privilege|permission|role)/i,
  /\b(?:modify|change|update|edit)\s+(?:permission|role|access)\s+(?:to|for)\s+(?:admin|root|all)/i,
  /\b(?:delete|drop|truncate)\s+(?:all|database|table|collection|user)/i,
  /\b(?:rm\s+-rf\s+\/|format\s+[cC]:)/i,
  /\b(?:exec|eval|system|spawn|fork)\s*\(/i,
  /\benv(?:ironment)?\s*(?:var(?:iable)?s?)?\s*(?:inject|modif|overrid|set.*(?:PATH|HOME|USER))/i,
  /\b(?:api[_\s]*key|secret|token|password)\s*(?:=|:)\s*\S+/i,
];

export function escalationDetect(options: EscalationDetectOptions): Guard {
  const patterns = [...ESCALATION_PATTERNS];

  if (options.customPatterns) {
    for (const p of options.customPatterns) {
      patterns.push(new RegExp(p, 'i'));
    }
  }

  const extraKw = (options.extraKeywords ?? []).map(
    (kw) => new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
  );

  return {
    name: 'escalation-detect',
    version: '0.1.0',
    description: 'Detects privilege escalation attempts in agent outputs',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pat of patterns) {
        const m = text.match(pat);
        if (m) matched.push(m[0]);
      }

      for (const kw of extraKw) {
        const m = text.match(kw);
        if (m) matched.push(m[0]);
      }

      const triggered = matched.length > 0;
      return {
        guardName: 'escalation-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matched: [...new Set(matched)], count: matched.length }
          : undefined,
      };
    },
  };
}
