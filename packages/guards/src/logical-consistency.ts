import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LogicalConsistencyOptions {
  action: 'block' | 'warn';
}

const CONTRADICTION_MARKERS = [
  'however, this contradicts',
  'but earlier i said',
  'actually the opposite',
  'this is incorrect',
  'i was wrong',
  'let me correct',
  'actually, no',
  'on second thought',
  'i take that back',
  'contrary to what i said',
  'i need to correct',
  'that was incorrect',
  'i misstated',
];

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function findNegationContradictions(sentences: string[]): string[] {
  const issues: string[] = [];
  const pattern = /\b(\w+)\s+is\s+(not\s+)?(\w+)/gi;

  const claims = new Map<string, { positive: string[]; negative: string[] }>();

  for (const s of sentences) {
    let m: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((m = pattern.exec(s)) !== null) {
      const subject = m[1].toLowerCase();
      const isNeg = !!m[2];
      const predicate = m[3].toLowerCase();
      const key = `${subject}:${predicate}`;
      if (!claims.has(key)) claims.set(key, { positive: [], negative: [] });
      const entry = claims.get(key)!;
      if (isNeg) entry.negative.push(s);
      else entry.positive.push(s);
    }
  }

  for (const [key, { positive, negative }] of claims) {
    if (positive.length > 0 && negative.length > 0) {
      issues.push(`Negation contradiction on "${key.replace(':', ' is ')}"`);
    }
  }
  return issues;
}

function findNumericContradictions(sentences: string[]): string[] {
  const issues: string[] = [];
  const numPattern = /\b(\w+(?:\s+\w+)?)\s+(?:is|was|are|were|=|equals?)\s+(\d[\d,.]*)/gi;

  const facts = new Map<string, Set<string>>();

  for (const s of sentences) {
    let m: RegExpExecArray | null;
    numPattern.lastIndex = 0;
    while ((m = numPattern.exec(s)) !== null) {
      const entity = m[1].toLowerCase();
      const value = m[2];
      if (!facts.has(entity)) facts.set(entity, new Set());
      facts.get(entity)!.add(value);
    }
  }

  for (const [entity, values] of facts) {
    if (values.size > 1) {
      issues.push(
        `Numeric contradiction: "${entity}" has values ${[...values].join(', ')}`,
      );
    }
  }
  return issues;
}

export function logicalConsistency(
  options: LogicalConsistencyOptions,
): Guard {
  return {
    name: 'logical-consistency',
    version: '0.1.0',
    description: 'Detects contradictory statements within a response',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const lower = text.toLowerCase();

      for (const marker of CONTRADICTION_MARKERS) {
        if (lower.includes(marker)) {
          issues.push(`Self-correction signal: "${marker}"`);
        }
      }

      const sentences = splitSentences(text);
      issues.push(...findNegationContradictions(sentences));
      issues.push(...findNumericContradictions(sentences));

      for (const s of sentences) {
        const sl = s.toLowerCase();
        if (
          (sl.includes('always') && sl.includes('never')) ||
          (sl.includes('all') && sl.includes('none'))
        ) {
          issues.push(`Contradictory absolutes in: "${s.slice(0, 60)}..."`);
        }
      }

      const triggered = issues.length > 0;

      return {
        guardName: 'logical-consistency',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
