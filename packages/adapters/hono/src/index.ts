import type { Pipeline, PipelineResult } from 'open-guardrail-core';

export class GuardrailBlockedError extends Error {
  readonly stage: 'input' | 'output';
  readonly result: PipelineResult;

  constructor(stage: 'input' | 'output', result: PipelineResult) {
    super(`Guardrail blocked at ${stage} stage: ${result.action}`);
    this.name = 'GuardrailBlockedError';
    this.stage = stage;
    this.result = result;
  }
}

export interface GuardrailMiddlewareOptions {
  input?: Pipeline;
  fieldName?: string;
  inputFrom?: (c: any) => Promise<string> | string;
  onBlocked?: (result: PipelineResult, c: any) => Response | void;
}

export interface OutputGuardOptions {
  output: Pipeline;
  onBlocked?: (result: PipelineResult) => void;
}

async function extractText(
  c: any,
  options: GuardrailMiddlewareOptions,
): Promise<string | null> {
  if (options.inputFrom) {
    const value = await options.inputFrom(c);
    return value ?? null;
  }

  const body = await c.req.json();
  const field = options.fieldName ?? 'message';
  const value = body?.[field];
  return typeof value === 'string' ? value : null;
}

/**
 * Create a Hono middleware that guards incoming request text.
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { pipe, promptInjection } from 'open-guardrail';
 * import { createGuardrailMiddleware } from 'open-guardrail-hono';
 *
 * const app = new Hono();
 * app.use('/chat/*', createGuardrailMiddleware({
 *   input: pipe(promptInjection({ action: 'block' })),
 * }));
 * ```
 */
export function createGuardrailMiddleware(options: GuardrailMiddlewareOptions) {
  return async (c: any, next: any) => {
    if (options.input) {
      const text = await extractText(c, options);

      if (text) {
        const result = await options.input.run(text);
        c.set('guardrailResult', result);

        if (!result.passed) {
          if (options.onBlocked) {
            const response = options.onBlocked(result, c);
            if (response) return response;
            return;
          }

          const guardName =
            result.results.find((r: any) => !r.passed)?.guardName ?? 'unknown';
          return c.json({ error: 'blocked', action: result.action, guardName }, 403);
        }

        if (result.output && result.output !== text) {
          const field = options.fieldName ?? 'message';
          const body = await c.req.json();
          body[field] = result.output;
          c.set('guardrailBody', body);
        }
      }
    }

    await next();
  };
}

/**
 * Guard output text before sending a response.
 *
 * @example
 * ```typescript
 * import { pipe, pii } from 'open-guardrail';
 * import { createOutputGuard } from 'open-guardrail-hono';
 *
 * const guardOutput = createOutputGuard({
 *   output: pipe(pii({ entities: ['email'], action: 'mask' })),
 * });
 *
 * app.post('/chat', async (c) => {
 *   const llmResponse = await getLLMResponse(c.get('guardrailBody')?.message);
 *   const safe = await guardOutput(llmResponse);
 *   return c.json({ reply: safe });
 * });
 * ```
 */
export function createOutputGuard(options: OutputGuardOptions) {
  return async (text: string): Promise<string> => {
    const result = await options.output.run(text);

    if (!result.passed) {
      options.onBlocked?.(result);
      throw new GuardrailBlockedError('output', result);
    }

    return result.output ?? text;
  };
}
