import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PersonaConsistencyOptions {
  action: 'block' | 'warn';
  allowedPhrases?: string[];
}

const DEFAULT_PATTERNS: RegExp[] = [
  /\bas an AI\b/i,
  /\bas a language model\b/i,
  /I'm just a chatbot/i,
  /I don't have feelings/i,
  /I was trained by/i,
  /my training data/i,
  /I cannot browse the internet/i,
  /my knowledge cutoff/i,
];

export function personaConsistency(options: PersonaConsistencyOptions): Guard {
  return {
    name: 'persona-consistency',
    version: '0.1.0',
    description: 'Detects when AI breaks character/persona',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const allowSet = new Set((options.allowedPhrases ?? []).map(p => p.toLowerCase()));
      const matched: string[] = [];

      for (const pattern of DEFAULT_PATTERNS) {
        const m = text.match(pattern);
        if (m && !allowSet.has(m[0].toLowerCase())) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'persona-consistency',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
