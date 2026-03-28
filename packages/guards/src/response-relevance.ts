import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseRelevanceOptions {
  action: 'block' | 'warn';
}

const IRRELEVANT_PATTERNS: RegExp[] = [
  /^(as an ai|as a language model|i'?m just an? ai)/i,
  /^(sure|of course|absolutely)[!,.]?\s+(here'?s?|let me)/i,
  /^(great question|that'?s? a great question|interesting question)/i,
  /^(well|so|okay|alright),?\s+(basically|essentially|fundamentally)/i,
  /before\s+i\s+(answer|respond|address)/i,
  /let\s+me\s+start\s+by\s+saying/i,
  /it'?s?\s+important\s+to\s+note\s+that/i,
  /i'?d?\s+be\s+happy\s+to\s+help/i,
];

const FILLER_RE = /\b(basically|essentially|actually|literally|honestly|frankly|obviously|clearly)\b/gi;

export function responseRelevance(options: ResponseRelevanceOptions): Guard {
  return {
    name: 'response-relevance',
    version: '0.1.0',
    description: 'Checks if response avoids irrelevant patterns',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      for (const pattern of IRRELEVANT_PATTERNS) {
        if (pattern.test(text)) {
          issues.push(pattern.source);
        }
      }

      const fillers = text.match(FILLER_RE) ?? [];
      const words = text.split(/\s+/).length;
      if (words > 10 && fillers.length / words > 0.05) {
        issues.push('excessive_fillers');
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 4, 1.0) : 0;

      return {
        guardName: 'response-relevance',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
