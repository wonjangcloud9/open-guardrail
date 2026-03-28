import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AnswerCitationNeededOptions {
  action: 'block' | 'warn';
  threshold?: number;
}

const UNCITED_PATTERNS: RegExp[] = [
  /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*%/,
  /\bstudies?\s+(?:show|suggest|indicate|found|demonstrate)\b/i,
  /\bresearch\s+(?:shows?|suggests?|indicates?|found|demonstrates?)\b/i,
  /\baccording\s+to\s+(?:experts?|scientists?|researchers?)\b/i,
  /\bstatistic(?:s|ally)\s/i,
  /\b(?:survey|poll|report)\s+(?:shows?|found|reveals?)\b/i,
  /\bscientific(?:ally)?\s+(?:proven|established)\b/i,
  /\b(?:data|evidence)\s+(?:shows?|suggests?|indicates?)\b/i,
  /\bin\s+\d{4}\s*,\s*(?:a\s+)?(?:study|report|survey)\b/i,
  /\b(?:approximately|roughly|about)\s+\d+(?:\.\d+)?\s*(?:million|billion|trillion|percent|%)\b/i,
];

const CITATION_MARKERS: RegExp[] = [
  /\[[\d,\s]+\]/,
  /\((?:(?:19|20)\d{2})\)/,
  /https?:\/\//,
  /(?:source|reference|citation|ref)\s*[:]/i,
];

function hasCitation(text: string): boolean {
  return CITATION_MARKERS.some((p) => p.test(text));
}

export function answerCitationNeeded(options: AnswerCitationNeededOptions): Guard {
  const threshold = options.threshold ?? 3;

  return {
    name: 'answer-citation-needed',
    version: '0.1.0',
    description: 'Flags claims that need citations',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      let uncited = 0;

      const sentences = text.split(/(?<=[.!?])\s+/);
      for (const s of sentences) {
        const needsCite = UNCITED_PATTERNS.some((p) => p.test(s));
        if (needsCite && !hasCitation(s)) uncited++;
      }

      const triggered = uncited >= threshold;
      const score = triggered ? Math.min(uncited / (threshold * 2), 1.0) : 0;

      return {
        guardName: 'answer-citation-needed',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { uncitedClaims: uncited, threshold } : undefined,
      };
    },
  };
}
