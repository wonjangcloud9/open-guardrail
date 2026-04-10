import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SourceAttributionGuardOptions {
  action: 'block' | 'warn';
  minAttributionRatio?: number;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
  'for', 'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be',
  'was', 'are', 'been', 'has', 'have', 'had', 'not', 'this',
  'that', 'they', 'them', 'their', 'what', 'which', 'who',
  'will', 'would', 'can', 'could', 'may', 'might', 'shall',
  'should', 'does', 'did', 'do', 'its', 'than', 'then', 'also',
  'into', 'more', 'some', 'such', 'were', 'when', 'where',
  'there', 'these', 'those', 'each', 'about', 'very',
]);

const SPLIT_PATTERNS: RegExp[] = [
  /(?:^|\n)Context:\s*([\s\S]+?)\n\nAnswer:\s*([\s\S]+)/i,
  /(?:^|\n)Sources?:\s*([\s\S]+?)\n\nResponse:\s*([\s\S]+)/i,
  /(?:^|\n)Retrieved:\s*([\s\S]+?)\n\nAnswer:\s*([\s\S]+)/i,
  /(?:^|\n)Passage:\s*([\s\S]+?)\n\nAnswer:\s*([\s\S]+)/i,
];

function extractContentWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
}

export function sourceAttributionGuard(options: SourceAttributionGuardOptions): Guard {
  const minRatio = options.minAttributionRatio ?? 0.3;

  return {
    name: 'source-attribution-guard',
    version: '0.1.0',
    description: 'Detects when output is not traceable to provided sources',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      let sourceSection: string | null = null;
      let answerSection: string | null = null;

      for (const pat of SPLIT_PATTERNS) {
        const m = pat.exec(text);
        if (m) {
          sourceSection = m[1];
          answerSection = m[2];
          break;
        }
      }

      if (!sourceSection || !answerSection) {
        return {
          guardName: 'source-attribution-guard',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const sourceWords = new Set(extractContentWords(sourceSection));
      const answerWords = extractContentWords(answerSection);

      if (answerWords.length === 0) {
        return {
          guardName: 'source-attribution-guard',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      let attributed = 0;
      for (const w of answerWords) {
        if (sourceWords.has(w)) attributed++;
      }

      const ratio = attributed / answerWords.length;
      const triggered = ratio < minRatio;
      const score = triggered ? 1.0 - ratio : 0;

      return {
        guardName: 'source-attribution-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              attributionRatio: Math.round(ratio * 100) / 100,
              minAttributionRatio: minRatio,
              answerWords: answerWords.length,
              attributedWords: attributed,
            }
          : undefined,
      };
    },
  };
}
