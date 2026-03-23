import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

import type { LlmCallFn } from './llm-judge.js';

export interface HallucinationOptions {
  action: 'block' | 'warn';
  callLlm: LlmCallFn;
  sources: string[];
}

function buildPrompt(
  text: string,
  sources: string[],
): string {
  const numbered = sources
    .map((s, i) => `[Source ${i + 1}]: ${s}`)
    .join('\n');

  return [
    'You are a hallucination detection judge.',
    'Determine whether the claims in the',
    'following text are supported by the',
    'provided source documents.',
    '',
    '## Sources',
    numbered,
    '',
    '## Text to verify',
    text,
    '',
    'Respond ONLY with JSON:',
    '{"supported": true/false,',
    ' "unsupported_claims": ["..."]}',
  ].join('\n');
}

interface LlmVerdict {
  supported: boolean;
  unsupported_claims: string[];
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

  if (typeof parsed.supported !== 'boolean') {
    throw new Error(
      'Missing "supported" boolean in response',
    );
  }

  return {
    supported: parsed.supported,
    unsupported_claims: Array.isArray(
      parsed.unsupported_claims,
    )
      ? (parsed.unsupported_claims as string[])
      : [],
  };
}

export function hallucination(
  options: HallucinationOptions,
): Guard {
  return {
    name: 'hallucination',
    version: '0.1.0',
    description:
      'Checks for hallucinated content via LLM',
    category: 'ai',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const prompt = buildPrompt(
        text,
        options.sources,
      );

      try {
        const raw =
          await options.callLlm(prompt);
        const verdict = parseVerdict(raw);

        return {
          guardName: 'hallucination',
          passed: verdict.supported,
          action: verdict.supported
            ? 'allow'
            : options.action,
          score: verdict.supported ? 0 : 1,
          latencyMs: Math.round(
            performance.now() - start,
          ),
          details: {
            supported: verdict.supported,
            unsupportedClaims:
              verdict.unsupported_claims,
          },
        };
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error(String(error));

        return {
          guardName: 'hallucination',
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
