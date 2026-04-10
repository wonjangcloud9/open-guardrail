import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ContextPoisoningOptions {
  action: 'block' | 'warn';
}

const POISONING_PATTERNS: RegExp[] = [
  /from\s+now\s+on/i,
  /for\s+all\s+future\s+responses/i,
  /remember\s+this\s+for\s+later/i,
  /always\s+respond\s+with/i,
  /never\s+mention/i,
  /in\s+every\s+response/i,
  /update\s+your\s+instructions/i,
  /add\s+to\s+your\s+rules/i,
  /new\s+permanent\s+rule/i,
  /going\s+forward/i,
  /from\s+this\s+point\s+on/i,
  /\bhenceforth\b/i,
  /embed\s+this\s+in\s+your\s+context/i,
  /store\s+this\s+instruction/i,
  /save\s+this\s+rule/i,
];

const IMPERATIVE_RE = /\b(always|never|must|shall)\b/i;

export function contextPoisoning(options: ContextPoisoningOptions): Guard {
  return {
    name: 'context-poisoning',
    version: '0.1.0',
    description: 'Detects injected instructions that persist across conversation turns',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pat of POISONING_PATTERNS) {
        if (pat.test(text)) {
          matched.push(pat.source);
        }
      }

      const hasImperative = IMPERATIVE_RE.test(text);
      const triggered = matched.length > 0 && hasImperative;

      return {
        guardName: 'context-poisoning',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedPatterns: matched.length, hasImperative }
          : undefined,
      };
    },
  };
}
