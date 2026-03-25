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

export interface GuardedAnthropicOptions {
  input?: Pipeline;
  output?: Pipeline;
  onBlocked?: (result: PipelineResult, stage: 'input' | 'output') => void;
}

interface ContentBlock {
  type: string;
  text?: string;
  [key: string]: unknown;
}

interface ChatMessage {
  role: string;
  content: string | ContentBlock[];
  [key: string]: unknown;
}

interface MessagesParams {
  messages: ChatMessage[];
  [key: string]: unknown;
}

interface MessagesResponse {
  content: ContentBlock[];
  [key: string]: unknown;
}

type MessagesCreateFn = (params: MessagesParams) => Promise<MessagesResponse>;

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
 * Wrap an Anthropic-compatible `messages.create` function
 * with input/output guardrails.
 *
 * @example
 * ```typescript
 * import Anthropic from '@anthropic-ai/sdk';
 * import { pipe, promptInjection, pii } from 'open-guardrail';
 * import { guardedMessages } from 'open-guardrail-anthropic';
 *
 * const anthropic = new Anthropic();
 * const safeCreate = guardedMessages(
 *   anthropic.messages.create.bind(anthropic.messages),
 *   {
 *     input: pipe(promptInjection({ action: 'block' })),
 *     output: pipe(pii({ entities: ['email'], action: 'mask' })),
 *   },
 * );
 *
 * const response = await safeCreate({
 *   model: 'claude-sonnet-4-20250514',
 *   max_tokens: 1024,
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 */
export function guardedMessages(
  createFn: MessagesCreateFn,
  options: GuardedAnthropicOptions,
): MessagesCreateFn {
  return async (params: MessagesParams): Promise<MessagesResponse> => {
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
      const content = await Promise.all(
        response.content.map(async (block) => {
          if (block.type !== 'text' || !block.text) return block;

          const result = await options.output!.run(block.text);
          if (!result.passed) {
            options.onBlocked?.(result, 'output');
            throw new GuardrailBlockedError('output', result);
          }
          if (result.output) {
            return { ...block, text: result.output };
          }
          return block;
        }),
      );

      return { ...response, content };
    }

    return response;
  };
}

/**
 * Higher-level wrapper: pass an Anthropic client instance directly.
 *
 * @example
 * ```typescript
 * import Anthropic from '@anthropic-ai/sdk';
 * import { createGuardedAnthropic } from 'open-guardrail-anthropic';
 *
 * const anthropic = new Anthropic();
 * const guarded = createGuardedAnthropic(anthropic, {
 *   input: pipe(promptInjection({ action: 'block' })),
 * });
 *
 * const res = await guarded.messages.create({
 *   model: 'claude-sonnet-4-20250514',
 *   max_tokens: 1024,
 *   messages: [{ role: 'user', content: 'Hello' }],
 * });
 * ```
 */
export function createGuardedAnthropic<T extends { messages: { create: MessagesCreateFn } }>(
  client: T,
  options: GuardedAnthropicOptions,
): T {
  const guardedCreate = guardedMessages(
    client.messages.create.bind(client.messages),
    options,
  );

  return {
    ...client,
    messages: {
      ...client.messages,
      create: guardedCreate,
    },
  } as T;
}
