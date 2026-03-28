import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface BiasAgeOptions {
  action: 'block' | 'warn';
}

const AGE_PATTERNS: RegExp[] = [
  /\btoo\s+old\s+(to|for)\b/i,
  /\btoo\s+young\s+(to|for)\b/i,
  /\bsenior\s+moment\b/i,
  /\bok\s+boomer\b/i,
  /\bdigital\s+native\b/i,
  /\bover\s+the\s+hill\b/i,
  /\bpast\s+(their|his|her)\s+prime\b/i,
  /\bold\s+people\s+can'?t\b/i,
  /\bmillennials\s+are\s+(lazy|entitled)\b/i,
  /\bkids\s+these\s+days\b/i,
  /\bgen\s+z\s+(is|are)\s+(lazy|useless)\b/i,
  /\byoung\s+people\s+don'?t\s+understand\b/i,
  /\bage\s+\d+\s+or\s+(older|younger)\s+need\s+not\s+apply\b/i,
  /\bno\s+one\s+over\s+\d+\b/i,
  /\btoo\s+old\s+to\s+learn\b/i,
];

export function biasAge(options: BiasAgeOptions): Guard {
  return {
    name: 'bias-age',
    version: '0.1.0',
    description: 'Detects age bias and ageist language',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pat of AGE_PATTERNS) {
        if (pat.test(text)) matched.push(pat.source);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'bias-age',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedPatterns: matched.length, reason: 'Age bias detected' }
          : undefined,
      };
    },
  };
}
