import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface JsonRepairOptions {
  action: 'block' | 'warn' | 'fix';
}

function tryRepairJson(text: string): { repaired: string; wasFixed: boolean } | null {
  let trimmed = text.trim();

  // Already valid
  try {
    JSON.parse(trimmed);
    return { repaired: trimmed, wasFixed: false };
  } catch {
    // continue to repair
  }

  // Extract JSON from markdown code blocks
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    trimmed = codeBlockMatch[1].trim();
    try {
      JSON.parse(trimmed);
      return { repaired: trimmed, wasFixed: true };
    } catch {
      // continue
    }
  }

  // Fix trailing commas before } or ]
  let fixed = trimmed.replace(/,\s*([}\]])/g, '$1');
  try {
    JSON.parse(fixed);
    return { repaired: fixed, wasFixed: true };
  } catch {
    // continue
  }

  // Fix missing closing brackets
  const opens = (trimmed.match(/[{[]/g) ?? []).length;
  const closes = (trimmed.match(/[}\]]/g) ?? []).length;
  if (opens > closes) {
    let attempt = trimmed;
    for (let i = 0; i < opens - closes; i++) {
      attempt += trimmed.lastIndexOf('[') > trimmed.lastIndexOf('{') ? ']' : '}';
    }
    try {
      JSON.parse(attempt);
      return { repaired: attempt, wasFixed: true };
    } catch {
      // continue
    }
  }

  // Fix single quotes to double quotes
  fixed = trimmed.replace(/'/g, '"');
  try {
    JSON.parse(fixed);
    return { repaired: fixed, wasFixed: true };
  } catch {
    // give up
  }

  return null;
}

export function jsonRepair(options: JsonRepairOptions): Guard {
  return {
    name: 'json-repair',
    version: '1.0.0',
    description: 'Validates and repairs malformed JSON output from LLMs',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      const result = tryRepairJson(text);

      if (!result) {
        return {
          guardName: 'json-repair',
          passed: false,
          action: options.action === 'fix' ? 'block' : options.action,
          latencyMs: Math.round(performance.now() - start),
          details: { reason: 'Could not parse or repair JSON' },
        };
      }

      if (!result.wasFixed) {
        return {
          guardName: 'json-repair',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      // JSON was repaired
      if (options.action === 'fix') {
        return {
          guardName: 'json-repair',
          passed: true,
          action: 'override',
          overrideText: result.repaired,
          latencyMs: Math.round(performance.now() - start),
          details: { repaired: true },
        };
      }

      return {
        guardName: 'json-repair',
        passed: false,
        action: options.action,
        latencyMs: Math.round(performance.now() - start),
        details: { repaired: true, repairedText: result.repaired },
      };
    },
  };
}
