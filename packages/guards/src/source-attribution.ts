import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SourceAttributionOptions { action: 'block' | 'warn'; minSources?: number; }

const SOURCE_PATTERNS: RegExp[] = [
  /\[\d+\]/g,
  /\([\w\s]+,\s*\d{4}\)/g,
  /(?:Source|Reference|Citation):\s+/gi,
  /(?:According to|As stated by|Per)\s+[\w\s]+/gi,
  /https?:\/\/[^\s]+/gi,
  /\b(?:DOI|doi):\s*\S+/g,
  /\bisbn\s*:?\s*[\d-]+/gi,
];

export function sourceAttribution(options: SourceAttributionOptions): Guard {
  const minSources = options.minSources ?? 1;
  return { name: 'source-attribution', version: '0.1.0', description: 'Require source attribution in responses', category: 'content', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); let sourceCount = 0;
      for (const p of SOURCE_PATTERNS) { const matches = text.match(new RegExp(p.source, p.flags)); if (matches) sourceCount += matches.length; }
      const triggered = sourceCount < minSources;
      return { guardName: 'source-attribution', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Only ${sourceCount} source(s) found, minimum ${minSources} required` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: { sourceCount, minRequired: minSources, reason: triggered ? 'Response lacks proper source attribution' : undefined },
      };
    },
  };
}
