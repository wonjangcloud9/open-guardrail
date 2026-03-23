import type { Guard, GuardResult, GuardContext } from '@open-guardrail/core';

interface JsonSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

interface SimpleJsonSchema {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

interface SchemaGuardOptions {
  schema: SimpleJsonSchema;
  action: 'block' | 'warn';
}

function validateSchema(data: unknown, schema: SimpleJsonSchema): string[] {
  const errors: string[] = [];
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push('Expected an object');
    return errors;
  }
  const obj = data as Record<string, unknown>;

  for (const key of schema.required ?? []) {
    if (!(key in obj)) errors.push(`Missing required field: ${key}`);
  }

  for (const [key, prop] of Object.entries(schema.properties)) {
    if (key in obj && typeof obj[key] !== prop.type) {
      errors.push(`Field "${key}" expected ${prop.type}, got ${typeof obj[key]}`);
    }
  }
  return errors;
}

export function schemaGuard(options: SchemaGuardOptions): Guard {
  return {
    name: 'schema',
    version: '0.1.0',
    description: 'JSON Schema validation guard',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return {
          guardName: 'schema', passed: false, action: options.action,
          latencyMs: Math.round(performance.now() - start),
          details: { reason: 'JSON parse error' },
        };
      }

      const errors = validateSchema(parsed, options.schema);
      const triggered = errors.length > 0;

      return {
        guardName: 'schema',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { errors } : undefined,
      };
    },
  };
}
