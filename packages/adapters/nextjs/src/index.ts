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

export interface RouteGuardOptions {
  input?: Pipeline;
  output?: Pipeline;
  fieldName?: string;
  inputFrom?: (body: any) => string;
  onBlocked?: (result: PipelineResult) => Response;
}

export interface ApiRouteGuardOptions {
  input: Pipeline;
  fieldName?: string;
  inputFrom?: (body: any) => string;
  onBlocked?: (result: PipelineResult) => Response;
}

export type AppRouterHandler = (
  request: Request,
  context?: any,
) => Response | Promise<Response>;

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function extractField(body: any, options: { fieldName?: string; inputFrom?: (body: any) => string }): string | null {
  if (options.inputFrom) {
    return options.inputFrom(body) ?? null;
  }
  const field = options.fieldName ?? 'message';
  const value = body?.[field];
  return typeof value === 'string' ? value : null;
}

/**
 * Wrap a Next.js App Router handler with guardrail pipelines.
 *
 * @example
 * ```ts
 * import { pipe, promptInjection } from 'open-guardrail';
 * import { createRouteGuard } from 'open-guardrail-nextjs';
 *
 * const guard = createRouteGuard({
 *   input: pipe(promptInjection({ action: 'block' })),
 * });
 *
 * export const POST = guard(async (request) => {
 *   const body = await request.json();
 *   return Response.json({ reply: 'ok' });
 * });
 * ```
 */
export function createRouteGuard(options: RouteGuardOptions) {
  return (handler: AppRouterHandler) => {
    return async (request: Request, context?: any): Promise<Response> => {
      let body: any;

      try {
        body = await request.clone().json();
      } catch {
        return handler(request, context);
      }

      if (options.input) {
        const text = extractField(body, options);

        if (text) {
          const result = await options.input.run(text);

          if (!result.passed) {
            if (options.onBlocked) {
              return options.onBlocked(result);
            }
            const guardName = result.results.find((r) => !r.passed)?.guardName ?? 'unknown';
            return jsonResponse({ error: 'blocked', action: result.action, guardName }, 403);
          }

          if (result.output && result.output !== text) {
            const field = options.fieldName ?? 'message';
            body[field] = result.output;
          }
        }
      }

      const modifiedRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(body),
      });

      let response = await handler(modifiedRequest, context);

      if (options.output && response.headers.get('content-type')?.includes('json')) {
        try {
          const respBody = await response.clone().json();
          const respText = typeof respBody === 'string' ? respBody : respBody?.message ?? respBody?.reply;
          if (typeof respText === 'string') {
            const result = await options.output.run(respText);
            if (!result.passed) {
              throw new GuardrailBlockedError('output', result);
            }
          }
        } catch (err) {
          if (err instanceof GuardrailBlockedError) throw err;
        }
      }

      return response;
    };
  };
}

/**
 * Guard an API route input and return parsed body or a 403 Response.
 *
 * @example
 * ```ts
 * import { pipe, toxicity } from 'open-guardrail';
 * import { guardApiRoute } from 'open-guardrail-nextjs';
 *
 * const guard = guardApiRoute({
 *   input: pipe(toxicity({ action: 'block' })),
 * });
 *
 * export async function POST(request: Request) {
 *   const checked = await guard(request);
 *   if (checked instanceof Response) return checked;
 *   const { body, result } = checked;
 *   return Response.json({ reply: body.message });
 * }
 * ```
 */
export function guardApiRoute(options: ApiRouteGuardOptions) {
  return async (request: Request): Promise<{ body: any; result: PipelineResult } | Response> => {
    let body: any;

    try {
      body = await request.clone().json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const text = extractField(body, options);

    if (!text) {
      return { body, result: { passed: true, action: 'allow', results: [], input: '', totalLatencyMs: 0, metadata: { pipelineType: 'input', mode: 'fail-fast', dryRun: false, timestamp: '' } } as PipelineResult };
    }

    const result = await options.input.run(text);

    if (!result.passed) {
      if (options.onBlocked) {
        return options.onBlocked(result);
      }
      const guardName = result.results.find((r) => !r.passed)?.guardName ?? 'unknown';
      return jsonResponse({ error: 'blocked', action: result.action, guardName }, 403);
    }

    if (result.output && result.output !== text) {
      const field = options.fieldName ?? 'message';
      body[field] = result.output;
    }

    return { body, result };
  };
}

/**
 * Guard output text with a pipeline. Returns the (possibly modified) text or throws.
 */
export async function guardResponse(pipeline: Pipeline, text: string): Promise<string> {
  const result = await pipeline.run(text);

  if (!result.passed) {
    throw new GuardrailBlockedError('output', result);
  }

  return result.output ?? text;
}
