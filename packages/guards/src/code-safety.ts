import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CodeSafetyOptions {
  action: 'block' | 'warn';
}

interface DangerousPattern {
  name: string;
  pattern: RegExp;
  severity: number;
}

const DANGEROUS_PATTERNS: DangerousPattern[] = [
  // Code execution
  { name: 'eval', pattern: /\beval\s*\(/g, severity: 3 },
  { name: 'Function-constructor', pattern: /new\s+Function\s*\(/g, severity: 3 },
  { name: 'exec', pattern: /\bexec(?:Sync)?\s*\(/g, severity: 3 },
  { name: 'child_process', pattern: /child_process/g, severity: 3 },
  { name: 'spawn', pattern: /\bspawn(?:Sync)?\s*\(/g, severity: 2 },

  // Dangerous file operations
  { name: 'unlink', pattern: /\bunlink(?:Sync)?\s*\(/g, severity: 2 },
  { name: 'rmSync', pattern: /\brm(?:Sync|dir|dirSync)?\s*\(/g, severity: 2 },
  { name: 'rm-rf', pattern: /rm\s+-rf?\s+/g, severity: 3 },

  // SQL template injection
  { name: 'sql-template-injection', pattern: /(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.*\$\{/gi, severity: 3 },

  // Network exfiltration
  { name: 'curl-pipe-sh', pattern: /curl\s+.*\|\s*(?:sh|bash)/g, severity: 3 },
  { name: 'wget-pipe', pattern: /wget\s+.*\|\s*(?:sh|bash)/g, severity: 3 },

  // Environment exposure
  { name: 'env-exposure', pattern: /process\.env\.\w*(?:SECRET|KEY|TOKEN|PASSWORD|CREDENTIAL)/gi, severity: 2 },

  // Prototype pollution
  { name: 'proto-pollution', pattern: /__proto__|constructor\s*\[\s*["']prototype/g, severity: 2 },
];

export function codeSafety(options: CodeSafetyOptions): Guard {
  return {
    name: 'code-safety',
    version: '0.7.0',
    description: 'Detects dangerous code patterns: eval, shell injection, SQL injection, env exposure',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      let maxSeverity = 0;

      for (const { name, pattern, severity } of DANGEROUS_PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) {
          matched.push(name);
          maxSeverity = Math.max(maxSeverity, severity);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(maxSeverity / 3, 1.0) : 0;

      return {
        guardName: 'code-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { patterns: matched, maxSeverity } : undefined,
      };
    },
  };
}
