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

export type InputExtractor = (request: any) => string;

export interface GuardrailPluginOptions {
  input?: Pipeline;
  fieldName?: string;
  inputFrom?: InputExtractor;
  onBlocked?: (result: PipelineResult, request: any, reply: any) => void;
}

export interface OutputGuardOptions {
  output: Pipeline;
  onBlocked?: (result: PipelineResult) => void;
}

function extractText(request: any, options: GuardrailPluginOptions): string | null {
  if (typeof options.inputFrom === 'function') {
    return options.inputFrom(request) ?? null;
  }

  const field = options.fieldName ?? 'message';
  const body = request.body;
  if (!body) return null;

  const value = body[field];
  return typeof value === 'string' ? value : null;
}

/**
 * Create a Fastify plugin that guards incoming request text.
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * import { pipe, promptInjection } from 'open-guardrail';
 * import { createGuardrailPlugin } from 'open-guardrail-fastify';
 *
 * const app = Fastify();
 * app.register(createGuardrailPlugin({
 *   input: pipe(promptInjection({ action: 'block' })),
 * }));
 * ```
 */
export function createGuardrailPlugin(options: GuardrailPluginOptions) {
  const plugin = async (fastify: any) => {
    fastify.addHook('preHandler', async (request: any, reply: any) => {
      if (!options.input) return;

      const text = extractText(request, options);
      if (!text) return;

      const result = await options.input.run(text);
      request.guardrailResult = result;

      if (!result.passed) {
        if (options.onBlocked) {
          options.onBlocked(result, request, reply);
          return;
        }

        const guardName = result.results.find((r: any) => !r.passed)?.guardName ?? 'unknown';
        reply.code(403).send({
          error: 'blocked',
          action: result.action,
          guardName,
        });
        return;
      }

      if (result.output && result.output !== text) {
        const field = options.fieldName ?? 'message';
        if (request.body) {
          request.body[field] = result.output;
        }
      }
    });
  };

  return plugin;
}

/**
 * Guard output text before sending a response.
 *
 * @example
 * ```typescript
 * import { pipe, pii } from 'open-guardrail';
 * import { createOutputGuard } from 'open-guardrail-fastify';
 *
 * const guardOutput = createOutputGuard({
 *   output: pipe(pii({ entities: ['email'], action: 'mask' })),
 * });
 *
 * app.post('/chat', async (request, reply) => {
 *   const llmResponse = await getLLMResponse(request.body.message);
 *   const safe = await guardOutput(llmResponse);
 *   reply.send({ reply: safe });
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
