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

export type InputExtractor = (req: any) => string;

export interface GuardrailMiddlewareOptions {
  input?: Pipeline;
  output?: Pipeline;
  inputFrom?: 'body' | 'query' | InputExtractor;
  fieldName?: string;
  onBlocked?: (result: PipelineResult, req: any, res: any) => void;
}

export interface OutputGuardOptions {
  output: Pipeline;
  onBlocked?: (result: PipelineResult) => void;
}

function extractText(req: any, options: GuardrailMiddlewareOptions): string | null {
  const field = options.fieldName ?? 'message';
  const source = options.inputFrom ?? 'body';

  if (typeof source === 'function') {
    return source(req) ?? null;
  }

  const container = source === 'query' ? req.query : req.body;
  if (!container) return null;

  const value = container[field];
  return typeof value === 'string' ? value : null;
}

/**
 * Create an Express middleware that guards incoming request text.
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { pipe, promptInjection } from 'open-guardrail';
 * import { createGuardrailMiddleware } from 'open-guardrail-express';
 *
 * const app = express();
 * app.use(express.json());
 * app.use(createGuardrailMiddleware({
 *   input: pipe(promptInjection({ action: 'block' })),
 * }));
 * ```
 */
export function createGuardrailMiddleware(options: GuardrailMiddlewareOptions) {
  return async (req: any, res: any, next: any) => {
    try {
      if (options.input) {
        const text = extractText(req, options);

        if (text) {
          const result = await options.input.run(text);
          req.guardrailResult = result;

          if (!result.passed) {
            if (options.onBlocked) {
              options.onBlocked(result, req, res);
              return;
            }

            const guardName = result.results.find((r) => !r.passed)?.guardName ?? 'unknown';
            res.status(403).json({
              error: 'blocked',
              action: result.action,
              guardName,
            });
            return;
          }

          if (result.output && result.output !== text) {
            const field = options.fieldName ?? 'message';
            const source = options.inputFrom ?? 'body';
            if (source === 'body' || source === undefined) {
              req.body[field] = result.output;
            }
          }
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Guard output text before sending a response.
 *
 * @example
 * ```typescript
 * import { pipe, pii } from 'open-guardrail';
 * import { createOutputGuard } from 'open-guardrail-express';
 *
 * const guardOutput = createOutputGuard({
 *   output: pipe(pii({ entities: ['email'], action: 'mask' })),
 * });
 *
 * app.post('/chat', async (req, res) => {
 *   const llmResponse = await getLLMResponse(req.body.message);
 *   const safe = await guardOutput(llmResponse);
 *   res.json({ reply: safe });
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
