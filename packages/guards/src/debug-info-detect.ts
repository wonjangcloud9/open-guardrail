import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DebugInfoDetectOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /console\.(log|debug|trace|warn|error)\s*\(/,
  /\bprint\s*\([^)]*\)/,
  /\bDEBUG:/,
  /\bTRACE:/,
  /\bVERBOSE:/,
  /\bbreakpoint\s*\(\)/,
  /\bdebugger\b/,
  /\bpdb\.set_trace\s*\(\)/,
  /\b(binding|byebug)\.pry\b/,
  /\bvar_dump\s*\(/,
  /\bdd\s*\(/,
  /\bSystem\.out\.println\s*\(/,
];

export function debugInfoDetect(options: DebugInfoDetectOptions): Guard {
  return {
    name: 'debug-info-detect',
    version: '0.1.0',
    description: 'Detects debug information in output',
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
        guardName: 'debug-info-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
