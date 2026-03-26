import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface EmptyResponseOptions {
  action: 'block' | 'warn';
  minContentLength?: number;
  ignoreWhitespace?: boolean;
}

export function emptyResponse(options: EmptyResponseOptions): Guard {
  const minLen = options.minContentLength ?? 1;
  const ignoreWs = options.ignoreWhitespace ?? true;

  return {
    name: 'empty-response',
    version: '0.1.0',
    description: 'Detect empty or near-empty LLM responses',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const processed = ignoreWs ? text.trim() : text;
      const triggered = processed.length < minLen;

      return {
        guardName: 'empty-response',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Response too short: ${processed.length} char(s), minimum ${minLen}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { length: processed.length, minRequired: minLen, reason: 'LLM returned empty or near-empty response' }
          : undefined,
      };
    },
  };
}
