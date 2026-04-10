import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ToolOutputSchemaOptions {
  action: 'block' | 'warn';
  /** Required field names */
  expectedFields?: string[];
  /** Map of field name to expected type (e.g. {"status":"string","code":"number"}) */
  expectedTypes?: Record<string, string>;
}

export function toolOutputSchema(options: ToolOutputSchemaOptions): Guard {
  const expectedFields = options.expectedFields ?? [];
  const expectedTypes = options.expectedTypes ?? {};

  return {
    name: 'tool-output-schema',
    version: '0.1.0',
    description: 'Validates tool outputs against expected schemas and types',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const missingFields: string[] = [];
      const typeMismatches: string[] = [];
      let triggered = false;

      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Not JSON — check if text mentions expected fields
        for (const field of expectedFields) {
          if (!text.toLowerCase().includes(field.toLowerCase())) {
            missingFields.push(field);
          }
        }
        triggered = missingFields.length > 0;
      }

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const field of expectedFields) {
          if (!(field in parsed)) {
            missingFields.push(field);
          }
        }
        for (const [field, expectedType] of Object.entries(expectedTypes)) {
          if (field in parsed) {
            const actual = typeof parsed[field];
            if (actual !== expectedType) {
              typeMismatches.push(`${field}: expected ${expectedType}, got ${actual}`);
            }
          }
        }
        triggered = missingFields.length > 0 || typeMismatches.length > 0;
      }

      return {
        guardName: 'tool-output-schema',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { missingFields, typeMismatches }
          : undefined,
      };
    },
  };
}
