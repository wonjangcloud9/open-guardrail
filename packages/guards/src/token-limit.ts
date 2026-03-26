import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface TokenLimitOptions {
  action: 'block' | 'warn';
  maxTokens: number;
  estimationMethod?: 'chars' | 'words' | 'tiktoken-approx';
}

function estimateTokens(text: string, method: string): number {
  switch (method) {
    case 'chars':
      return Math.ceil(text.length / 4);
    case 'words':
      return Math.ceil(text.split(/\s+/).filter((w) => w.length > 0).length * 1.3);
    case 'tiktoken-approx':
    default: {
      const words = text.split(/\s+/).filter((w) => w.length > 0);
      let tokens = 0;
      for (const w of words) {
        if (w.length <= 4) tokens += 1;
        else if (w.length <= 8) tokens += 2;
        else tokens += Math.ceil(w.length / 4);
      }
      return tokens;
    }
  }
}

export function tokenLimit(options: TokenLimitOptions): Guard {
  const method = options.estimationMethod ?? 'tiktoken-approx';

  return {
    name: 'token-limit',
    version: '0.1.0',
    description: 'Token count estimation and limit guard',
    category: 'format',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const estimated = estimateTokens(text, method);
      const triggered = estimated > options.maxTokens;

      return {
        guardName: 'token-limit',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: {
          estimatedTokens: estimated,
          maxTokens: options.maxTokens,
          method,
        },
      };
    },
  };
}
