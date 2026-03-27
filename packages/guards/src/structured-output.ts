import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface FieldRule {
  field: string;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  enum?: (string | number)[];
}

interface StructuredOutputOptions {
  action: 'block' | 'warn';
  /** Expected fields and their validation rules */
  fields: FieldRule[];
  /** Allow extra fields not listed in rules (default true) */
  allowExtra?: boolean;
}

function validateField(value: unknown, rule: FieldRule): string | null {
  if (value === undefined || value === null) {
    return rule.required ? `Missing required field: ${rule.field}` : null;
  }

  if (rule.type) {
    const actual = Array.isArray(value) ? 'array' : typeof value;
    if (actual !== rule.type) {
      return `${rule.field}: expected ${rule.type}, got ${actual}`;
    }
  }

  if (typeof value === 'string') {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      return `${rule.field}: too short (${value.length} < ${rule.minLength})`;
    }
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      return `${rule.field}: too long (${value.length} > ${rule.maxLength})`;
    }
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
      return `${rule.field}: does not match pattern`;
    }
  }

  if (rule.enum && !rule.enum.includes(value as string | number)) {
    return `${rule.field}: not in allowed values`;
  }

  return null;
}

export function structuredOutput(options: StructuredOutputOptions): Guard {
  const allowExtra = options.allowExtra ?? true;

  return {
    name: 'structured-output',
    version: '0.1.0',
    description: 'Validates structured JSON output against field rules',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      let parsed: Record<string, unknown>;

      try {
        parsed = JSON.parse(text.trim());
      } catch {
        return {
          guardName: 'structured-output',
          passed: false,
          action: options.action,
          latencyMs: Math.round(performance.now() - start),
          details: { reason: 'Invalid JSON' },
        };
      }

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return {
          guardName: 'structured-output',
          passed: false,
          action: options.action,
          latencyMs: Math.round(performance.now() - start),
          details: { reason: 'Expected JSON object' },
        };
      }

      const violations: string[] = [];

      for (const rule of options.fields) {
        const error = validateField(parsed[rule.field], rule);
        if (error) violations.push(error);
      }

      if (!allowExtra) {
        const allowed = new Set(options.fields.map((f) => f.field));
        for (const key of Object.keys(parsed)) {
          if (!allowed.has(key)) violations.push(`Unexpected field: ${key}`);
        }
      }

      const triggered = violations.length > 0;
      return {
        guardName: 'structured-output',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations } : undefined,
      };
    },
  };
}
