import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CitationFormatOptions {
  action: 'block' | 'warn';
  format?: 'brackets' | 'footnote' | 'inline-url' | 'any';
  minCitations?: number;
}

const FORMAT_PATTERNS: Record<string, RegExp> = {
  brackets: /\[\d+\]/g,
  footnote: /\[\^?\d+\]/g,
  'inline-url': /\[.*?\]\(https?:\/\/.*?\)/g,
};

export function citationFormat(options: CitationFormatOptions): Guard {
  const fmt = options.format ?? 'any';
  const minCit = options.minCitations ?? 0;

  return {
    name: 'citation-format',
    version: '0.1.0',
    description: 'Validates citation format and minimum count in responses',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      let count = 0;
      if (fmt === 'any') {
        for (const pat of Object.values(FORMAT_PATTERNS)) { count += (text.match(pat) ?? []).length; }
      } else {
        const pat = FORMAT_PATTERNS[fmt];
        if (pat) count = (text.match(pat) ?? []).length;
      }
      const triggered = count < minCit;
      return { guardName: 'citation-format', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { citationCount: count, required: minCit, format: fmt } : undefined };
    },
  };
}
