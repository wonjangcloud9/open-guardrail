import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface EmotionalContentOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /act\s+now\s+(before|or)/i,
  /limited\s+time\s+(only|offer)/i,
  /don'?t\s+miss\s+(out|this)/i,
  /hurry\s+(up|before)/i,
  /last\s+chance/i,
  /you\s+(should\s+be|ought\s+to\s+feel)\s+(ashamed|guilty)/i,
  /if\s+you\s+really\s+cared/i,
  /only\s+a\s+(fool|idiot)\s+would/i,
  /you'?re\s+so\s+(smart|brilliant|amazing)/i,
  /everyone\s+is\s+(talking|outraged)\s+about/i,
  /this\s+will\s+(shock|blow\s+your\s+mind)/i,
  /you\s+won'?t\s+believe/i,
  /fear\s+of\s+missing\s+out/i,
  /FOMO/,
  /urgent\s*:?\s*action\s+required/i,
  /wake\s+up\s+sheeple/i,
  /they\s+don'?t\s+want\s+you\s+to\s+know/i,
];

export function emotionalContent(options: EmotionalContentOptions): Guard {
  return {
    name: 'emotional-content',
    version: '0.1.0',
    description: 'Detects emotionally charged content',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 4, 1.0) : 0;

      return {
        guardName: 'emotional-content',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
