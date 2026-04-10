import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ContextWindowUtilizationOptions {
  action: 'block' | 'warn';
  maxContextRatio?: number;
  estimatedWindowSize?: number;
}

const CONTEXT_SECTION_PATTERNS: RegExp[] = [
  /(?:^|\n)Context:\s*([\s\S]+?)(?:\n\n|$)/i,
  /(?:^|\n)Retrieved:\s*([\s\S]+?)(?:\n\n|$)/i,
  /(?:^|\n)Documents?:\s*([\s\S]+?)(?:\n\n|$)/i,
  /(?:^|\n)Passages?:\s*([\s\S]+?)(?:\n\n|$)/i,
  /(?:^|\n)Sources?:\s*([\s\S]+?)(?:\n\n|$)/i,
];

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function estimateTokens(text: string): number {
  return Math.ceil(countWords(text) * 1.3);
}

function detectRepetition(text: string): number {
  const sentences = text.split(/[.!?]\s+/).filter((s) => s.length > 20);
  if (sentences.length < 4) return 0;

  const seen = new Set<string>();
  let dupes = 0;
  for (const s of sentences) {
    const norm = s.toLowerCase().trim();
    if (seen.has(norm)) dupes++;
    else seen.add(norm);
  }
  return dupes;
}

export function contextWindowUtilization(options: ContextWindowUtilizationOptions): Guard {
  const maxRatio = options.maxContextRatio ?? 0.8;
  const windowSize = options.estimatedWindowSize ?? 128000;

  return {
    name: 'context-window-utilization',
    version: '0.1.0',
    description: 'Detects inefficient context window usage or near-overflow',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      const estTokens = estimateTokens(text);
      const utilization = estTokens / windowSize;

      if (utilization > maxRatio) {
        issues.push(
          `Near context overflow: ~${estTokens} tokens (${Math.round(utilization * 100)}% of ${windowSize})`,
        );
      }

      const dupes = detectRepetition(text);
      if (dupes > 3) {
        issues.push(`Repeated content detected: ${dupes} duplicate sentences`);
      }

      let contextWords = 0;
      for (const pat of CONTEXT_SECTION_PATTERNS) {
        const m = pat.exec(text);
        if (m) {
          contextWords += countWords(m[1]);
        }
      }

      const totalWords = countWords(text);
      if (contextWords > 0 && totalWords > 0) {
        const responseWords = totalWords - contextWords;
        if (contextWords > 500 && responseWords < 20) {
          issues.push(
            `Poor utilization: ${contextWords} context words but only ${responseWords} response words`,
          );
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(utilization, 1.0) : 0;

      return {
        guardName: 'context-window-utilization',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              issues,
              estimatedTokens: estTokens,
              utilization: Math.round(utilization * 100) / 100,
              windowSize,
            }
          : undefined,
      };
    },
  };
}
