import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CitationCheckOptions {
  action: 'block' | 'warn';
  requireCitation?: boolean;
  maxUnsourced?: number;
}

const CITATION_PATTERNS: RegExp[] = [
  /\[\d+\]/g,
  /\[[\w\s]+,\s*\d{4}\]/g,
  /\([\w\s]+,\s*\d{4}\)/g,
  /according to\s+[\w\s]+/gi,
  /source:\s+/gi,
  /reference:\s+/gi,
  /cited from\s+/gi,
  /as stated (?:in|by)\s+/gi,
  /per\s+[\w\s]+\(\d{4}\)/gi,
];

const CLAIM_INDICATORS: RegExp[] = [
  /studies show/gi,
  /research indicates/gi,
  /data suggests/gi,
  /statistics show/gi,
  /experts say/gi,
  /it is (?:widely )?(?:known|believed|accepted)/gi,
  /\d+%\s+of/gi,
  /\d+\s+(?:million|billion|trillion)/gi,
];

export function citationCheck(options: CitationCheckOptions): Guard {
  const requireCitation = options.requireCitation ?? false;
  const maxUnsourced = options.maxUnsourced ?? 3;

  return {
    name: 'citation-check',
    version: '0.1.0',
    description: 'Check for citations and unsourced claims',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      let citationCount = 0;
      for (const pattern of CITATION_PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        const matches = text.match(re);
        if (matches) citationCount += matches.length;
      }

      let claimCount = 0;
      const unsourcedClaims: string[] = [];
      for (const pattern of CLAIM_INDICATORS) {
        const re = new RegExp(pattern.source, pattern.flags);
        const matches = text.match(re);
        if (matches) {
          claimCount += matches.length;
          unsourcedClaims.push(...matches);
        }
      }

      const unsourced = Math.max(0, claimCount - citationCount);
      let triggered = false;

      if (requireCitation && citationCount === 0 && claimCount > 0) {
        triggered = true;
      }
      if (unsourced > maxUnsourced) {
        triggered = true;
      }

      return {
        guardName: 'citation-check',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `${unsourced} unsourced claim(s) detected, ${citationCount} citation(s) found`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: {
          citationCount,
          claimCount,
          unsourcedClaims: unsourcedClaims.slice(0, 5),
          reason: triggered ? 'Response contains factual claims without proper citations' : undefined,
        },
      };
    },
  };
}
