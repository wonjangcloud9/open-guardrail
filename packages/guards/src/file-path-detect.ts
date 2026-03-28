import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface FilePathDetectOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /\/home\/[a-zA-Z0-9_-]+\//,
  /\/Users\/[a-zA-Z0-9_-]+\//,
  /C:\\Users\\[a-zA-Z0-9_-]+\\/,
  /\/var\/log\/[a-zA-Z0-9_.-]+/,
  /\/etc\/passwd/,
  /\/etc\/shadow/,
  /\/etc\/hosts/,
  /\/root\//,
  /\/tmp\/[a-zA-Z0-9_.-]+/,
  /[A-Z]:\\Windows\\[a-zA-Z0-9_\\.-]+/,
  /\/opt\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/,
  /\/srv\/[a-zA-Z0-9_.-]+/,
];

export function filePathDetect(options: FilePathDetectOptions): Guard {
  return {
    name: 'file-path-detect',
    version: '0.1.0',
    description: 'Detects file system paths that could reveal server info',
    category: 'privacy',
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
        guardName: 'file-path-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
