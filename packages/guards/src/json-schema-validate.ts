import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface JsonSchemaValidateOptions {
  action: 'block' | 'warn';
  expectedFields?: string[];
  expectedTypes?: Record<string, string>;
}

function tryParseJson(text: string): { parsed: unknown; issues: string[] } | null {
  const issues: string[] = [];
  let cleaned = text.trim();

  // Strip markdown code block
  const mdMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (mdMatch) {
    cleaned = mdMatch[1].trim();
    issues.push('wrapped-in-markdown-code-block');
  }

  // Strip extra text before/after JSON
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const idx = cleaned.search(/[{\[]/);
    if (idx > 0) {
      cleaned = cleaned.slice(idx);
      issues.push('extra-text-before-json');
    }
  }
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (lastBrace >= 0 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.slice(0, lastBrace + 1);
    issues.push('extra-text-after-json');
  }

  try {
    return { parsed: JSON.parse(cleaned), issues };
  } catch {
    // Try fixing trailing commas
    const noTrailing = cleaned.replace(/,\s*([}\]])/g, '$1');
    if (noTrailing !== cleaned) issues.push('trailing-commas');
    try {
      return { parsed: JSON.parse(noTrailing), issues };
    } catch {
      // Try fixing single quotes
      const dblQuotes = noTrailing.replace(/'/g, '"');
      if (dblQuotes !== noTrailing) issues.push('single-quotes-instead-of-double');
      try {
        return { parsed: JSON.parse(dblQuotes), issues };
      } catch {
        return null;
      }
    }
  }
}

export function jsonSchemaValidate(options: JsonSchemaValidateOptions): Guard {
  return {
    name: 'json-schema-validate',
    version: '0.1.0',
    description: 'Validate LLM JSON output against a schema with repair hints',
    category: 'format',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const result = tryParseJson(text);

      if (!result) {
        return {
          guardName: 'json-schema-validate',
          passed: false,
          action: options.action,
          message: 'Failed to parse as JSON even after repair attempts',
          latencyMs: Math.round(performance.now() - start),
          details: { repairHints: ['Check for unquoted keys', 'Ensure valid JSON syntax'] },
        };
      }

      issues.push(...result.issues);
      const obj = result.parsed;

      if (options.expectedFields && typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        const record = obj as Record<string, unknown>;
        for (const field of options.expectedFields) {
          if (!(field in record)) issues.push(`missing-field:${field}`);
        }
      }

      if (options.expectedTypes && typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        const record = obj as Record<string, unknown>;
        for (const [key, expectedType] of Object.entries(options.expectedTypes)) {
          if (key in record) {
            const actual = Array.isArray(record[key]) ? 'array' : typeof record[key];
            if (actual !== expectedType) {
              issues.push(`type-mismatch:${key}:expected=${expectedType},actual=${actual}`);
            }
          }
        }
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'json-schema-validate',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `JSON issues: ${issues.join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, repairHints: issues } : undefined,
      };
    },
  };
}
