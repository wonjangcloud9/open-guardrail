import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface WordCountOptions {
  min?: number;
  max?: number;
  unit?: 'words' | 'chars';
  action: 'block' | 'warn';
}

export function wordCount(options: WordCountOptions): Guard {
  const unit = options.unit ?? 'words';

  return {
    name: 'word-count',
    version: '0.1.0',
    description: 'Word/character count limit guard',
    category: 'format',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const count = unit === 'words'
        ? text.trim().split(/\s+/).filter(Boolean).length
        : text.length;

      const tooShort = options.min !== undefined && count < options.min;
      const tooLong = options.max !== undefined && count > options.max;
      const triggered = tooShort || tooLong;

      return {
        guardName: 'word-count',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: { [unit === 'words' ? 'wordCount' : 'charCount']: count, min: options.min, max: options.max },
      };
    },
  };
}
