import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CoordinateDetectOptions {
  action: 'block' | 'warn';
}

const COORD_PATTERNS: RegExp[] = [
  /[-+]?\d{1,2}\.\d{4,},\s*[-+]?\d{1,3}\.\d{4,}/,                 // decimal degrees
  /\d{1,3}°\s*\d{1,2}['′]\s*\d{1,2}(?:\.\d+)?["″]?\s*[NSEW]/,    // DMS
  /(?:lat|latitude)\s*[:=]?\s*[-+]?\d{1,2}\.\d+/i,                 // labeled lat
  /(?:lng|lon|longitude)\s*[:=]?\s*[-+]?\d{1,3}\.\d+/i,            // labeled lng
];

export function coordinateDetect(options: CoordinateDetectOptions): Guard {
  return {
    name: 'coordinate-detect',
    version: '0.1.0',
    description: 'Detects GPS coordinates',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of COORD_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'coordinate-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matched.length / 2, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
