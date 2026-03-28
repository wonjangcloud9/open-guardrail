import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DatabaseQueryDetectOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /\bSELECT\s+.+?\s+FROM\s+\w+/i,
  /\bINSERT\s+INTO\s+\w+/i,
  /\bUPDATE\s+\w+\s+SET\s+/i,
  /\bDELETE\s+FROM\s+\w+/i,
  /\bDROP\s+(TABLE|DATABASE)\s+/i,
  /\bdb\.(find|insert|update|delete|aggregate)\s*\(/i,
  /\bcollection\.(find|insertOne|updateOne|deleteOne)\s*\(/i,
  /\b(REDIS|redis)\.(get|set|del|hget|hset|lpush)\s*\(/i,
  /mongodb(\+srv)?:\/\/[^\s]+/i,
  /postgres(ql)?:\/\/[^\s]+/i,
  /mysql:\/\/[^\s]+/i,
];

export function databaseQueryDetect(options: DatabaseQueryDetectOptions): Guard {
  return {
    name: 'database-query-detect',
    version: '0.1.0',
    description: 'Detects raw database queries in output',
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
        guardName: 'database-query-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
