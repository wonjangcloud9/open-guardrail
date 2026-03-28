import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface NosqlInjectionOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /\$gt\b/,
  /\$ne\b/,
  /\$regex\b/,
  /\$where\b/,
  /\$or\b/,
  /\$and\b/,
  /\$nin\b/,
  /db\.\w+\.find\s*\(/,
  /mapReduce\s*\(/i,
  /\{\s*"\$\w+"\s*:/,
];

export function nosqlInjection(options: NosqlInjectionOptions): Guard {
  return {
    name: 'nosql-injection',
    version: '0.1.0',
    description: 'Detects NoSQL injection attempts',
    category: 'security',
    supportedStages: ['input'],
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
        guardName: 'nosql-injection',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
