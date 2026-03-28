import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CodeBlockSafetyOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /rm\s+-rf\s+\//,
  /DROP\s+TABLE/i,
  /DROP\s+DATABASE/i,
  /eval\s*\(\s*(user|input|req|request)/i,
  /password\s*=\s*["'][^"']{3,}["']/i,
  /secret\s*=\s*["'][^"']{3,}["']/i,
  /api_?key\s*=\s*["'][^"']{3,}["']/i,
  /exec\s*\(\s*["'].*\bsh\b/i,
  /os\.system\s*\(/i,
  /subprocess\.call\s*\(\s*["'].*\brm\b/i,
  /chmod\s+777/,
  /mkfs\s+/,
  />\s*\/dev\/sda/,
  /format\s+[cC]:/i,
];

export function codeBlockSafety(options: CodeBlockSafetyOptions): Guard {
  return {
    name: 'code-block-safety',
    version: '0.1.0',
    description: 'Safety checks for code blocks in AI responses',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'code-block-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
