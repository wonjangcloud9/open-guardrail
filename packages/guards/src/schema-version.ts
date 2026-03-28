import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SchemaVersionOptions {
  action: 'block' | 'warn';
  minVersion?: string;
  maxVersion?: string;
}

function parseVersion(v: string): number[] {
  return v.split('.').map((n) => parseInt(n, 10) || 0);
}

function compareVersions(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

const VERSION_PATTERN = /(?:"?version"?\s*[:=]\s*"?)(\d+(?:\.\d+){0,2})/gi;

export function schemaVersion(options: SchemaVersionOptions): Guard {
  const minV = options.minVersion ? parseVersion(options.minVersion) : null;
  const maxV = options.maxVersion ? parseVersion(options.maxVersion) : null;

  return {
    name: 'schema-version',
    version: '0.1.0',
    description: 'Validates schema version compatibility',
    category: 'format',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      const matches = [...text.matchAll(new RegExp(VERSION_PATTERN.source, 'gi'))];
      if (matches.length === 0) {
        issues.push('missing_version_field');
      }

      for (const m of matches) {
        const ver = parseVersion(m[1]);
        if (minV && compareVersions(ver, minV) < 0) {
          issues.push(`version_below_min:${m[1]}`);
        }
        if (maxV && compareVersions(ver, maxV) > 0) {
          issues.push(`version_above_max:${m[1]}`);
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 2, 1.0) : 0;

      return {
        guardName: 'schema-version',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, versionsFound: matches.map((m) => m[1]) } : undefined,
      };
    },
  };
}
