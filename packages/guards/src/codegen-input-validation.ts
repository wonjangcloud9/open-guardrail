import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenInputValidationOptions {
  action: 'block' | 'warn';
}

const DIRECT_INPUT_PATTERNS: RegExp[] = [
  /req\.body\.\w+/,
  /req\.params\.\w+/,
  /req\.query\.\w+/,
  /request\.form\[/,
  /request\.args\[/,
  /request\.json\b/,
  /request\.GET\[/,
  /request\.POST\[/,
];

const DANGEROUS_SINK_PATTERNS: RegExp[] = [
  /db\.query\s*\(\s*req\./,
  /db\.execute\s*\(\s*req\./,
  /fs\.readFile\w*\s*\(\s*req\./,
  /fs\.writeFile\w*\s*\(\s*req\./,
  /open\s*\(\s*request\./,
  /subprocess\.\w+\(\s*request\./,
  /exec\s*\(\s*req\./,
  /eval\s*\(\s*req\./,
];

const UNSAFE_COERCION_PATTERNS: RegExp[] = [
  /parseInt\s*\(\s*req\./,
  /Number\s*\(\s*req\./,
  /int\s*\(\s*request\./,
  /float\s*\(\s*request\./,
];

const VALIDATION_INDICATORS: RegExp[] = [
  /joi\./i,
  /zod\./i,
  /yup\./i,
  /\.validate\s*\(/,
  /\.safeParse\s*\(/,
  /\.parse\s*\(/,
  /assert\s/,
  /if\s*\(/,
  /check\s*\(/,
  /isNaN\s*\(/,
  /Number\.isFinite/,
  /Number\.isNaN/,
  /WTForms/i,
  /serializer/i,
  /marshmallow/i,
  /pydantic/i,
];

/**
 * Detects missing input validation in generated code (CWE-20).
 * Flags API/route handlers that use user input without validation.
 */
export function codegenInputValidation(
  options: CodegenInputValidationOptions,
): Guard {
  return {
    name: 'codegen-input-validation',
    version: '0.1.0',
    description:
      'Detect missing input validation in generated code (CWE-20)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const findings: string[] = [];

      const hasValidation = VALIDATION_INDICATORS.some((p) =>
        p.test(text),
      );

      if (!hasValidation) {
        for (const pattern of DIRECT_INPUT_PATTERNS) {
          if (pattern.test(text)) {
            findings.push(
              `unvalidated_input:${pattern.source}`,
            );
          }
        }
      }

      for (const pattern of DANGEROUS_SINK_PATTERNS) {
        if (pattern.test(text)) {
          findings.push(
            `dangerous_sink:${pattern.source}`,
          );
        }
      }

      for (const pattern of UNSAFE_COERCION_PATTERNS) {
        if (pattern.test(text)) {
          const coercionCtx = text.slice(
            Math.max(
              0,
              text.search(pattern) - 80,
            ),
            text.search(pattern) + 80,
          );
          if (!/isNaN|Number\.isFinite|Number\.isNaN/.test(coercionCtx)) {
            findings.push(
              `unsafe_coercion:${pattern.source}`,
            );
          }
        }
      }

      const triggered = findings.length > 0;

      return {
        guardName: 'codegen-input-validation',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Input validation missing: ${findings.length} issue(s) found`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              matchCount: findings.length,
              findings,
              reason:
                'CWE-20: Missing input validation on user-supplied data',
            }
          : undefined,
      };
    },
  };
}
