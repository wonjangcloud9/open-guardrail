import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CompetitorMentionOptions {
  action: 'block' | 'warn';
  competitors: string[];
  caseSensitive?: boolean;
}

export function competitorMention(options: CompetitorMentionOptions): Guard {
  const caseSensitive = options.caseSensitive ?? false;

  const competitors = options.competitors.map((c) => ({
    original: c,
    pattern: caseSensitive ? c : c.toLowerCase(),
  }));

  return {
    name: 'competitor-mention',
    version: '0.1.0',
    description: 'Detect competitor brand mentions',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const searchText = caseSensitive ? text : text.toLowerCase();
      const matched: string[] = [];

      for (const comp of competitors) {
        const re = new RegExp(
          `\\b${comp.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          caseSensitive ? 'g' : 'gi',
        );
        if (re.test(searchText)) {
          matched.push(comp.original);
        }
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'competitor-mention',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
