import type { Guard, GuardContext, GuardResult } from './types.js';

/**
 * Run a guard only when a condition is met.
 *
 * @example
 * ```typescript
 * const guard = when(
 *   (text) => text.length > 100,
 *   toxicity({ action: 'block' }),
 * );
 * ```
 */
export function when(
  condition: (text: string, ctx: GuardContext) => boolean | Promise<boolean>,
  guard: Guard,
): Guard {
  return {
    ...guard,
    name: `when(${guard.name})`,
    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const shouldRun = await condition(text, ctx);
      if (!shouldRun) {
        return {
          guardName: guard.name,
          passed: true,
          action: 'allow',
          message: 'Condition not met — skipped',
          latencyMs: 0,
        };
      }
      return guard.check(text, ctx);
    },
  };
}

/**
 * Compose multiple guards into a single guard that runs them sequentially.
 * Returns the highest-priority action. If any guard blocks, the composed
 * guard blocks.
 *
 * @example
 * ```typescript
 * const securityBundle = compose(
 *   'security-bundle',
 *   promptInjection({ action: 'block' }),
 *   keyword({ denied: ['hack'], action: 'block' }),
 *   encodingAttack({ action: 'block' }),
 * );
 * // Use as a single guard in a pipeline
 * const pipeline = pipe(securityBundle, pii({ entities: ['email'], action: 'mask' }));
 * ```
 */
export function compose(name: string, ...guards: Guard[]): Guard {
  const ACTION_PRIORITY: Record<string, number> = {
    block: 4,
    override: 3,
    warn: 2,
    allow: 1,
  };

  return {
    name,
    version: '1.0.0',
    description: `Composed guard: ${guards.map((g) => g.name).join(', ')}`,
    category: 'custom',
    supportedStages: ['input', 'output'],

    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const results: GuardResult[] = [];
      let currentText = text;

      for (const guard of guards) {
        const result = await guard.check(currentText, ctx);
        results.push(result);

        if (result.action === 'override' && result.overrideText) {
          currentText = result.overrideText;
        }
        if (result.action === 'block') break;
      }

      const highest = results.reduce((best, r) =>
        (ACTION_PRIORITY[r.action] ?? 0) > (ACTION_PRIORITY[best.action] ?? 0) ? r : best,
      );

      return {
        guardName: name,
        passed: highest.action !== 'block',
        action: highest.action,
        overrideText: currentText !== text ? currentText : undefined,
        message: results.filter((r) => r.action !== 'allow').map((r) => `${r.guardName}: ${r.message ?? r.action}`).join('; ') || undefined,
        details: { subResults: results.map((r) => ({ name: r.guardName, action: r.action, passed: r.passed })) },
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}

/**
 * Negate a guard — pass becomes block, block becomes pass.
 * Useful for "must contain" logic.
 *
 * @example
 * ```typescript
 * // Block if text does NOT contain a disclaimer
 * const mustDisclaim = not(keyword({ allowed: ['disclaimer', 'note:'], action: 'block' }));
 * ```
 */
export function not(guard: Guard, action: 'block' | 'warn' = 'block'): Guard {
  return {
    ...guard,
    name: `not(${guard.name})`,
    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const result = await guard.check(text, ctx);
      const inverted = result.passed;

      return {
        guardName: `not(${guard.name})`,
        passed: !inverted,
        action: inverted ? action : 'allow',
        message: inverted ? `Negated: original guard passed but expected block` : undefined,
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}
