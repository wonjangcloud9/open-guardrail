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

export interface GuardedOpenAIOptions {
  input?: Pipeline;
  output?: Pipeline;
  onBlocked?: (result: PipelineResult, stage: 'input' | 'output') => void;
}

interface ChatMessage {
  role: string;
  content: string | null | Array<{ type: string; text?: string }>;
  [key: string]: unknown;
}

interface ChatCompletionParams {
  messages: ChatMessage[];
  [key: string]: unknown;
}

interface ChatCompletionChoice {
  message: { role: string; content: string | null; [key: string]: unknown };
  [key: string]: unknown;
}

interface ChatCompletionResponse {
  choices: ChatCompletionChoice[];
  [key: string]: unknown;
}

type CreateFn = (params: ChatCompletionParams) => Promise<ChatCompletionResponse>;

function extractLastUserMessage(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
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

function replaceLastUserMessage(messages: ChatMessage[], newText: string): ChatMessage[] {
  const result = [...messages];
  for (let i = result.length - 1; i >= 0; i--) {
    if (result[i].role === 'user') {
      result[i] = { ...result[i], content: newText };
      break;
    }
  }
  return result;
}

/**
 * Wrap an OpenAI-compatible `chat.completions.create` function
 * with input/output guardrails.
 *
 * @example
 * ```typescript
 * import OpenAI from 'openai';
 * import { pipe, promptInjection, pii } from 'open-guardrail';
 * import { guardedCompletions } from 'open-guardrail-openai';
 *
 * const openai = new OpenAI();
 * const safeCreate = guardedCompletions(openai.chat.completions.create.bind(openai.chat.completions), {
 *   input: pipe(promptInjection({ action: 'block' })),
 *   output: pipe(pii({ entities: ['email'], action: 'mask' })),
 * });
 *
 * const response = await safeCreate({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 */
export function guardedCompletions(
  createFn: CreateFn,
  options: GuardedOpenAIOptions,
): CreateFn {
  return async (params: ChatCompletionParams): Promise<ChatCompletionResponse> => {
    let messages = params.messages;

    if (options.input) {
      const userMessage = extractLastUserMessage(messages);
      if (userMessage) {
        const result = await options.input.run(userMessage);
        if (!result.passed) {
          options.onBlocked?.(result, 'input');
          throw new GuardrailBlockedError('input', result);
        }
        if (result.output && result.output !== userMessage) {
          messages = replaceLastUserMessage(messages, result.output);
        }
      }
    }

    const response = await createFn({ ...params, messages });

    if (options.output) {
      const choices = await Promise.all(
        response.choices.map(async (choice) => {
          const text = choice.message.content;
          if (!text) return choice;

          const result = await options.output!.run(text);
          if (!result.passed) {
            options.onBlocked?.(result, 'output');
            throw new GuardrailBlockedError('output', result);
          }
          if (result.output) {
            return {
              ...choice,
              message: { ...choice.message, content: result.output },
            };
          }
          return choice;
        }),
      );

      return { ...response, choices };
    }

    return response;
  };
}

/**
 * Higher-level wrapper: pass an OpenAI client instance directly.
 *
 * @example
 * ```typescript
 * import OpenAI from 'openai';
 * import { createGuardedOpenAI } from 'open-guardrail-openai';
 *
 * const openai = new OpenAI();
 * const guarded = createGuardedOpenAI(openai, {
 *   input: pipe(promptInjection({ action: 'block' })),
 * });
 *
 * const res = await guarded.chat.completions.create({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello' }],
 * });
 * ```
 */
export function createGuardedOpenAI<T extends { chat: { completions: { create: CreateFn } } }>(
  client: T,
  options: GuardedOpenAIOptions,
): T {
  const guardedCreate = guardedCompletions(
    client.chat.completions.create.bind(client.chat.completions),
    options,
  );

  return {
    ...client,
    chat: {
      ...client.chat,
      completions: {
        ...client.chat.completions,
        create: guardedCreate,
      },
    },
  } as T;
}
