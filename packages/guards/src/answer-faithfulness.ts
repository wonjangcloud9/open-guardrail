import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AnswerFaithfulnessOptions {
  action: 'block' | 'warn';
  contextMarker?: string;
  answerMarker?: string;
}

function extractContentWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length >= 4);
}

const ASSERTION_PATTERN =
  /\b(?:is|are|was|were|has|have|had|will|can|does)\b/i;
const NUMBER_PATTERN = /\d+/;
const PROPER_NOUN_PATTERN = /\b[A-Z][a-z]{2,}/;

function isFactualClaim(sentence: string): boolean {
  return (
    ASSERTION_PATTERN.test(sentence) ||
    NUMBER_PATTERN.test(sentence) ||
    PROPER_NOUN_PATTERN.test(sentence)
  );
}

export function answerFaithfulness(
  options: AnswerFaithfulnessOptions,
): Guard {
  const ctxMarker = options.contextMarker ?? 'Context:';
  const ansMarker = options.answerMarker ?? 'Answer:';

  return {
    name: 'answer-faithfulness',
    version: '0.1.0',
    description:
      'Verify response is grounded only in provided context',
    category: 'ai',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();

      const ctxIdx = text.indexOf(ctxMarker);
      const ansIdx = text.indexOf(ansMarker);

      if (ctxIdx === -1 || ansIdx === -1 || ansIdx <= ctxIdx) {
        return {
          guardName: 'answer-faithfulness',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const context = text.slice(
        ctxIdx + ctxMarker.length,
        ansIdx,
      );
      const answer = text.slice(ansIdx + ansMarker.length);
      const contextWords = new Set(extractContentWords(context));

      const sentences = answer
        .split(/(?<=[.!?])\s+/)
        .filter((s) => s.trim().length > 0);
      const claims = sentences.filter(isFactualClaim);

      if (claims.length === 0) {
        return {
          guardName: 'answer-faithfulness',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      let grounded = 0;
      for (const claim of claims) {
        const words = extractContentWords(claim);
        if (words.length === 0) {
          grounded++;
          continue;
        }
        const matched = words.filter((w) =>
          contextWords.has(w),
        ).length;
        if (matched / words.length >= 0.3) grounded++;
      }

      const ratio = grounded / claims.length;
      const triggered = ratio < 0.5;
      const score = triggered ? 1 - ratio : 0;

      return {
        guardName: 'answer-faithfulness',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              faithfulnessRatio: Math.round(ratio * 100) / 100,
              groundedClaims: grounded,
              totalClaims: claims.length,
            }
          : undefined,
      };
    },
  };
}
