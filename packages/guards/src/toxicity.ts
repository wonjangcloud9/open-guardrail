import type {
  Guard,
  GuardResult,
  GuardContext,
} from '@open-guardrail/core';

interface ToxicityOptions {
  action: 'block' | 'warn';
  categories?: (
    | 'profanity'
    | 'hate'
    | 'threat'
    | 'harassment'
  )[];
  threshold?: number;
}

const WORD_LISTS: Record<string, string[]> = {
  profanity: [
    'damn', 'hell', 'crap', 'shit',
    'fuck', 'ass', 'bastard', 'bitch',
  ],
  hate: [
    'hate you', 'subhuman', 'inferior race',
    'go back to your country',
    'white supremacy', 'racial slur',
  ],
  threat: [
    'i will kill', 'going to hurt you',
    'i will find you', 'you will die',
    'death threat', 'i will destroy you',
    'burn your house',
  ],
  harassment: [
    'you are stupid', 'you are worthless',
    'nobody likes you', 'you are ugly',
    'loser', 'shut up', 'go away',
    'you disgust me',
  ],
};

const SEVERITY: Record<string, number> = {
  profanity: 0.6,
  hate: 1.0,
  threat: 1.0,
  harassment: 0.7,
};

const ALL_CATEGORIES = [
  'profanity', 'hate', 'threat', 'harassment',
] as const;

export function toxicity(options: ToxicityOptions): Guard {
  const threshold = options.threshold ?? 0.5;
  const cats = options.categories ?? [...ALL_CATEGORIES];

  return {
    name: 'toxicity',
    version: '0.1.0',
    description: 'Keyword-based toxicity detection',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matchedCategories: Record<string, string[]> = {};
      let maxSeverity = 0;

      for (const cat of cats) {
        const words = WORD_LISTS[cat] ?? [];
        const found: string[] = [];
        for (const w of words) {
          const pattern = new RegExp(
            `\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          );
          if (pattern.test(lower)) found.push(w);
        }
        if (found.length > 0) {
          matchedCategories[cat] = found;
          const sev = SEVERITY[cat] ?? 0.5;
          if (sev > maxSeverity) maxSeverity = sev;
        }
      }

      const catKeys = Object.keys(matchedCategories);
      const totalMatches = catKeys.reduce(
        (s, k) => s + matchedCategories[k].length,
        0,
      );
      const score =
        catKeys.length > 0
          ? Math.min(
              1.0,
              maxSeverity +
                (1 - maxSeverity) *
                  Math.min((totalMatches - 1) / 4, 1),
            )
          : 0;
      const triggered = score >= threshold;

      return {
        guardName: 'toxicity',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details:
          catKeys.length > 0
            ? { matchedCategories }
            : undefined,
      };
    },
  };
}
