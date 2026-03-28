import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SafeSearchOptions {
  action: 'block' | 'warn';
  strictMode?: boolean;
}

const EXPLICIT_PATTERNS: RegExp[] = [
  /\b(porn|pornograph|xxx|nsfw|hentai|nude|naked)\b/i,
  /\b(sex\s*(video|scene|tape|act)|erotic|orgasm)\b/i,
  /\b(escort\s*service|prostitut|brothel)\b/i,
];

const DRUG_PATTERNS: RegExp[] = [
  /\b(buy|purchase|order)\s+(cocaine|heroin|meth|mdma|lsd|fentanyl)\b/i,
  /\bhow\s+to\s+(make|cook|synthesize)\s+(meth|drugs|crack)\b/i,
  /\b(drug\s*dealer|dark\s*web\s*market)\b/i,
];

const VIOLENCE_PATTERNS: RegExp[] = [
  /\bhow\s+to\s+(kill|murder|poison|assassinate)\b/i,
  /\b(bomb\s*making|make\s+a\s+bomb|explosive\s*recipe)\b/i,
  /\b(mass\s*shooting|school\s*shooting)\s*(how|plan|guide)\b/i,
];

const STRICT_PATTERNS: RegExp[] = [
  /\b(sexy|hot\s+girls|bikini|lingerie)\b/i,
  /\b(gore|bloody|graphic\s*violence)\b/i,
  /\b(weed|marijuana|cannabis)\s+(buy|order|shop)\b/i,
];

export function safeSearch(options: SafeSearchOptions): Guard {
  const strict = options.strictMode ?? false;
  const allPatterns = [
    ...EXPLICIT_PATTERNS,
    ...DRUG_PATTERNS,
    ...VIOLENCE_PATTERNS,
    ...(strict ? STRICT_PATTERNS : []),
  ];

  return {
    name: 'safe-search',
    version: '0.1.0',
    description: 'Safe search guard for AI-powered search',
    category: 'content',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of allPatterns) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'safe-search',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length, categories: matched } : undefined,
      };
    },
  };
}
