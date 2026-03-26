import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface SingleLineOptions {
  action: 'block' | 'warn';
  trimWhitespace?: boolean;
}

export function singleLine(options: SingleLineOptions): Guard {
  const trim = options.trimWhitespace ?? true;

  return {
    name: 'single-line',
    version: '0.1.0',
    description: 'Validate output is a single line (no newlines)',
    category: 'format',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const processed = trim ? text.trim() : text;
      const lines = processed.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const triggered = lines.length > 1;

      return {
        guardName: 'single-line',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { lineCount: lines.length }
          : undefined,
      };
    },
  };
}
