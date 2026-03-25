import type { Guard, PipelineResult, PipelineMode, OnErrorAction } from './types.js';
import { Pipeline } from './pipeline.js';

type GuardEntry = Guard | [Guard, ...Guard[]];

export interface DefineGuardrailOptions {
  /** Guards to run. Can be individual guards or arrays. */
  guards: GuardEntry[];
  /** Pipeline mode. Default: 'fail-fast'. */
  mode?: PipelineMode;
  /** Error handling. Default: 'block'. */
  onError?: OnErrorAction;
  /** Timeout per guard in ms. Default: 5000. */
  timeoutMs?: number;
  /** Log guard execution to console. Default: false. */
  debug?: boolean;
}

/**
 * Define a guardrail in one line. Returns a function you can call
 * directly on text.
 *
 * @example
 * ```typescript
 * import { defineGuardrail } from 'open-guardrail';
 * import { promptInjection, pii, keyword } from 'open-guardrail';
 *
 * const guard = defineGuardrail({
 *   guards: [
 *     promptInjection({ action: 'block' }),
 *     pii({ entities: ['email'], action: 'mask' }),
 *     keyword({ denied: ['hack'], action: 'block' }),
 *   ],
 * });
 *
 * const result = await guard('user input text');
 * if (!result.passed) console.log('Blocked!');
 * ```
 */
export function defineGuardrail(
  options: DefineGuardrailOptions,
): (text: string, metadata?: Record<string, unknown>) => Promise<PipelineResult> {
  const allGuards: Guard[] = options.guards.flatMap((entry) =>
    Array.isArray(entry) ? entry : [entry],
  );

  const pipeline = new Pipeline({
    guards: allGuards,
    mode: options.mode ?? 'fail-fast',
    onError: options.onError ?? 'block',
    timeoutMs: options.timeoutMs ?? 5000,
    debug: options.debug ?? false,
  });

  const guardFn = (text: string, metadata?: Record<string, unknown>) =>
    pipeline.run(text, metadata);

  // Attach pipeline for advanced use (dispose, events)
  guardFn.pipeline = pipeline;

  return guardFn;
}
