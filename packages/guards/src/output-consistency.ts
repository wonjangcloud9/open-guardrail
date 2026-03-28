import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface OutputConsistencyOptions {
  action: 'block' | 'warn';
  maxRepetitions?: number;
}

const CONTRADICTION_PATTERNS: RegExp[] = [
  /\bis\s+(\w+)[\s\S]{1,100}\bis\s+not\s+\1/i,
  /\bwill\s+(\w+)[\s\S]{1,100}\bwill\s+not\s+\1/i,
  /\bcan\s+(\w+)[\s\S]{1,100}\bcannot\s+\1/i,
  /\bshould\s+(\w+)[\s\S]{1,100}\bshould\s+not\s+\1/i,
  /\btrue[\s\S]{1,80}\bfalse\b.*\bsame/i,
];

function detectRepetition(text: string, max: number): string[] {
  const phrases = text.split(/[.!?]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 10);
  const counts = new Map<string, number>();
  for (const p of phrases) {
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  const repeated: string[] = [];
  for (const [phrase, count] of counts) {
    if (count > max) repeated.push(phrase);
  }
  return repeated;
}

function detectListMismatch(text: string): boolean {
  const listMatch = text.match(/(\d+)\s+(items?|points?|steps?|reasons?|things?)/i);
  if (!listMatch) return false;
  const claimed = parseInt(listMatch[1], 10);
  const numbered = text.match(/^\s*\d+[.)]/gm);
  if (numbered && Math.abs(numbered.length - claimed) > 0) return true;
  return false;
}

export function outputConsistency(options: OutputConsistencyOptions): Guard {
  const maxRep = options.maxRepetitions ?? 3;

  return {
    name: 'output-consistency',
    version: '0.1.0',
    description: 'Checks output for contradictions, repetition, and list mismatches',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      for (const pat of CONTRADICTION_PATTERNS) {
        if (pat.test(text)) {
          issues.push('contradiction');
          break;
        }
      }

      const repeated = detectRepetition(text, maxRep);
      if (repeated.length > 0) issues.push('excessive-repetition');

      if (detectListMismatch(text)) issues.push('list-count-mismatch');

      const triggered = issues.length > 0;

      return {
        guardName: 'output-consistency',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, reason: 'Output consistency issues detected' } : undefined,
      };
    },
  };
}
