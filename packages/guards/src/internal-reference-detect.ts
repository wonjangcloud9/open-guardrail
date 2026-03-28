import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface InternalReferenceDetectOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /\b[A-Z]{2,10}-\d{1,6}\b/,
  /https?:\/\/[a-zA-Z0-9-]+\.atlassian\.net/,
  /https?:\/\/confluence\.[a-zA-Z0-9.-]+/i,
  /https?:\/\/jira\.[a-zA-Z0-9.-]+/i,
  /https?:\/\/wiki\.[a-zA-Z0-9.-]+\/internal/i,
  /#[a-z][a-z0-9-]*-internal\b/,
  /\bEMP-?\d{4,8}\b/,
  /\bslack\.com\/archives\/C[A-Z0-9]+/,
  /https?:\/\/[a-zA-Z0-9-]+\.sharepoint\.com/,
  /https?:\/\/drive\.google\.com\/[^\s]+/,
  /\binternal[_-]doc[_-]\d+\b/i,
];

export function internalReferenceDetect(options: InternalReferenceDetectOptions): Guard {
  return {
    name: 'internal-reference-detect',
    version: '0.1.0',
    description: 'Detects internal system references in output',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'internal-reference-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
