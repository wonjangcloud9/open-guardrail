import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

export type LlmCallFn = (prompt: string) => Promise<string>;

export interface LlmJudgeOptions {
  action: 'block' | 'warn';
  callLlm: LlmCallFn;
  systemPrompt: string;
  userPromptTemplate: string;
  parseResponse: (response: string) => {
    passed: boolean;
    score?: number;
    reason?: string;
  };
}

export function llmJudge(options: LlmJudgeOptions): Guard {
  return {
    name: 'llm-judge',
    version: '0.1.0',
    description:
      'Delegates judgment to an external LLM',
    category: 'ai',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();

      const userPrompt =
        options.userPromptTemplate.replace(
          /\{\{text\}\}/g,
          text,
        );
      const fullPrompt = `${options.systemPrompt}\n\n${userPrompt}`;

      try {
        const response =
          await options.callLlm(fullPrompt);
        const parsed =
          options.parseResponse(response);

        return {
          guardName: 'llm-judge',
          passed: parsed.passed,
          action: parsed.passed
            ? 'allow'
            : options.action,
          score: parsed.score,
          message: parsed.reason,
          latencyMs: Math.round(
            performance.now() - start,
          ),
          details: { llmResponse: response },
        };
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error(String(error));

        return {
          guardName: 'llm-judge',
          passed: false,
          action: options.action,
          latencyMs: Math.round(
            performance.now() - start,
          ),
          error: {
            code: 'EXCEPTION',
            message: err.message,
            cause: err,
          },
        };
      }
    },
  };
}
