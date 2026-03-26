import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ContentLengthOptions {
  action: 'block' | 'warn';
  minLength?: number;
  maxLength?: number;
  unit?: 'chars' | 'words' | 'sentences';
}

function count(text: string, unit: string): number {
  switch (unit) {
    case 'words':
      return text.split(/\s+/).filter((w) => w.length > 0).length;
    case 'sentences':
      return text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
    case 'chars':
    default:
      return text.length;
  }
}

export function contentLength(options: ContentLengthOptions): Guard {
  const unit = options.unit ?? 'chars';

  return {
    name: 'content-length',
    version: '0.1.0',
    description: 'Validate content length (chars/words/sentences)',
    category: 'format',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const measured = count(text, unit);
      let triggered = false;

      if (options.minLength !== undefined && measured < options.minLength) triggered = true;
      if (options.maxLength !== undefined && measured > options.maxLength) triggered = true;

      return {
        guardName: 'content-length',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: {
          measured,
          unit,
          minLength: options.minLength,
          maxLength: options.maxLength,
        },
      };
    },
  };
}
