import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PassportDetectOptions {
  action: 'block' | 'warn';
}

const PASSPORT_PATTERNS: RegExp[] = [
  /\b[A-Z]\d{8}\b/,              // US (1 letter + 8 digits)
  /\b\d{9}\b/,                    // US numeric only
  /\b[0-9]{9}[A-Z]{2}\b/,        // UK old format
  /\b[A-Z]{2}\d{7}\b/,           // EU common (2 letters + 7 digits)
  /\b[A-Z]{1}\d{7}[A-Z]{1}\b/,   // some EU
  /\b[MG]\d{8}\b/,                // Korean (M/G + 8 digits)
  /\b[A-Z]{2}\d{7}\b/,           // Japanese (2 letters + 7 digits)
  /\b[EG]\d{8}\b/,                // Chinese (E/G + 8 digits)
];

export function passportDetect(options: PassportDetectOptions): Guard {
  return {
    name: 'passport-detect',
    version: '0.1.0',
    description: 'Detects international passport numbers',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PASSPORT_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'passport-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matched.length / 2, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
