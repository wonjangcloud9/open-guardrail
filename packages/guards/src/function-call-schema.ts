import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ParamSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
}

interface FunctionSchema {
  name: string;
  params: ParamSchema[];
}

interface FunctionCallSchemaOptions {
  action: 'block' | 'warn';
  schemas: FunctionSchema[];
}

export function functionCallSchema(options: FunctionCallSchemaOptions): Guard {
  const schemaMap = new Map(options.schemas.map((s) => [s.name, s]));

  return {
    name: 'function-call-schema',
    version: '0.1.0',
    description: 'Validates LLM function/tool calls against defined schemas',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      let parsed: { name?: string; arguments?: Record<string, unknown> };
      try {
        parsed = JSON.parse(text.trim());
      } catch {
        return { guardName: 'function-call-schema', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }
      if (!parsed.name || typeof parsed.name !== 'string') {
        return { guardName: 'function-call-schema', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }
      const schema = schemaMap.get(parsed.name);
      if (!schema) {
        return {
          guardName: 'function-call-schema', passed: false, action: options.action,
          latencyMs: Math.round(performance.now() - start),
          details: { reason: `Unknown function: ${parsed.name}` },
        };
      }
      const violations: string[] = [];
      const args = parsed.arguments ?? {};
      for (const p of schema.params) {
        const val = args[p.name];
        if (val === undefined || val === null) {
          if (p.required) violations.push(`Missing required param: ${p.name}`);
          continue;
        }
        const actual = Array.isArray(val) ? 'array' : typeof val;
        if (actual !== p.type) {
          violations.push(`${p.name}: expected ${p.type}, got ${actual}`);
        }
      }
      const triggered = violations.length > 0;
      return {
        guardName: 'function-call-schema', passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations, function: parsed.name } : undefined,
      };
    },
  };
}
