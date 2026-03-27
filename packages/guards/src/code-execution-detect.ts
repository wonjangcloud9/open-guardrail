import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CodeExecutionDetectOptions {
  action: 'block' | 'warn';
  languages?: string[];
}

const LANG_PATTERNS: Record<string, RegExp[]> = {
  javascript: [/\beval\s*\(/, /\bnew\s+Function\s*\(/, /\bsetTimeout\s*\(\s*['"`]/, /\bdocument\.\w+\s*=/, /\bwindow\.\w+\s*\(/],
  python: [/\bexec\s*\(/, /\b__import__\s*\(/, /\bos\.system\s*\(/, /\bsubprocess\.\w+\s*\(/, /\beval\s*\(/],
  shell: [/\b(?:bash|sh|zsh)\s+-c\b/, /\bcurl\s+.*\|\s*(?:bash|sh)/, /\bwget\s+.*-O\s*-\s*\|/, /\bchmod\s+\+x\b/],
  sql: [/\bEXEC(?:UTE)?\s+/i, /\bxp_cmdshell\b/i, /\bDECLARE\s+@/i, /\bINTO\s+OUTFILE\b/i],
};

export function codeExecutionDetect(options: CodeExecutionDetectOptions): Guard {
  const langs = options.languages ?? Object.keys(LANG_PATTERNS);

  return {
    name: 'code-execution-detect',
    version: '0.1.0',
    description: 'Detects code execution patterns across languages',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const found: { language: string; pattern: string }[] = [];
      for (const lang of langs) {
        for (const p of LANG_PATTERNS[lang] ?? []) {
          const m = text.match(p);
          if (m) { found.push({ language: lang, pattern: m[0].slice(0, 40) }); break; }
        }
      }
      const triggered = found.length > 0;
      return { guardName: 'code-execution-detect', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { found } : undefined };
    },
  };
}
