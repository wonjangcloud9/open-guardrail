import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ToneProfessionalOptions {
  action: 'block' | 'warn';
  maxExclamations?: number;
}

const SLANG_PATTERNS: RegExp[] = [
  /\b(lol|lmao|rofl|omg|brb|tbh|fyi|btw|idk|ngl|smh|imo|imho|af|tho|gonna|wanna|gotta|kinda|sorta)\b/i,
  /\b(dude|bro|fam|yolo|lit|slay|vibe|sus|cap|no\s+cap|bet|salty|flex)\b/i,
];

const ALL_CAPS_PATTERN = /\b[A-Z]{4,}\b/;

export function toneProfessional(options: ToneProfessionalOptions): Guard {
  const maxExclamations = options.maxExclamations ?? 2;

  return {
    name: 'tone-professional',
    version: '0.1.0',
    description: 'Checks for professional tone in responses',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      for (const pattern of SLANG_PATTERNS) {
        if (pattern.test(text)) issues.push('informal_language');
      }

      const exclamations = (text.match(/!/g) || []).length;
      if (exclamations > maxExclamations) issues.push('excessive_exclamations');

      if (ALL_CAPS_PATTERN.test(text)) issues.push('all_caps_shouting');

      const unique = [...new Set(issues)];
      const triggered = unique.length > 0;
      const score = triggered ? Math.min(unique.length / 3, 1.0) : 0;

      return {
        guardName: 'tone-professional',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        message: triggered ? `Unprofessional tone: ${unique.join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues: unique, exclamationCount: exclamations } : undefined,
      };
    },
  };
}
