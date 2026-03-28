import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodeReviewSafetyOptions {
  action: 'block' | 'warn';
}

const PATTERNS: [RegExp, string][] = [
  [/(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*['"][^'"]{4,}['"]/gi, 'hardcoded credential'],
  [/(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}/g, 'AWS access key'],
  [/ghp_[A-Za-z0-9_]{36}/g, 'GitHub token'],
  [/sk-[A-Za-z0-9]{20,}/g, 'API secret key'],
  [/\beval\s*\(/gi, 'eval usage'],
  [/\bexec\s*\(/gi, 'exec usage'],
  [/\bnew\s+Function\s*\(/gi, 'Function constructor'],
  [/(?:SELECT|INSERT|UPDATE|DELETE)\s+.*['"`]\s*\+/gi, 'SQL string concatenation'],
  [/(?:SELECT|INSERT|UPDATE|DELETE)\s+.*\$\{/gi, 'SQL template injection'],
  [/(?:child_process|execSync|spawnSync)\s*\(.*\+/gi, 'command injection risk'],
  [/`.*\$\{.*\}`.*(?:exec|spawn|system)/gi, 'shell template injection'],
];

export function codeReviewSafety(
  options: CodeReviewSafetyOptions,
): Guard {
  return {
    name: 'code-review-safety',
    version: '0.1.0',
    description:
      'Detects secrets, hardcoded credentials, and unsafe code patterns in code review',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const found: string[] = [];

      for (const [pattern, label] of PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) found.push(label);
      }

      const unique = [...new Set(found)];
      const triggered = unique.length > 0;

      return {
        guardName: 'code-review-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Unsafe code patterns: ${unique.join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues: unique } : undefined,
      };
    },
  };
}
