import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenBufferOverflowOptions {
  action: 'block' | 'warn';
}

const UNSAFE_FUNCTION_PATTERNS: RegExp[] = [
  /\bstrcpy\s*\(/,
  /\bstrcat\s*\(/,
  /\bsprintf\s*\(/,
  /\bgets\s*\(/,
  /\bscanf\s*\(\s*"%s"/,
  /\bvsprintf\s*\(/,
  /\bwcscpy\s*\(/,
  /\bwcscat\s*\(/,
];

const SAFE_ALTERNATIVES: Record<string, string> = {
  strcpy: 'strncpy or strlcpy',
  strcat: 'strncat or strlcat',
  sprintf: 'snprintf',
  gets: 'fgets',
  scanf: 'scanf with width specifier',
  vsprintf: 'vsnprintf',
  wcscpy: 'wcsncpy',
  wcscat: 'wcsncat',
};

const MISSING_BOUNDS_PATTERNS: RegExp[] = [
  /malloc\s*\(\s*[^)]*\)\s*;(?![\s\S]{0,80}(?:if\s*\(|assert|check|<=|>=|<|>))/,
  /memcpy\s*\(\s*[^,]+,\s*[^,]+,\s*(?!sizeof\b)[^)]*\)/,
];

const FIXED_BUFFER_VARIABLE_INPUT =
  /char\s+\w+\s*\[\s*\d+\s*\]\s*;[\s\S]{0,200}?(?:strcpy|strcat|sprintf|gets)\s*\(\s*\w+\s*,/;

const ARRAY_NO_BOUNDS =
  /\w+\s*\[\s*(?:i|j|k|idx|index|n|count)\s*\](?![\s\S]{0,60}(?:if\s*\(.*(?:i|j|k|idx|index|n|count)\s*<|sizeof|\.length|\.size|bounds))/;

/**
 * Detects buffer overflow patterns in generated C/C++ code (CWE-120/787).
 * Flags unsafe memory functions and missing bounds checks.
 */
export function codegenBufferOverflow(
  options: CodegenBufferOverflowOptions,
): Guard {
  return {
    name: 'codegen-buffer-overflow',
    version: '0.1.0',
    description:
      'Detect buffer overflow patterns in generated C/C++ code (CWE-120/787)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const findings: string[] = [];
      const suggestions: string[] = [];

      for (const pattern of UNSAFE_FUNCTION_PATTERNS) {
        if (pattern.test(text)) {
          const funcName = pattern.source.match(
            /\\b(\w+)/,
          )?.[1];
          findings.push(`unsafe_function:${funcName}`);
          if (funcName && SAFE_ALTERNATIVES[funcName]) {
            suggestions.push(
              `Replace ${funcName} with ${SAFE_ALTERNATIVES[funcName]}`,
            );
          }
        }
      }

      for (const pattern of MISSING_BOUNDS_PATTERNS) {
        if (pattern.test(text)) {
          findings.push(
            `missing_bounds:${pattern.source.slice(0, 30)}`,
          );
        }
      }

      if (FIXED_BUFFER_VARIABLE_INPUT.test(text)) {
        findings.push(
          'fixed_buffer_variable_input',
        );
      }

      if (ARRAY_NO_BOUNDS.test(text)) {
        findings.push('array_no_bounds_check');
      }

      const triggered = findings.length > 0;

      return {
        guardName: 'codegen-buffer-overflow',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Buffer overflow risk: ${findings.length} pattern(s) found`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              matchCount: findings.length,
              findings,
              suggestions,
              reason:
                'CWE-120/787: Buffer overflow via unsafe memory operations',
            }
          : undefined,
      };
    },
  };
}
