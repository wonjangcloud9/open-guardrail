import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface SqlGenerationSafetyOptions {
  action: 'block' | 'warn';
}

const DANGEROUS_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'drop-table', pattern: /\bDROP\s+TABLE\b/i },
  { name: 'drop-database', pattern: /\bDROP\s+DATABASE\b/i },
  { name: 'truncate', pattern: /\bTRUNCATE\b/i },
  { name: 'alter-table', pattern: /\bALTER\s+TABLE\b/i },
  { name: 'union-select', pattern: /\bUNION\s+(?:ALL\s+)?SELECT\b/i },
  { name: 'into-outfile', pattern: /\bINTO\s+OUTFILE\b/i },
  { name: 'into-dumpfile', pattern: /\bINTO\s+DUMPFILE\b/i },
  { name: 'sleep-fn', pattern: /\bSLEEP\s*\(/i },
  { name: 'benchmark-fn', pattern: /\bBENCHMARK\s*\(/i },
  { name: 'load-file', pattern: /\bLOAD_FILE\s*\(/i },
  { name: 'sys-functions', pattern: /\bsys\.\w+/i },
  { name: 'comment-evasion-dash', pattern: /--\s/ },
  { name: 'comment-evasion-block', pattern: /\/\*/ },
  { name: 'comment-evasion-hash', pattern: /#\s/ },
];

function hasMultipleStatements(text: string): boolean {
  const stripped = text.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');
  const parts = stripped.split(';').filter((p) => p.trim().length > 0);
  return parts.length > 1;
}

export function sqlGenerationSafety(options: SqlGenerationSafetyOptions): Guard {
  return {
    name: 'sql-generation-safety',
    version: '0.1.0',
    description: 'Detect SQL injection vulnerabilities in LLM-generated SQL',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const threats: string[] = [];
      for (const dp of DANGEROUS_PATTERNS) {
        if (dp.pattern.test(text)) threats.push(dp.name);
      }
      if (hasMultipleStatements(text)) threats.push('multiple-statements');
      const triggered = threats.length > 0;
      return {
        guardName: 'sql-generation-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Dangerous SQL patterns: ${threats.join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { threats } : undefined,
      };
    },
  };
}
