import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CodeInjectionOutputOptions {
  action: 'block' | 'warn';
}

const CODE_BLOCK_RE = /```[\s\S]*?```/g;

const INJECTION_PATTERNS: RegExp[] = [
  /<script\b[^>]*>[\s\S]*?<\/script>/i,
  /\bon\w+\s*=\s*["'][^"']*["']/i,
  /javascript\s*:/i,
  /\bSELECT\b.*\bFROM\b.*\bWHERE\b/i,
  /\bDROP\s+TABLE\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bUNION\s+SELECT\b/i,
  /\b(?:sudo|chmod|chown)\s+/,
  /\brm\s+-rf\s+\//,
  /\bcurl\s+.*\|\s*(?:bash|sh)\b/,
  /\bwget\s+.*\|\s*(?:bash|sh)\b/,
  /\beval\s*\(/,
  /\bnew\s+Function\s*\(/,
  /document\.(?:cookie|write|location)/i,
  /window\.(?:location|eval|execScript)/i,
];

function stripCodeBlocks(text: string): string {
  return text.replace(CODE_BLOCK_RE, '');
}

export function codeInjectionOutput(options: CodeInjectionOutputOptions): Guard {
  return {
    name: 'code-injection-output',
    version: '0.1.0',
    description: 'Detects code injection patterns in AI output',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const plain = stripCodeBlocks(text);
      const matched: string[] = [];

      for (const p of INJECTION_PATTERNS) {
        if (p.test(plain)) matched.push(p.source);
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'code-injection-output',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
