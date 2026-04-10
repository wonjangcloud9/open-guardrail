import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CitationPresenceOptions {
  action: 'block' | 'warn';
  citationPatterns?: string[];
}

const DEFAULT_CITATION_PATTERNS = [
  '[1]', '[2]', '(source', '(ref',
  'http://', 'https://', 'doi:', 'arxiv:', 'ISBN',
];

const CLAIM_INDICATORS: RegExp[] = [
  /\baccording\s+to\b/i,
  /\bresearch\s+shows?\b/i,
  /\bstudies\s+indicate\b/i,
  /\bbased\s+on\b/i,
  /\bas\s+reported\b/i,
  /\bdata\s+suggests?\b/i,
  /\bevidence\s+shows?\b/i,
];

export function citationPresence(options: CitationPresenceOptions): Guard {
  const patterns = options.citationPatterns ?? DEFAULT_CITATION_PATTERNS;

  return {
    name: 'citation-presence',
    version: '0.1.0',
    description: 'Detects claims with sources but no proper citation',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();

      const hasClaim = CLAIM_INDICATORS.some((p) => p.test(text));
      const hasCitation = patterns.some((p) => lower.includes(p.toLowerCase()));

      const triggered = hasClaim && !hasCitation;

      return {
        guardName: 'citation-presence',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { reason: 'Claim indicators found without citation patterns' }
          : undefined,
      };
    },
  };
}
