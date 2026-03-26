import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface AgeGateOptions {
  action: 'block' | 'warn';
  topics?: ('alcohol' | 'gambling' | 'tobacco' | 'adult' | 'weapons' | 'drugs')[];
}

const TOPIC_KEYWORDS: Record<string, string[]> = {
  alcohol: ['beer', 'wine', 'vodka', 'whiskey', 'cocktail', 'liquor', 'bourbon', 'tequila', 'drunk', 'hangover', 'bar crawl', 'drinking game', '맥주', '소주', '막걸리', 'ビール', '日本酒', '啤酒', '白酒'],
  gambling: ['casino', 'poker', 'blackjack', 'slot machine', 'betting', 'wager', 'jackpot', 'roulette', 'baccarat', '카지노', '도박', '베팅', 'カジノ', '赌博'],
  tobacco: ['cigarette', 'smoking', 'vaping', 'e-cigarette', 'nicotine', 'cigar', 'tobacco', '담배', '흡연', 'タバコ', '香烟'],
  adult: ['nsfw', 'explicit', 'pornography', 'erotic', 'sexual content', 'xxx', '19금', '성인'],
  weapons: ['firearm', 'handgun', 'rifle', 'ammunition', 'shotgun', 'assault weapon', 'gun shop', '총기', '銃'],
  drugs: ['marijuana', 'cocaine', 'heroin', 'methamphetamine', 'drug dealer', 'narcotics', 'opioid', '마약', '大麻', '覚醒剤'],
};

const ALL_TOPICS = Object.keys(TOPIC_KEYWORDS) as (keyof typeof TOPIC_KEYWORDS)[];

export function ageGate(options: AgeGateOptions): Guard {
  const topics = options.topics ?? ALL_TOPICS;

  return {
    name: 'age-gate',
    version: '0.1.0',
    description: 'Detect age-restricted content (alcohol, gambling, tobacco, adult, weapons, drugs)',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const triggered: Record<string, string[]> = {};

      for (const topic of topics) {
        const keywords = TOPIC_KEYWORDS[topic] ?? [];
        const found: string[] = [];
        for (const kw of keywords) {
          if (lower.includes(kw.toLowerCase())) found.push(kw);
        }
        if (found.length > 0) triggered[topic] = found;
      }

      const hasMatch = Object.keys(triggered).length > 0;

      return {
        guardName: 'age-gate',
        passed: !hasMatch,
        action: hasMatch ? options.action : 'allow',
        message: hasMatch
          ? `Age-restricted content detected: ${Object.keys(triggered).join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: hasMatch
          ? { triggered, reason: 'Content relates to age-restricted topics requiring age verification' }
          : undefined,
      };
    },
  };
}
