import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface InputEncodingCheckOptions {
  action: 'block' | 'warn';
}

const BOM_PATTERNS = [
  /^\uFEFF/, // UTF-8 BOM
  /^\uFFFE/, // UTF-16 LE BOM marker
];

const NULL_BYTE_RE = /\x00/;

const OVERLONG_PATTERNS = [
  /\\xc0\\x80/, // overlong null
  /\\xe0\\x80\\x80/, // 3-byte overlong
  /%c0%80/i, // URL-encoded overlong
];

const MIXED_ENCODING_RE = /(?:[\xc0-\xdf][\x80-\xbf].*[\x80-\xbf]{3})|(?:\\u[0-9a-f]{4}.*\\x[0-9a-f]{2})/i;

export function inputEncodingCheck(options: InputEncodingCheckOptions): Guard {
  return {
    name: 'input-encoding-check',
    version: '0.1.0',
    description: 'Validates input encoding for security issues',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      for (const p of BOM_PATTERNS) {
        if (p.test(text)) issues.push('bom_marker');
      }

      if (NULL_BYTE_RE.test(text)) {
        issues.push('null_byte');
      }

      for (const p of OVERLONG_PATTERNS) {
        if (p.test(text)) issues.push('overlong_encoding');
      }

      if (MIXED_ENCODING_RE.test(text)) {
        issues.push('mixed_encoding');
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'input-encoding-check',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(issues.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
