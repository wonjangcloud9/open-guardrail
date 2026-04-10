import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenUnsafeRegexOptions {
  action: 'block' | 'warn';
}

const REGEX_DECLARATION = [
  /new\s+RegExp\s*\(\s*(['"`])(.*?)\1/g,
  /re\.compile\s*\(\s*r?(['"])(.*?)\1/g,
  /\/([^/\n]+)\/[gimsuy]*/g,
];

const EVIL_PATTERNS: RegExp[] = [
  /\([^()]*[+*]\s*\)\s*[+*]/,
  /\(\.\*\)\s*[+*]/,
  /\(\.[+*]\)\s*[+*]/,
  /\(\[[\w-]+\]\s*[+*]\s*\)\s*[+*]/,
  /\(\w\|\w+\)\s*[+*]/,
  /\(\\[wd]\|\\[wd]\)\s*[+*]/,
];

function isEvilRegex(pattern: string): boolean {
  for (const evil of EVIL_PATTERNS) {
    if (evil.test(pattern)) return true;
  }
  return false;
}

export function codegenUnsafeRegex(
  options: CodegenUnsafeRegexOptions,
): Guard {
  return {
    name: 'codegen-unsafe-regex',
    version: '0.1.0',
    description:
      'Detect ReDoS-vulnerable regex patterns (CWE-1333)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const decl of REGEX_DECLARATION) {
        const re = new RegExp(decl.source, decl.flags);
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          const inner = m[2] ?? m[1];
          if (inner && isEvilRegex(inner)) {
            matched.push(inner);
          }
        }
      }

      const unique = [...new Set(matched)];
      const triggered = unique.length > 0;

      return {
        guardName: 'codegen-unsafe-regex',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Unsafe regex detected: ${unique.slice(0, 3).join(', ')}${unique.length > 3 ? ` (+${unique.length - 3} more)` : ''}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              matched: unique,
              reason:
                'Code contains regex patterns vulnerable to catastrophic backtracking (ReDoS)',
            }
          : undefined,
      };
    },
  };
}
