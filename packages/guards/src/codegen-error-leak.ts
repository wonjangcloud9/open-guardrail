import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenErrorLeakOptions {
  action: 'block' | 'warn';
}

const STACK_TRACE: RegExp[] = [
  /\be\.stack\b/g,
  /traceback\.print_exc\s*\(\)/g,
  /traceback\.format_exc\s*\(\)/g,
  /\.printStackTrace\s*\(\)/g,
];

const DB_ERROR_LEAK: RegExp[] = [
  /catch\s*\([^)]*\)\s*\{[^}]*res\.(send|json)\s*\(\s*\w+\.message/gs,
  /except\s+Exception\s+as\s+\w+\s*:\s*return\s+str\s*\(\w+\)/g,
  /res\.status\s*\(\s*500\s*\)\.json\s*\(\s*\{\s*error\s*:\s*\w+\s*\}/g,
  /return\s+Response\s*\(\s*str\s*\(\s*e\s*\)\s*,\s*500\s*\)/g,
];

const DEBUG_MODE: RegExp[] = [
  /DEBUG\s*=\s*True/g,
  /app\.debug\s*=\s*True/g,
  /debug\s*:\s*true/g,
  /FLASK_DEBUG\s*=\s*1/g,
];

const VERBOSE_ERROR: RegExp[] = [
  /res\.status\s*\(\s*500\s*\)\.json\s*\(\s*\{\s*error\s*:\s*err\b/g,
  /return\s+jsonify\s*\(\s*\{\s*['"]error['"]\s*:\s*str\s*\(\s*e\s*\)/g,
  /\.send\s*\(\s*err\.stack/g,
  /console\.error\s*\(\s*err\s*\)\s*;\s*res\.send\s*\(/g,
];

const SQL_ERROR_LEAK: RegExp[] = [
  /SQLError|DatabaseError|OperationalError/g,
  /mysql\.connector\.errors/g,
  /pg\.DatabaseError/g,
];

export function codegenErrorLeak(
  options: CodegenErrorLeakOptions,
): Guard {
  const allPatterns = [
    ...STACK_TRACE,
    ...DB_ERROR_LEAK,
    ...DEBUG_MODE,
    ...VERBOSE_ERROR,
    ...SQL_ERROR_LEAK,
  ];

  return {
    name: 'codegen-error-leak',
    version: '0.1.0',
    description:
      'Detect information leakage through error handling (CWE-209)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of allPatterns) {
        const re = new RegExp(pattern.source, pattern.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0].trim());
      }

      const unique = [...new Set(matched)];
      const triggered = unique.length > 0;

      return {
        guardName: 'codegen-error-leak',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Error leak detected: ${unique.slice(0, 3).join(', ')}${unique.length > 3 ? ` (+${unique.length - 3} more)` : ''}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              matched: unique,
              reason:
                'Code leaks sensitive information through error handling',
            }
          : undefined,
      };
    },
  };
}
