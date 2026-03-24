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

export interface GuardrailRunnableOptions {
  input?: Pipeline;
  output?: Pipeline;
  onBlocked?: (result: PipelineResult, stage: 'input' | 'output') => void;
}

/**
 * LangChain.js compatible guardrail wrapper.
 *
 * Usage with LCEL:
 * ```typescript
 * const chain = guardrailRunnable.pipe(model).pipe(outputGuardrail);
 * ```
 *
 * Or wrap an existing chain:
 * ```typescript
 * const safeFn = createGuardrailChain({ input: inputPipeline, output: outputPipeline });
 * const result = await safeFn.invoke('user message');
 * ```
 */
export class GuardrailRunnable {
  private inputPipeline?: Pipeline;
  private outputPipeline?: Pipeline;
  private onBlocked?: (result: PipelineResult, stage: 'input' | 'output') => void;

  constructor(options: GuardrailRunnableOptions) {
    this.inputPipeline = options.input;
    this.outputPipeline = options.output;
    this.onBlocked = options.onBlocked;
  }

  /**
   * Guard input text. Returns the (possibly masked) safe text.
   * Throws GuardrailBlockedError if blocked.
   */
  async guardInput(text: string): Promise<string> {
    if (!this.inputPipeline) return text;

    const result = await this.inputPipeline.run(text);
    if (!result.passed) {
      this.onBlocked?.(result, 'input');
      throw new GuardrailBlockedError('input', result);
    }

    return result.output ?? text;
  }

  /**
   * Guard output text. Returns the (possibly masked) safe text.
   * Throws GuardrailBlockedError if blocked.
   */
  async guardOutput(text: string): Promise<string> {
    if (!this.outputPipeline) return text;

    const result = await this.outputPipeline.run(text);
    if (!result.passed) {
      this.onBlocked?.(result, 'output');
      throw new GuardrailBlockedError('output', result);
    }

    return result.output ?? text;
  }

  /**
   * LangChain-compatible invoke: guard input, pass through, guard output.
   * When used standalone, acts as an input guard that returns safe text.
   */
  async invoke(input: string): Promise<string> {
    return this.guardInput(input);
  }

  /**
   * Guard multiple inputs in batch.
   */
  async batch(inputs: string[]): Promise<string[]> {
    return Promise.all(inputs.map((input) => this.invoke(input)));
  }
}

/**
 * Create a GuardrailRunnable for use with LangChain.js chains.
 */
export function createGuardrailChain(options: GuardrailRunnableOptions): GuardrailRunnable {
  return new GuardrailRunnable(options);
}
