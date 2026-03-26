import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CanaryTokenOptions {
  action: 'block' | 'warn';
  token: string;
}

/**
 * Insert a canary token into system prompts to detect data leakage.
 * If the token appears in LLM output, it means the system prompt was leaked.
 *
 * @example
 * ```typescript
 * const canary = canaryToken({
 *   action: 'block',
 *   token: 'CANARY_f47ac10b-58cc',
 * });
 * // Add to output pipeline — blocks if model leaks the canary
 * ```
 */
export function canaryToken(options: CanaryTokenOptions): Guard {
  return {
    name: 'canary-token',
    version: '0.1.0',
    description: 'Detect system prompt leakage via canary tokens',
    category: 'security',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const found = text.includes(options.token);

      return {
        guardName: 'canary-token',
        passed: !found,
        action: found ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: found
          ? { leaked: true, message: 'Canary token detected in output — system prompt leakage' }
          : undefined,
      };
    },
  };
}
