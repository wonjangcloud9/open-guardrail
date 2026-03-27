import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseLengthRatioOptions {
  action: 'block' | 'warn';
  /** Min response:input ratio (default 0.1) */
  minRatio?: number;
  /** Max response:input ratio (default 50) */
  maxRatio?: number;
  /** Reference input text */
  inputText: string;
}

export function responseLengthRatio(options: ResponseLengthRatioOptions): Guard {
  const minRatio = options.minRatio ?? 0.1;
  const maxRatio = options.maxRatio ?? 50;
  const inputLen = Math.max(options.inputText.length, 1);

  return {
    name: 'response-length-ratio',
    version: '0.1.0',
    description: 'Validates response length relative to input length',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const ratio = text.length / inputLen;
      const tooShort = ratio < minRatio;
      const tooLong = ratio > maxRatio;
      const triggered = tooShort || tooLong;

      return {
        guardName: 'response-length-ratio', passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { ratio: Math.round(ratio * 100) / 100, minRatio, maxRatio, reason: tooShort ? 'too-short' : 'too-long' } : undefined,
      };
    },
  };
}
