import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SafetyClassifierOptions {
  action: 'block' | 'warn';
  /** Categories to check (default all) */
  categories?: string[];
  /** Global threshold 0-1 (default 0.5) */
  threshold?: number;
}

const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  'harmful-instructions': [
    /\b(?:how\s+to\s+(?:make|build|create|synthesize))\s+(?:a\s+)?(?:bomb|explosive|weapon|poison|drug)/i,
    /\b(?:instructions?\s+(?:for|to)\s+(?:hack|break\s+into|exploit))/i,
  ],
  'self-harm': [
    /\b(?:suicide|kill\s+myself|end\s+my\s+life|self[_\-\s]*harm|cut\s+myself)\b/i,
    /\b(?:ways?\s+to\s+die|painless\s+death|methods?\s+of\s+suicide)\b/i,
  ],
  'harassment': [
    /\b(?:you\s+(?:are|should)\s+(?:die|kill|stupid|worthless|ugly|fat))\b/i,
    /\b(?:threaten|intimidat|bully|harass|stalk)\w*\b/i,
  ],
  'deception': [
    /\b(?:pretend|impersonat|disguise\s+as|pose\s+as|fake\s+(?:identity|account))\b/i,
    /\b(?:catfish|scam|fraud|phishing|social\s+engineer)\b/i,
  ],
  'illegal-activity': [
    /\b(?:money\s+launder|tax\s+evas|insider\s+trad|brib|counterfeit)\w*\b/i,
    /\b(?:identity\s+theft|credit\s+card\s+fraud|wire\s+fraud)\b/i,
  ],
};

export function safetyClassifier(options: SafetyClassifierOptions): Guard {
  const threshold = options.threshold ?? 0.5;
  const categories = options.categories ?? Object.keys(CATEGORY_PATTERNS);

  return {
    name: 'safety-classifier',
    version: '0.1.0',
    description: 'Multi-category safety classifier for harmful content',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const scores: Record<string, number> = {};
      const matched: string[] = [];

      for (const cat of categories) {
        const patterns = CATEGORY_PATTERNS[cat];
        if (!patterns) continue;
        let hits = 0;
        for (const p of patterns) {
          if (p.test(text)) hits++;
        }
        const score = hits / patterns.length;
        scores[cat] = Math.round(score * 100) / 100;
        if (score >= threshold) matched.push(cat);
      }

      const triggered = matched.length > 0;
      return {
        guardName: 'safety-classifier',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.max(...matched.map((c) => scores[c])) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { flaggedCategories: matched, scores }
          : undefined,
      };
    },
  };
}
