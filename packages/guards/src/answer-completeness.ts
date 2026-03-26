import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface AnswerCompletenessOptions {
  action: 'block' | 'warn';
  minSentences?: number;
  requireConclusion?: boolean;
}

const INCOMPLETE_PATTERNS: RegExp[] = [
  /(?:\.{3}|…)\s*$/,
  /\b(?:etc|and so on|and more|to be continued)\s*\.?\s*$/gi,
  /\bI (?:can't|cannot) (?:provide|give|share) (?:more|additional|further)\b/gi,
  /\b(?:unfortunately|however),?\s*(?:I|that's|this is)\s+(?:all|the limit|as far)\b/gi,
  /\bthere(?:'s| is) more to\b.*\bbut\b/gi,
];

const CONCLUSION_PATTERNS: RegExp[] = [
  /\bin (?:conclusion|summary|short)\b/gi,
  /\bto (?:summarize|conclude|wrap up)\b/gi,
  /\boverall\b/gi,
  /\bthe (?:key|main) (?:takeaway|point)\b/gi,
  /\bhope this (?:helps|answers)\b/gi,
  /\blet me know if\b/gi,
];

export function answerCompleteness(options: AnswerCompletenessOptions): Guard {
  const minSentences = options.minSentences ?? 2;
  const requireConclusion = options.requireConclusion ?? false;

  return {
    name: 'answer-completeness',
    version: '0.1.0',
    description: 'Check if LLM response is complete and not truncated',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];

      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
      if (sentences.length < minSentences) {
        violations.push(`Only ${sentences.length} sentence(s), minimum ${minSentences}`);
      }

      for (const pattern of INCOMPLETE_PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) {
          violations.push('Response appears truncated or incomplete');
          break;
        }
      }

      if (requireConclusion) {
        const hasConclusion = CONCLUSION_PATTERNS.some((p) => {
          const re = new RegExp(p.source, p.flags);
          return re.test(text);
        });
        if (!hasConclusion) {
          violations.push('Response lacks a concluding statement');
        }
      }

      const triggered = violations.length > 0;

      return {
        guardName: 'answer-completeness',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? violations.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { violations, sentenceCount: sentences.length, reason: 'Response may be incomplete or truncated' }
          : { sentenceCount: sentences.length },
      };
    },
  };
}
