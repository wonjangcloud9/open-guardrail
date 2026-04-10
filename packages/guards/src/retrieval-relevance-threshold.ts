import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RetrievalRelevanceThresholdOptions {
  action: 'block' | 'warn';
  minKeywordOverlap?: number;
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'about', 'it', 'its', 'this', 'that', 'and',
  'or', 'but', 'if', 'not', 'no', 'so', 'what', 'which', 'who',
  'how', 'when', 'where', 'why', 'all', 'each', 'every', 'both',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she',
  'they', 'them', 'his', 'her', 'their',
]);

function extractKeywords(text: string): Set<string> {
  const words = text.toLowerCase().match(/\b[a-z]{2,}\b/g) ?? [];
  return new Set(words.filter((w) => !STOP_WORDS.has(w)));
}

export function retrievalRelevanceThreshold(
  options: RetrievalRelevanceThresholdOptions,
): Guard {
  const minOverlap = options.minKeywordOverlap ?? 0.2;

  return {
    name: 'retrieval-relevance-threshold',
    version: '0.1.0',
    description: 'Detects low-relevance retrieved content via keyword overlap',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      const queryMatch = text.match(
        /^(?:query|question)\s*:\s*(.+?)(?:\n|$)/im,
      );
      const contextMatch = text.match(
        /(?:^|\n)(?:context|passage|document)\s*:\s*([\s\S]+)/im,
      );

      if (!queryMatch || !contextMatch) {
        return {
          guardName: 'retrieval-relevance-threshold',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
          details: { reason: 'No query/context structure found' },
        };
      }

      const queryKeywords = extractKeywords(queryMatch[1]);
      const contextKeywords = extractKeywords(contextMatch[1]);

      if (queryKeywords.size === 0) {
        return {
          guardName: 'retrieval-relevance-threshold',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      let overlap = 0;
      for (const kw of queryKeywords) {
        if (contextKeywords.has(kw)) overlap++;
      }
      const overlapRatio = overlap / queryKeywords.size;
      const triggered = overlapRatio < minOverlap;

      return {
        guardName: 'retrieval-relevance-threshold',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? 1 - overlapRatio : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { overlapRatio, threshold: minOverlap }
          : undefined,
      };
    },
  };
}
