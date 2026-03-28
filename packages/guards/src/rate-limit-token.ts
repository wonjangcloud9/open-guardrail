import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RateLimitTokenOptions {
  action: 'block' | 'warn';
  maxTokensPerMinute?: number;
  windowMs?: number;
}

interface TokenRecord {
  tokens: number;
  timestamp: number;
}

const _state: TokenRecord[] = [];

function estimateTokens(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function rateLimitToken(options: RateLimitTokenOptions): Guard {
  const maxTokens = options.maxTokensPerMinute ?? 10000;
  const windowMs = options.windowMs ?? 60000;

  return {
    name: 'rate-limit-token',
    version: '0.1.0',
    description: 'Token-based rate limiting using word-level approximation',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const now = Date.now();
      const tokens = estimateTokens(text);

      // Purge expired records
      while (_state.length > 0 && now - _state[0].timestamp > windowMs) {
        _state.shift();
      }

      const usedTokens = _state.reduce((sum, r) => sum + r.tokens, 0);
      const totalTokens = usedTokens + tokens;
      const triggered = totalTokens > maxTokens;

      _state.push({ tokens, timestamp: now });

      return {
        guardName: 'rate-limit-token',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(totalTokens / maxTokens, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { usedTokens, requestTokens: tokens, maxTokensPerMinute: maxTokens }
          : undefined,
      };
    },
  };
}
