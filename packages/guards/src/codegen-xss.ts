import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenXssOptions {
  action: 'block' | 'warn';
}

const XSS_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\.innerHTML\s*=/, label: 'innerHTML assignment' },
  { re: /\.outerHTML\s*=/, label: 'outerHTML assignment' },
  { re: /document\.write\s*\(/, label: 'document.write' },
  { re: /document\.writeln\s*\(/, label: 'document.writeln' },
  { re: /dangerouslySetInnerHTML/, label: 'dangerouslySetInnerHTML' },
  { re: /v-html\s*=/, label: 'v-html directive' },
  { re: /\[innerHTML\]/, label: 'Angular innerHTML binding' },
  { re: /eval\s*\(/, label: 'eval()' },
  { re: /new\s+Function\s*\(/, label: 'new Function()' },
  { re: /\$\(\s*['"][^'"]*['"]\s*\)\.html\s*\(\s*[^'")][^)]*\)/, label: 'jQuery .html() with variable' },
  { re: /\$\(\s*['"][^'"]*['"]\s*\)\.append\s*\(\s*[^'")][^)]*\)/, label: 'jQuery .append() with variable' },
  { re: /document\.createElement\s*\(\s*['"]script['"]\s*\)/, label: 'dynamic script element' },
  { re: /\.insertAdjacentHTML\s*\(/, label: 'insertAdjacentHTML' },
  { re: /srcdoc\s*=/, label: 'srcdoc attribute' },
];

/**
 * Detects XSS vulnerabilities in generated code (CWE-79).
 * Flags innerHTML, document.write, eval, dangerouslySetInnerHTML,
 * and other patterns that can lead to cross-site scripting.
 */
export function codegenXss(options: CodegenXssOptions): Guard {
  return {
    name: 'codegen-xss',
    version: '0.1.0',
    description:
      'Detect XSS vulnerabilities in generated code (CWE-79)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const findings: string[] = [];

      for (const { re, label } of XSS_PATTERNS) {
        if (re.test(text)) {
          findings.push(label);
        }
      }

      const triggered = findings.length > 0;

      return {
        guardName: 'codegen-xss',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `XSS risk: ${findings.join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { findings, reason: 'CWE-79: Potential cross-site scripting vectors detected' }
          : undefined,
      };
    },
  };
}
