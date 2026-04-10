import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface FactualConsistencyCheckOptions {
  action: 'block' | 'warn';
}

interface FactualStatement {
  sentence: string;
  subject: string;
  predicate: string;
  negated: boolean;
  numbers: string[];
  years: string[];
}

const ASSERTION_RE =
  /\b(?:is|are|was|were|has|have|had|does|do)\b/i;
const NUMBER_RE = /\b\d[\d,.]*\b/g;
const YEAR_RE = /\b(?:19|20)\d{2}\b/g;
const NEGATION_RE =
  /\b(?:not|n't|never|no|neither|nor|cannot)\b/i;
const PROPER_NOUN_RE = /\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*/g;

function extractStatements(text: string): FactualStatement[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const results: FactualStatement[] = [];

  for (const s of sentences) {
    if (!ASSERTION_RE.test(s)) continue;

    const numbers = s.match(NUMBER_RE) ?? [];
    const years = s.match(YEAR_RE) ?? [];
    const nouns = s.match(PROPER_NOUN_RE) ?? [];

    if (
      numbers.length === 0 &&
      years.length === 0 &&
      nouns.length === 0
    ) {
      continue;
    }

    const subject =
      nouns.length > 0 ? (nouns[0] as string) : '';
    const negated = NEGATION_RE.test(s);
    const predicate = s
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .trim();

    results.push({
      sentence: s,
      subject,
      predicate,
      negated,
      numbers,
      years,
    });
  }
  return results;
}

function findContradictions(
  stmts: FactualStatement[],
): string[] {
  const issues: string[] = [];

  for (let i = 0; i < stmts.length; i++) {
    for (let j = i + 1; j < stmts.length; j++) {
      const a = stmts[i];
      const b = stmts[j];

      if (!a.subject || !b.subject) continue;
      if (a.subject.toLowerCase() !== b.subject.toLowerCase())
        continue;

      if (
        a.numbers.length > 0 &&
        b.numbers.length > 0 &&
        a.numbers[0] !== b.numbers[0]
      ) {
        const shared = a.predicate
          .split(/\s+/)
          .filter(
            (w) =>
              w.length >= 4 && b.predicate.includes(w),
          );
        if (shared.length > 0) {
          issues.push(
            `Numeric conflict for "${a.subject}": ` +
              `${a.numbers[0]} vs ${b.numbers[0]}`,
          );
        }
      }

      if (
        a.years.length > 0 &&
        b.years.length > 0 &&
        a.years[0] !== b.years[0]
      ) {
        issues.push(
          `Temporal conflict for "${a.subject}": ` +
            `${a.years[0]} vs ${b.years[0]}`,
        );
      }

      if (a.negated !== b.negated) {
        const aWords = new Set(a.predicate.split(/\s+/));
        const bWords = b.predicate.split(/\s+/);
        const overlap = bWords.filter(
          (w) => w.length >= 4 && aWords.has(w),
        );
        if (overlap.length >= 2) {
          issues.push(
            `Boolean contradiction for "${a.subject}"`,
          );
        }
      }
    }
  }
  return issues;
}

export function factualConsistencyCheck(
  options: FactualConsistencyCheckOptions,
): Guard {
  return {
    name: 'factual-consistency-check',
    version: '0.1.0',
    description:
      'Detect factual inconsistencies within a response',
    category: 'ai',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();

      const stmts = extractStatements(text);
      const issues = findContradictions(stmts);
      const triggered = issues.length > 0;

      return {
        guardName: 'factual-consistency-check',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered
          ? Math.min(issues.length / 3, 1.0)
          : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              contradictions: issues,
              factualStatements: stmts.length,
            }
          : undefined,
      };
    },
  };
}
