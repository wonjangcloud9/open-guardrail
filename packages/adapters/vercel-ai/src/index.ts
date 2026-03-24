import type { Pipeline, PipelineResult } from 'open-guardrail-core';

/**
 * Vercel AI SDK middleware-compatible interface.
 * Works with `experimental_middleware` in `generateText` / `streamText`.
 */
export interface GuardrailMiddleware {
  /**
   * Transform params before sending to the model.
   * Runs input guards on the last user message.
   */
  transformParams?: (options: {
    params: LanguageModelParams;
  }) => Promise<LanguageModelParams>;

  /**
   * Wrap generate to run output guards on the response.
   */
  wrapGenerate?: (options: {
    doGenerate: () => Promise<GenerateResult>;
    params: LanguageModelParams;
  }) => Promise<GenerateResult>;
}

interface LanguageModelParams {
  prompt: Array<{ role: string; content: string | Array<{ type: string; text?: string }> }>;
  [key: string]: unknown;
}

interface GenerateResult {
  text?: string;
  [key: string]: unknown;
}

export interface GuardrailMiddlewareOptions {
  input?: Pipeline;
  output?: Pipeline;
  onBlocked?: (result: PipelineResult, stage: 'input' | 'output') => void;
}

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

function extractLastUserMessage(params: LanguageModelParams): string | null {
  for (let i = params.prompt.length - 1; i >= 0; i--) {
    const msg = params.prompt[i];
    if (msg.role === 'user') {
      if (typeof msg.content === 'string') return msg.content;
      if (Array.isArray(msg.content)) {
        const textPart = msg.content.find((p) => p.type === 'text' && p.text);
        return textPart?.text ?? null;
      }
    }
  }
  return null;
}

function replaceLastUserMessage(params: LanguageModelParams, newText: string): LanguageModelParams {
  const prompt = [...params.prompt];
  for (let i = prompt.length - 1; i >= 0; i--) {
    if (prompt[i].role === 'user') {
      prompt[i] = { ...prompt[i], content: newText };
      break;
    }
  }
  return { ...params, prompt };
}

export function createGuardrailMiddleware(options: GuardrailMiddlewareOptions): GuardrailMiddleware {
  const middleware: GuardrailMiddleware = {};

  if (options.input) {
    middleware.transformParams = async ({ params }) => {
      const userMessage = extractLastUserMessage(params);
      if (!userMessage) return params;

      const result = await options.input!.run(userMessage);

      if (!result.passed) {
        options.onBlocked?.(result, 'input');
        throw new GuardrailBlockedError('input', result);
      }

      if (result.output && result.output !== userMessage) {
        return replaceLastUserMessage(params, result.output);
      }

      return params;
    };
  }

  if (options.output) {
    middleware.wrapGenerate = async ({ doGenerate, params }) => {
      const generateResult = await doGenerate();

      if (generateResult.text) {
        const result = await options.output!.run(generateResult.text);

        if (!result.passed) {
          options.onBlocked?.(result, 'output');
          throw new GuardrailBlockedError('output', result);
        }

        if (result.output) {
          return { ...generateResult, text: result.output };
        }
      }

      return generateResult;
    };
  }

  return middleware;
}
