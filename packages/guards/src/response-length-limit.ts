import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseLengthLimitOptions {
  action: 'block' | 'warn';
  minWords?: number;
  maxWords?: number;
  minChars?: number;
  maxChars?: number;
}

export function responseLengthLimit(options: ResponseLengthLimitOptions): Guard {
  const minWords = options.minWords ?? 1;
  const maxWords = options.maxWords ?? 5000;
  const minChars = options.minChars;
  const maxChars = options.maxChars;

  return {
    name: 'response-length-limit',
    version: '0.1.0',
    description: 'Limits response length with configurable min/max',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const words = text.trim().split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const charCount = text.length;
      const issues: string[] = [];

      if (wordCount < minWords) issues.push(`too_few_words (${wordCount} < ${minWords})`);
      if (wordCount > maxWords) issues.push(`too_many_words (${wordCount} > ${maxWords})`);
      if (minChars !== undefined && charCount < minChars) issues.push(`too_few_chars (${charCount} < ${minChars})`);
      if (maxChars !== undefined && charCount > maxChars) issues.push(`too_many_chars (${charCount} > ${maxChars})`);

      const triggered = issues.length > 0;

      return {
        guardName: 'response-length-limit',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? 1.0 : 0,
        message: triggered ? issues.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: { wordCount, charCount },
      };
    },
  };
}
