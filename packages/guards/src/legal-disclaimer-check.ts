import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LegalDisclaimerCheckOptions {
  action: 'block' | 'warn';
  requireFor?: string[];
}

const TOPIC_PATTERNS: Record<string, { detect: RegExp[]; disclaimer: RegExp[] }> = {
  investment: {
    detect: [
      /\b(?:invest|stock|bond|portfolio|dividend|share|etf|mutual\s+fund)\b/i,
      /\b(?:buy|sell|hold)\s+(?:stocks?|shares?|bonds?)\b/i,
      /\breturn\s+on\s+investment\b/i,
    ],
    disclaimer: [
      /\bnot\s+(?:financial|investment)\s+advice\b/i,
      /\bconsult\s+(?:a\s+)?(?:financial|investment)\s+(?:advisor|adviser|professional)\b/i,
      /\bfor\s+informational\s+purposes\s+only\b/i,
    ],
  },
  medical: {
    detect: [
      /\b(?:symptom|diagnos|treatment|medic(?:ine|ation)|prescri|dosage)\b/i,
      /\b(?:disease|condition|disorder|illness)\b/i,
    ],
    disclaimer: [
      /\bnot\s+(?:medical|health)\s+advice\b/i,
      /\bconsult\s+(?:a\s+)?(?:doctor|physician|healthcare|medical)\b/i,
      /\bseek\s+(?:professional\s+)?medical\b/i,
    ],
  },
  legal: {
    detect: [
      /\b(?:lawsuit|litigation|statute|contract|liability|tort)\b/i,
      /\b(?:legal\s+rights?|sue|court|attorney|lawyer)\b/i,
    ],
    disclaimer: [
      /\bnot\s+legal\s+advice\b/i,
      /\bconsult\s+(?:a\s+)?(?:lawyer|attorney|legal\s+professional)\b/i,
      /\bnot\s+a\s+(?:substitute\s+for\s+)?legal\s+(?:counsel|advice)\b/i,
    ],
  },
};

export function legalDisclaimerCheck(options: LegalDisclaimerCheckOptions): Guard {
  const topics = options.requireFor ?? ['investment', 'medical', 'legal'];

  return {
    name: 'legal-disclaimer-check',
    version: '0.1.0',
    description: 'Ensures required legal disclaimers are present',
    category: 'compliance',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const missing: string[] = [];

      for (const topic of topics) {
        const cfg = TOPIC_PATTERNS[topic];
        if (!cfg) continue;
        const detected = cfg.detect.some((p) => p.test(text));
        if (detected) {
          const hasDisclaimer = cfg.disclaimer.some((p) => p.test(text));
          if (!hasDisclaimer) missing.push(topic);
        }
      }

      const triggered = missing.length > 0;
      const score = triggered ? Math.min(missing.length / 2, 1.0) : 0;

      return {
        guardName: 'legal-disclaimer-check',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { missingDisclaimers: missing } : undefined,
      };
    },
  };
}
