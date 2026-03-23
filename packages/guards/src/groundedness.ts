import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

import type { LlmCallFn } from './llm-judge.js';

export interface GroundednessOptions {
  action: 'block' | 'warn';
  callLlm: LlmCallFn;
  context: string;
  threshold?: number;
}

function buildPrompt(
  context: string,
  response: string,
): string {
  return [
    'You are a groundedness judge for RAG.',
    'Rate how well the response is grounded in',
    'the provided context on a scale of 0.0-1.0.',
    'A score of 1.0 means fully grounded.',
    '',
    '## Retrieved context',
    context,
    '',
    '## Response to evaluate',
    response,
    '',
    'Respond ONLY with JSON:',
    '{"score": 0.0, "reason": "..."}',
  ].join('\n');
}

interface LlmVerdict {
  score: number;
  reason: string;
}

function parseVerdict(raw: string): LlmVerdict {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(
      'LLM response is not valid JSON',
    );
  }
  const parsed = JSON.parse(match[0]) as Record<
    string,
    unknown
  >;

  const score = Number(parsed.score);
  if (Number.isNaN(score)) {
    throw new Error(
      'Missing numeric "score" in response',
    );
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    reason:
      typeof parsed.reason === 'string'
        ? parsed.reason
        : '',
  };
}

export function groundedness(
  options: GroundednessOptions,
): Guard {
  const threshold = options.threshold ?? 0.5;

  return {
    name: 'groundedness',
    version: '0.1.0',
    description:
      'Checks RAG groundedness via LLM',
    category: 'ai',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const prompt = buildPrompt(
        options.context,
        text,
      );

      try {
        const raw =
          await options.callLlm(prompt);
        const verdict = parseVerdict(raw);
        const passed = verdict.score >= threshold;

        return {
          guardName: 'groundedness',
          passed,
          action: passed
            ? 'allow'
            : options.action,
          score: verdict.score,
          message: verdict.reason,
          latencyMs: Math.round(
            performance.now() - start,
          ),
          details: {
            threshold,
            groundednessScore: verdict.score,
          },
        };
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error(String(error));

        return {
          guardName: 'groundedness',
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
