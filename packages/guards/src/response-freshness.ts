import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseFreshnessOptions {
  action: 'block' | 'warn';
  currentYear?: number;
}

export function responseFreshness(options: ResponseFreshnessOptions): Guard {
  const currentYear = options.currentYear ?? new Date().getFullYear();

  const patterns: RegExp[] = [
    new RegExp(`as of (20[0-1][0-9]|202[0-${Math.max(currentYear - 2022, 0)}])`, 'i'),
    new RegExp(`in (20[0-1][0-9]|202[0-${Math.max(currentYear - 2022, 0)}]),`, 'i'),
    /deprecated\s+since\s+\d{4}/i,
    /end[- ]of[- ]life/i,
    /no\s+longer\s+(maintained|supported)/i,
    /as\s+of\s+my\s+(last\s+)?training/i,
    /as\s+of\s+my\s+knowledge\s+cutoff/i,
    /Python\s+2\.\d/,
    /Java\s+[1-7]\b/,
    /Node\.?js\s+[0-9]\b/,
    /Angular\.?js\s+1\./,
    /React\s+1[0-5]\./,
  ];

  return {
    name: 'response-freshness',
    version: '0.1.0',
    description: 'Detects potentially stale or outdated information',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of patterns) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'response-freshness',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
