import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface OutputLengthGuardOptions {
  action: 'block' | 'warn';
  minWords?: number;
  maxWords?: number;
}

export function outputLengthGuard(options: OutputLengthGuardOptions): Guard {
  const minWords = options.minWords ?? 1;
  const maxWords = options.maxWords ?? 5000;

  return {
    name: 'output-length-guard',
    version: '0.1.0',
    description: 'Enforce min/max word count on output',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const words = text.trim().split(/\s+/).filter(Boolean);
      const count = words.length;
      const tooShort = count < minWords;
      const tooLong = count > maxWords;
      const triggered = tooShort || tooLong;

      return {
        guardName: 'output-length-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Output has ${count} words (allowed: ${minWords}-${maxWords})`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: { wordCount: count, minWords, maxWords },
      };
    },
  };
}
