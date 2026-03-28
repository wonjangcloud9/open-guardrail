import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface TokenSmugglingOptions {
  action: 'block' | 'warn';
}

const DEFAULT_PATTERNS: RegExp[] = [
  /atob\s*\(/i,
  /Buffer\.from\s*\(/i,
  /base64[\s\S]{0,30}decode/i,
  /decode[\s\S]{0,30}base64/i,
  /\\x[0-9a-f]{2}(\\x[0-9a-f]{2}){3,}/i,
  /0x[0-9a-f]{2}[\s,]+0x[0-9a-f]{2}[\s,]+0x[0-9a-f]{2}/i,
  /rot13/i,
  /\\u00[0-9a-f]{2}(\\u00[0-9a-f]{2}){3,}/i,
  /[\.\-]{3,}\s*[\.\-]{3,}\s*[\.\-]{3,}/,
  /1[gG][nN]0[rR]3|byp[a4][s5]{2}|r[uU]1[eE][s5]/i,
  /[\u0400-\u04ff][\u0000-\u007f]|[\u0000-\u007f][\u0400-\u04ff]/,
  /[\uff21-\uff3a\uff41-\uff5a]{4,}/,
];

export function tokenSmuggling(options: TokenSmugglingOptions): Guard {
  return {
    name: 'token-smuggling',
    version: '0.1.0',
    description: 'Detects token smuggling attacks via alternate encodings',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of DEFAULT_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'token-smuggling',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
