import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface TemporalConsistencyOptions {
  action: 'block' | 'warn';
  currentYear?: number;
}

const FUTURE_CLAIMS = [
  /\bin\s+(\d{4})\b/gi,
  /\b(?:as\s+of|since|after)\s+(\d{4})\b/gi,
];

export function temporalConsistency(options: TemporalConsistencyOptions): Guard {
  const currentYear = options.currentYear ?? new Date().getFullYear();

  return {
    name: 'temporal-consistency',
    version: '0.1.0',
    description: 'Detects temporal inconsistencies and future date claims',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      for (const pat of FUTURE_CLAIMS) {
        pat.lastIndex = 0;
        let m;
        while ((m = pat.exec(text)) !== null) {
          const year = parseInt(m[1], 10);
          if (year > currentYear + 1 && year < 2100) issues.push(`Future year reference: ${year}`);
          if (year < 1900 && year > 100) issues.push(`Suspicious historical year: ${year}`);
        }
      }
      const triggered = issues.length > 0;
      return { guardName: 'temporal-consistency', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { issues } : undefined };
    },
  };
}
