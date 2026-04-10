import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenSqlInjectionOptions {
  action: 'block' | 'warn';
}

const SQL_INJECTION_PATTERNS: RegExp[] = [
  /(?:execute|query|raw|prepare)\s*\(\s*["'`](?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b/i,
  /(?:execute|query|raw)\s*\(\s*f"/i,
  /(?:execute|query|raw)\s*\(\s*f'/i,
  /["'](?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.*["']\s*\+/i,
  /\+\s*["']?\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s/i,
  /["'](?:SELECT|INSERT|UPDATE|DELETE)\b[^"']*\$\{/i,
  /`(?:SELECT|INSERT|UPDATE|DELETE|DROP)\b[^`]*\$\{/i,
  /cursor\.execute\s*\(\s*f["']/i,
  /cursor\.execute\s*\(\s*["'][^"']*["']\s*%/i,
  /\.query\s*\(\s*["'`](?:SELECT|DELETE|UPDATE|INSERT)\b[^)]*\+\s*(?:req\.|request\.|params|input|user)/i,
  /\+\s*req\.(?:body|query|params)\b/i,
  /\+\s*request\.(?:form|args|data|json)\b/i,
  /string\.Format\s*\(\s*["'](?:SELECT|INSERT|UPDATE|DELETE)\b/i,
  /\.format\s*\([^)]*\)\s*.*(?:SELECT|INSERT|UPDATE|DELETE)\b/i,
  /["'](?:SELECT|INSERT|UPDATE|DELETE)\b[^"']*["']\.format\s*\(/i,
];

/**
 * Detects SQL injection vulnerabilities in generated code (CWE-89).
 * Flags string concatenation, template literals, and f-strings
 * used inside SQL statements instead of parameterized queries.
 */
export function codegenSqlInjection(
  options: CodegenSqlInjectionOptions,
): Guard {
  return {
    name: 'codegen-sql-injection',
    version: '0.1.0',
    description:
      'Detect SQL injection vulnerabilities in generated code (CWE-89)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const findings: string[] = [];

      for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(text)) {
          findings.push(pattern.source);
        }
      }

      const triggered = findings.length > 0;

      return {
        guardName: 'codegen-sql-injection',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `SQL injection risk: ${findings.length} vulnerable pattern(s) found`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchCount: findings.length, reason: 'CWE-89: SQL injection via string concatenation or interpolation' }
          : undefined,
      };
    },
  };
}
