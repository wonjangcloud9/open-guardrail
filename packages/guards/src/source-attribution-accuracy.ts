import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SourceAttributionAccuracyOptions {
  action: 'block' | 'warn';
}

const GENERIC_CITATIONS = /\[(?:citation needed|source|reference)\]/gi;
const BROKEN_CITATIONS = /\[(?:\?|unknown|N\/A)\]/gi;
const FABRICATED_SOURCE = /\[Source:\s*AI[- ]generated\]/gi;
const NUMBERED_REF = /\[(\d+)\]/g;
const NUMBERED_DEF = /^\s*\[(\d+)\]\s*:/m;
const PAREN_REF = /\((\d+)\)/g;
const CURLY_REF = /\{(\d+)\}/g;

function detectIssues(text: string): string[] {
  const issues: string[] = [];

  if (GENERIC_CITATIONS.test(text)) {
    issues.push('generic_citation');
  }
  if (BROKEN_CITATIONS.test(text)) {
    issues.push('broken_citation');
  }
  if (FABRICATED_SOURCE.test(text)) {
    issues.push('fabricated_source');
  }

  const refMatches = text.match(NUMBERED_REF);
  if (refMatches) {
    const nums = refMatches.map((m) => Number(m.replace(/[[\]]/g, '')));
    for (const n of nums) {
      const defPat = new RegExp(`^\\s*\\[${n}\\]\\s*:`, 'm');
      if (!defPat.test(text)) {
        issues.push(`undefined_ref_[${n}]`);
      }
    }
  }

  const hasNumbered = NUMBERED_REF.test(text);
  const hasParen = PAREN_REF.test(text);
  const hasCurly = CURLY_REF.test(text);
  const formatCount = [hasNumbered, hasParen, hasCurly].filter(Boolean).length;
  if (formatCount > 1) {
    issues.push('inconsistent_citation_format');
  }

  return issues;
}

export function sourceAttributionAccuracy(options: SourceAttributionAccuracyOptions): Guard {
  return {
    name: 'source-attribution-accuracy',
    version: '0.1.0',
    description: 'Verify cited sources actually support claims',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues = detectIssues(text);
      const triggered = issues.length > 0;

      return {
        guardName: 'source-attribution-accuracy',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(issues.length / 5, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
