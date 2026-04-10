import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseRelevanceScoreOptions {
  action: 'block' | 'warn';
  minRelevance?: number;
}

function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length >= 4);
}

export function responseRelevanceScore(
  options: ResponseRelevanceScoreOptions,
): Guard {
  const minRel = options.minRelevance ?? 0.3;

  return {
    name: 'response-relevance-score',
    version: '0.1.0',
    description:
      'Score how relevant the response is to the query',
    category: 'ai',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();

      const qIdx = text.indexOf('Query:');
      const rIdx = text.indexOf('Response:');

      if (qIdx === -1 || rIdx === -1 || rIdx <= qIdx) {
        return {
          guardName: 'response-relevance-score',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const query = text.slice(qIdx + 6, rIdx);
      const response = text.slice(rIdx + 9);

      const qWords = contentWords(query);
      if (qWords.length === 0) {
        return {
          guardName: 'response-relevance-score',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const responseLower = response.toLowerCase();
      const matched = qWords.filter((w) =>
        responseLower.includes(w),
      ).length;
      const relevanceScore = matched / qWords.length;

      const triggered = relevanceScore < minRel;
      const score = triggered ? 1 - relevanceScore : 0;

      return {
        guardName: 'response-relevance-score',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              relevanceScore:
                Math.round(relevanceScore * 100) / 100,
              matchedWords: matched,
              totalQueryWords: qWords.length,
              minRelevance: minRel,
            }
          : undefined,
      };
    },
  };
}
