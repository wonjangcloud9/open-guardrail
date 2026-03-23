import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type SentimentCategory =
  | 'negative'
  | 'aggressive'
  | 'fearful';

interface SentimentOptions {
  action: 'block' | 'warn';
  blocked?: SentimentCategory[];
  threshold?: number;
}

const KEYWORD_LISTS: Record<SentimentCategory, string[]> = {
  negative: [
    'terrible', 'horrible', 'awful', 'disgusting',
    'pathetic', 'miserable', 'dreadful', 'hopeless',
    'worthless', 'useless', 'hate', 'despise',
    'worst', 'abysmal', 'atrocious',
  ],
  aggressive: [
    'kill', 'destroy', 'attack', 'crush',
    'fight', 'smash', 'punch', 'beat',
    'rage', 'fury', 'violent', 'assault',
    'threaten', 'brutalize', 'annihilate',
  ],
  fearful: [
    'terrified', 'panic', 'dread', 'horror',
    'nightmare', 'scared', 'frightened', 'alarming',
    'petrified', 'anxious', 'phobia', 'doom',
  ],
};

export function sentiment(options: SentimentOptions): Guard {
  const blocked = options.blocked ?? ['aggressive'];
  const threshold = options.threshold ?? 0.5;

  return {
    name: 'sentiment',
    version: '0.1.0',
    description: 'Keyword-based sentiment analysis guard',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const words = lower.split(/\s+/).filter(Boolean);
      const wordCount = words.length || 1;
      const scores: Record<string, number> = {};
      const matchedWords: Record<string, string[]> = {};
      let triggered = false;

      for (const cat of blocked) {
        const keywords = KEYWORD_LISTS[cat] ?? [];
        const found: string[] = [];
        for (const kw of keywords) {
          const rx = new RegExp(
            `\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          );
          if (rx.test(lower)) found.push(kw);
        }
        const score = Math.min(1.0, found.length / wordCount * 3);
        scores[cat] = score;
        if (found.length > 0) matchedWords[cat] = found;
        if (score >= threshold) triggered = true;
      }

      return {
        guardName: 'sentiment',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: { scores, matchedWords },
      };
    },
  };
}
