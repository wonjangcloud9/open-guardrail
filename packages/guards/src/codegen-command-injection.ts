import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenCommandInjectionOptions {
  action: 'block' | 'warn';
}

const CMD_INJECTION_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /os\.system\s*\(/, label: 'os.system()' },
  { re: /os\.popen\s*\(/, label: 'os.popen()' },
  { re: /subprocess\.call\s*\([^)]*shell\s*=\s*True/i, label: 'subprocess.call(shell=True)' },
  { re: /subprocess\.run\s*\([^)]*shell\s*=\s*True/i, label: 'subprocess.run(shell=True)' },
  { re: /subprocess\.Popen\s*\([^)]*shell\s*=\s*True/i, label: 'subprocess.Popen(shell=True)' },
  { re: /child_process\.exec\s*\(/, label: 'child_process.exec()' },
  { re: /child_process\.execSync\s*\(/, label: 'child_process.execSync()' },
  { re: /child_process\.spawn\s*\([^)]*shell\s*:\s*true/i, label: 'child_process.spawn(shell)' },
  { re: /exec\s*\(\s*["'`](?:sh|bash|cmd|powershell)\b/, label: 'exec() with shell' },
  { re: /Runtime\.getRuntime\s*\(\s*\)\.exec\s*\(/, label: 'Runtime.exec()' },
  { re: /ProcessBuilder\s*\(/, label: 'Java ProcessBuilder' },
  { re: /system\s*\(\s*["'][^"']*\$/, label: 'system() with interpolation' },
  { re: /system\s*\(\s*["'][^"']*["']\s*\.\s*/, label: 'system() with concatenation' },
  { re: /exec\s*\(\s*`[^`]*\$\{/, label: 'exec() with template literal' },
  { re: /popen\s*\(/, label: 'popen()' },
  { re: /shell_exec\s*\(/, label: 'shell_exec() (PHP)' },
  { re: /passthru\s*\(/, label: 'passthru() (PHP)' },
  { re: /proc_open\s*\(/, label: 'proc_open() (PHP)' },
];

/**
 * Detects command injection vulnerabilities in generated code (CWE-78).
 * Flags dangerous shell execution patterns such as os.system(),
 * subprocess with shell=True, child_process.exec(), and similar.
 */
export function codegenCommandInjection(
  options: CodegenCommandInjectionOptions,
): Guard {
  return {
    name: 'codegen-command-injection',
    version: '0.1.0',
    description:
      'Detect command injection in generated code (CWE-78)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const findings: string[] = [];

      for (const { re, label } of CMD_INJECTION_PATTERNS) {
        if (re.test(text)) {
          findings.push(label);
        }
      }

      const triggered = findings.length > 0;

      return {
        guardName: 'codegen-command-injection',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Command injection risk: ${findings.join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { findings, reason: 'CWE-78: Dangerous shell/exec patterns detected' }
          : undefined,
      };
    },
  };
}
