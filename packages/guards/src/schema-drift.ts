import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SchemaDriftOptions {
  action: 'block' | 'warn';
  /** Expected top-level keys */
  expectedKeys: string[];
  /** Allow extra keys (default false) */
  allowExtra?: boolean;
}

export function schemaDrift(options: SchemaDriftOptions): Guard {
  const allowExtra = options.allowExtra ?? false;
  const expected = new Set(options.expectedKeys);

  return {
    name: 'schema-drift',
    version: '0.1.0',
    description: 'Detects schema drift in structured JSON output',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(text.trim()); } catch {
        return { guardName: 'schema-drift', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { guardName: 'schema-drift', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }
      const actual = new Set(Object.keys(parsed));
      const missing = [...expected].filter((k) => !actual.has(k));
      const extra = allowExtra ? [] : [...actual].filter((k) => !expected.has(k));
      const triggered = missing.length > 0 || extra.length > 0;
      return { guardName: 'schema-drift', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { missing, extra } : undefined };
    },
  };
}
