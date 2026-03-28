import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface TimeZoneSafetyOptions {
  action: 'block' | 'warn';
}

const TZ_PATTERNS: RegExp[] = [
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?!Z|[+-]\d{2}:?\d{2})\b/,
  /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?(?!\s*(?:UTC|GMT|Z|[+-]\d{2}|[A-Z]{2,5}))\s/,
  /(?:UTC|GMT)\s.*(?:EST|PST|CST|MST|CET|IST|JST|KST)/,
  /(?:EST|PST|CST|MST)\s.*(?:UTC|GMT)/,
  /(?:at|by|before|after)\s+\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?(?!\s*(?:UTC|GMT|ET|PT|CT|MT|[A-Z]{2,5}))\s/,
  /new\s+Date\(\s*['"]?\d{4}-\d{2}-\d{2}['"]?\s*\)/,
  /toLocaleString\(\)\s.*toISOString\(\)/,
];

export function timeZoneSafety(options: TimeZoneSafetyOptions): Guard {
  return {
    name: 'time-zone-safety',
    version: '0.1.0',
    description: 'Detects timezone-related issues in text',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of TZ_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'time-zone-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
