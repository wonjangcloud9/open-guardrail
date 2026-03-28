import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type Rating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';

interface ContentAgeRatingOptions {
  action: 'block' | 'warn';
  maxRating?: Rating;
}

const RATING_ORDER: Rating[] = ['G', 'PG', 'PG-13', 'R', 'NC-17'];

const NC17_PATTERNS = [
  /explicit\s+sexual/i, /graphic\s+(sex|nudity)/i,
  /pornograph/i, /hardcore/i,
];

const R_PATTERNS = [
  /\bf[*u][*c][*k]/i, /\bshit\b/i, /\bass\b/i,
  /gore\b/i, /bloody\s+violence/i, /drug\s+use/i,
  /graphic\s+violence/i, /brutal/i,
];

const PG13_PATTERNS = [
  /\bdamn\b/i, /\bhell\b/i, /\bcrap\b/i,
  /violence/i, /\bkill/i, /\bdeath\b/i,
  /\bweapon/i, /\bblood\b/i,
];

const PG_PATTERNS = [
  /\bscary\b/i, /\bfrightening\b/i, /mild\s+language/i,
  /\bthreat/i, /\bdanger/i,
];

function classifyRating(text: string): Rating {
  for (const p of NC17_PATTERNS) { if (p.test(text)) return 'NC-17'; }
  for (const p of R_PATTERNS) { if (p.test(text)) return 'R'; }
  for (const p of PG13_PATTERNS) { if (p.test(text)) return 'PG-13'; }
  for (const p of PG_PATTERNS) { if (p.test(text)) return 'PG'; }
  return 'G';
}

export function contentAgeRating(options: ContentAgeRatingOptions): Guard {
  const maxRating = options.maxRating ?? 'PG-13';

  return {
    name: 'content-age-rating',
    version: '0.1.0',
    description: 'Classifies content age rating and blocks above threshold',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const detected = classifyRating(text);
      const detectedIdx = RATING_ORDER.indexOf(detected);
      const maxIdx = RATING_ORDER.indexOf(maxRating);
      const triggered = detectedIdx > maxIdx;

      return {
        guardName: 'content-age-rating',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? detectedIdx / 4 : 0,
        latencyMs: Math.round(performance.now() - start),
        details: { rating: detected, maxAllowed: maxRating },
      };
    },
  };
}
