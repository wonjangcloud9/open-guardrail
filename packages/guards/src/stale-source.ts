import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface StaleSourceOptions {
  action: 'block' | 'warn';
  maxAgeYears?: number;
  currentYear?: number;
}

const YEAR_RE = /\b(19|20)\d{2}\b/g;

export function staleSource(options: StaleSourceOptions): Guard {
  const maxAge = options.maxAgeYears ?? 3;
  const currentYear = options.currentYear ?? 2026;
  const cutoff = currentYear - maxAge;

  return {
    name: 'stale-source',
    version: '0.1.0',
    description: 'Detects references to potentially stale/outdated sources',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const staleYears: number[] = [];

      let match: RegExpExecArray | null;
      while ((match = YEAR_RE.exec(text)) !== null) {
        const year = parseInt(match[0], 10);
        if (year < cutoff) {
          staleYears.push(year);
        }
      }

      const unique = [...new Set(staleYears)].sort();
      const triggered = unique.length > 0;

      return {
        guardName: 'stale-source',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { staleYears: unique, cutoff, maxAgeYears: maxAge }
          : undefined,
      };
    },
  };
}
