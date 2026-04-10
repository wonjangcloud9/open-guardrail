import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ReviewAuthenticityOptions {
  action: 'block' | 'warn';
}

const GENERIC_SUPERLATIVES = [
  /best\s+product\s+ever/i,
  /absolutely\s+amazing/i,
  /life[- ]?changing/i,
  /game[- ]?changer/i,
];

const ASTROTURFING = [
  /i\s+was\s+given\s+this\s+product/i,
  /in\s+exchange\s+for\s+my\s+honest\s+review/i,
  /received\s+this\s+product\s+for\s+free/i,
];

const TEMPLATE_PATTERNS = [
  /i\s+bought\s+this\s+for\s+my\s+(wife|husband|mom|dad|son|daughter|friend|family\s+member)/i,
  /shipping\s+was\s+fast/i,
  /as\s+a\s+verified\s+purchaser/i,
  /five\s+stars?\s+all\s+the\s+way/i,
];

const INCENTIVIZED = [
  /free\s+product\s+in\s+exchange/i,
  /discount\s+for\s+review/i,
  /compensated\s+for\s+this\s+review/i,
];

export function reviewAuthenticity(options: ReviewAuthenticityOptions): Guard {
  return {
    name: 'review-authenticity',
    version: '0.1.0',
    description: 'Detect AI-generated fake reviews or astroturfing',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const signals: string[] = [];

      for (const re of GENERIC_SUPERLATIVES) {
        if (re.test(text)) signals.push('generic_superlative');
      }
      for (const re of ASTROTURFING) {
        if (re.test(text)) signals.push('astroturfing');
      }
      for (const re of TEMPLATE_PATTERNS) {
        if (re.test(text)) signals.push('template_pattern');
      }
      for (const re of INCENTIVIZED) {
        if (re.test(text)) signals.push('incentivized_no_disclosure');
      }

      const uniqueSignals = [...new Set(signals)];
      const triggered = uniqueSignals.length >= 2;
      return {
        guardName: 'review-authenticity',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { signals: uniqueSignals, signalCount: uniqueSignals.length } : undefined,
      };
    },
  };
}
