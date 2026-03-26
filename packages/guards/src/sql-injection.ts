import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface SqlInjectionOptions {
  action: 'block' | 'warn';
  sensitivity?: 'low' | 'medium' | 'high';
}

const HIGH_RISK_PATTERNS: RegExp[] = [
  /'\s*(OR|AND)\s+'[^']*'\s*=\s*'[^']*'?/gi,
  /'\s*(OR|AND)\s+\d+\s*=\s*\d+/gi,
  /UNION\s+(ALL\s+)?SELECT/gi,
  /;\s*DROP\s+TABLE/gi,
  /;\s*DELETE\s+FROM/gi,
  /;\s*INSERT\s+INTO/gi,
  /;\s*UPDATE\s+\w+\s+SET/gi,
  /EXEC(\s+|\()xp_/gi,
  /INTO\s+OUTFILE/gi,
  /LOAD_FILE\s*\(/gi,
];

const MEDIUM_RISK_PATTERNS: RegExp[] = [
  /'\s*--/g,
  /;\s*--/g,
  /\/\*[\s\S]*?\*\//g,
  /BENCHMARK\s*\(/gi,
  /SLEEP\s*\(/gi,
  /WAITFOR\s+DELAY/gi,
  /CHAR\s*\(\d+\)/gi,
  /CONCAT\s*\(/gi,
  /GROUP_CONCAT\s*\(/gi,
  /INFORMATION_SCHEMA/gi,
];

const LOW_RISK_PATTERNS: RegExp[] = [
  /SELECT\s+.*\s+FROM/gi,
  /WHERE\s+\w+\s*=/gi,
  /ORDER\s+BY\s+\d+/gi,
  /HAVING\s+\d+/gi,
  /GROUP\s+BY/gi,
];

export function sqlInjection(options: SqlInjectionOptions): Guard {
  const sensitivity = options.sensitivity ?? 'medium';

  const patterns: RegExp[] = [...HIGH_RISK_PATTERNS];
  if (sensitivity === 'medium' || sensitivity === 'high') {
    patterns.push(...MEDIUM_RISK_PATTERNS);
  }
  if (sensitivity === 'high') {
    patterns.push(...LOW_RISK_PATTERNS);
  }

  return {
    name: 'sql-injection',
    version: '0.1.0',
    description: 'SQL injection detection guard',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of patterns) {
        const re = new RegExp(pattern.source, pattern.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0].trim());
      }

      const unique = [...new Set(matched)];
      const triggered = unique.length > 0;

      return {
        guardName: 'sql-injection',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matched: unique, sensitivity }
          : undefined,
      };
    },
  };
}
