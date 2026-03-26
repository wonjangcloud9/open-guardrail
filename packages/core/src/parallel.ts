import type { Guard, GuardContext, GuardResult } from './types.js';

interface ParallelOptions {
  mode?: 'all' | 'race-block';
  timeoutMs?: number;
}

/**
 * Run multiple guards in parallel.
 *
 * - `all`: Run all guards concurrently, return combined result
 * - `race-block`: Return as soon as any guard blocks
 *
 * @example
 * ```typescript
 * const fast = parallel(
 *   [promptInjection({ action: 'block' }), toxicity({ action: 'block' })],
 *   { mode: 'race-block' },
 * );
 * ```
 */
export function parallel(
  guards: Guard[],
  options: ParallelOptions = {},
): Guard {
  const mode = options.mode ?? 'all';
  const timeoutMs = options.timeoutMs ?? 10_000;

  const names = guards.map((g) => g.name).join('+');

  return {
    name: `parallel(${names})`,
    version: '1.0.0',
    description: `Parallel execution of ${guards.length} guards`,
    category: 'custom',
    supportedStages: ['input', 'output'],

    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      if (mode === 'race-block') {
        return raceBlock(guards, text, ctx, start, timeoutMs);
      }

      return runAll(guards, text, ctx, start, timeoutMs);
    },
  };
}

async function runAll(
  guards: Guard[],
  text: string,
  ctx: GuardContext,
  start: number,
  timeoutMs: number,
): Promise<GuardResult> {
  const promises = guards.map((g) =>
    Promise.race([
      g.check(text, ctx),
      new Promise<GuardResult>((_, reject) =>
        setTimeout(() => reject(new Error(`${g.name} timed out`)), timeoutMs),
      ),
    ]).catch((err): GuardResult => ({
      guardName: g.name,
      passed: false,
      action: 'block',
      message: `Error: ${(err as Error).message}`,
      latencyMs: Math.round(performance.now() - start),
    })),
  );

  const results = await Promise.all(promises);
  const blocked = results.filter((r) => !r.passed);
  const hasBlock = blocked.length > 0;

  return {
    guardName: `parallel(${guards.length})`,
    passed: !hasBlock,
    action: hasBlock ? 'block' : 'allow',
    latencyMs: Math.round(performance.now() - start),
    details: {
      results: results.map((r) => ({
        name: r.guardName,
        passed: r.passed,
        action: r.action,
      })),
      blockedBy: blocked.map((r) => r.guardName),
    },
  };
}

async function raceBlock(
  guards: Guard[],
  text: string,
  ctx: GuardContext,
  start: number,
  timeoutMs: number,
): Promise<GuardResult> {
  return new Promise((resolve) => {
    let settled = false;
    let completed = 0;
    const results: GuardResult[] = [];

    const finish = (result: GuardResult) => {
      if (settled) return;
      if (!result.passed) {
        settled = true;
        resolve({
          ...result,
          latencyMs: Math.round(performance.now() - start),
        });
        return;
      }
      results.push(result);
      completed++;
      if (completed === guards.length) {
        settled = true;
        resolve({
          guardName: `parallel(${guards.length})`,
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
          details: {
            results: results.map((r) => ({
              name: r.guardName,
              passed: r.passed,
              action: r.action,
            })),
          },
        });
      }
    };

    for (const g of guards) {
      g.check(text, ctx).then(finish).catch((err) => {
        finish({
          guardName: g.name,
          passed: false,
          action: 'block',
          message: `Error: ${(err as Error).message}`,
          latencyMs: Math.round(performance.now() - start),
        });
      });
    }

    setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({
          guardName: `parallel(${guards.length})`,
          passed: false,
          action: 'block',
          message: `Parallel execution timed out after ${timeoutMs}ms`,
          latencyMs: timeoutMs,
        });
      }
    }, timeoutMs);
  });
}
