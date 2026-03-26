import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface PersonalOpinionOptions {
  action: 'block' | 'warn';
}

const OPINION_PATTERNS: RegExp[] = [
  /I (?:think|believe|feel|personally|prefer|suggest)\b/gi,
  /in my (?:opinion|view|experience)\b/gi,
  /I would (?:say|recommend|suggest)\b/gi,
  /my (?:favorite|preference|recommendation)\b/gi,
  /I(?:'m| am) (?:not a fan|a big fan)\b/gi,
  /from my perspective\b/gi,
  /if (?:you ask me|I were you)\b/gi,
];

export function personalOpinion(options: PersonalOpinionOptions): Guard {
  return {
    name: 'personal-opinion',
    version: '0.1.0',
    description: 'Detect personal opinions in factual responses',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of OPINION_PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0]);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'personal-opinion',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Personal opinion detected: "${matched[0]}"`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matched, reason: 'Response contains personal opinion language instead of objective facts' }
          : undefined,
      };
    },
  };
}
