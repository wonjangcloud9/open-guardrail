import type { Guard, GuardContext, GuardResult, OnErrorAction } from './types.js';

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  onOpen?: OnErrorAction;
}

interface CircuitStats {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  successesSinceHalfOpen: number;
}

/**
 * Wrap a guard with circuit breaker pattern.
 * After `failureThreshold` consecutive failures, the circuit opens
 * and skips the guard for `resetTimeoutMs`, then enters half-open
 * to test if it recovers.
 *
 * @example
 * ```typescript
 * const safeLlm = circuitBreaker(llmJudge({ ... }), {
 *   failureThreshold: 3,
 *   resetTimeoutMs: 30000,
 *   onOpen: 'allow',
 * });
 * ```
 */
export function circuitBreaker(
  guard: Guard,
  options: CircuitBreakerOptions = {},
): Guard {
  const threshold = options.failureThreshold ?? 3;
  const resetMs = options.resetTimeoutMs ?? 30_000;
  const onOpen = options.onOpen ?? 'allow';

  const stats: CircuitStats = {
    state: 'closed',
    failures: 0,
    lastFailure: 0,
    successesSinceHalfOpen: 0,
  };

  function getState(): CircuitState {
    if (stats.state === 'open') {
      if (Date.now() - stats.lastFailure >= resetMs) {
        stats.state = 'half-open';
        stats.successesSinceHalfOpen = 0;
      }
    }
    return stats.state;
  }

  function onSuccess(): void {
    if (stats.state === 'half-open') {
      stats.successesSinceHalfOpen++;
      if (stats.successesSinceHalfOpen >= 1) {
        stats.state = 'closed';
        stats.failures = 0;
      }
    } else {
      stats.failures = 0;
    }
  }

  function onFailure(): void {
    stats.failures++;
    stats.lastFailure = Date.now();
    if (stats.failures >= threshold) {
      stats.state = 'open';
    }
  }

  return {
    ...guard,
    name: `circuitBreaker(${guard.name})`,
    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const currentState = getState();

      if (currentState === 'open') {
        return {
          guardName: guard.name,
          passed: onOpen === 'allow',
          action: onOpen,
          message: `Circuit open — guard "${guard.name}" skipped (${stats.failures} consecutive failures)`,
          latencyMs: Math.round(performance.now() - start),
          details: { circuitState: 'open', failures: stats.failures },
        };
      }

      try {
        const result = await guard.check(text, ctx);
        onSuccess();
        return result;
      } catch (err) {
        onFailure();
        return {
          guardName: guard.name,
          passed: onOpen === 'allow',
          action: onOpen,
          message: `Guard "${guard.name}" failed (${stats.failures}/${threshold}): ${(err as Error).message}`,
          latencyMs: Math.round(performance.now() - start),
          details: { circuitState: stats.state, failures: stats.failures },
        };
      }
    },
  };
}
