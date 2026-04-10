import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenPathTraversalOptions {
  action: 'block' | 'warn';
}

const USER_INPUT_SOURCES: RegExp[] = [
  /req\.body\.\w+/,
  /req\.params\.\w+/,
  /req\.query\.\w+/,
  /request\.form\[/,
  /request\.args\[/,
  /request\.json/,
  /params\.\w+/,
  /args\.\w+/,
];

const PATH_CONSTRUCTION_WITH_INPUT: RegExp[] = [
  /path\.join\s*\([^)]*(?:req\.|request\.|params\.|args\.)/,
  /os\.path\.join\s*\([^)]*(?:request\.|params|args)/,
  /Path\s*\([^)]*(?:request\.|params|args)/,
];

const DANGEROUS_FILE_WITH_INPUT: RegExp[] = [
  /fs\.readFile\w*\s*\([^)]*(?:req\.|request\.|params|user|input)/,
  /fs\.writeFile\w*\s*\([^)]*(?:req\.|request\.|params|user|input)/,
  /fs\.createReadStream\s*\([^)]*(?:req\.|request\.|params|user|input)/,
  /open\s*\([^)]*(?:request\.|user_|params|input)/,
  /new\s+File\s*\([^)]*(?:req\.|request\.|params)/,
];

const TEMPLATE_PATH_PATTERNS: RegExp[] = [
  /`[^`]*\/[^`]*\$\{[^}]*(?:req|request|params|user|input)[^}]*\}[^`]*`/,
  /f["'][^"']*\/[^"']*\{[^}]*(?:request|params|user|input)[^}]*\}[^"']*["']/,
];

const SANITIZATION_INDICATORS: RegExp[] = [
  /path\.resolve\s*\(/,
  /realpath/,
  /\.startsWith\s*\(\s*(?:baseDir|basePath|rootDir|root|UPLOAD)/,
  /\.normalize\s*\(/,
  /sanitize/i,
  /allowlist/i,
  /whitelist/i,
  /\.replace\s*\(\s*["']\.\.["']/,
  /\.includes\s*\(\s*["']\.\.["']/,
  /os\.path\.abspath/,
  /os\.path\.realpath/,
  /os\.path\.commonpath/,
];

/**
 * Detects path traversal vulnerabilities in generated code (CWE-22).
 * Flags file path construction using unsanitized user input.
 */
export function codegenPathTraversal(
  options: CodegenPathTraversalOptions,
): Guard {
  return {
    name: 'codegen-path-traversal',
    version: '0.1.0',
    description:
      'Detect path traversal vulnerabilities in generated code (CWE-22)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const findings: string[] = [];

      const hasSanitization = SANITIZATION_INDICATORS.some(
        (p) => p.test(text),
      );

      const hasUserInput = USER_INPUT_SOURCES.some((p) =>
        p.test(text),
      );

      if (hasUserInput && !hasSanitization) {
        for (const pattern of PATH_CONSTRUCTION_WITH_INPUT) {
          if (pattern.test(text)) {
            findings.push(
              `unsafe_path_construction:${pattern.source}`,
            );
          }
        }

        for (const pattern of DANGEROUS_FILE_WITH_INPUT) {
          if (pattern.test(text)) {
            findings.push(
              `unsafe_file_access:${pattern.source}`,
            );
          }
        }

        for (const pattern of TEMPLATE_PATH_PATTERNS) {
          if (pattern.test(text)) {
            findings.push(
              `template_path:${pattern.source}`,
            );
          }
        }
      }

      const triggered = findings.length > 0;

      return {
        guardName: 'codegen-path-traversal',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Path traversal risk: ${findings.length} pattern(s) found`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              matchCount: findings.length,
              findings,
              reason:
                'CWE-22: Path traversal via unsanitized user input in file operations',
            }
          : undefined,
      };
    },
  };
}
