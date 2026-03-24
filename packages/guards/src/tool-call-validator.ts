import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type ValidationType = 'email' | 'uuid' | 'url' | 'number';

interface ToolRule {
  tool: string;
  arg: string;
  validate?: ValidationType;
  denyPatterns?: RegExp[];
}

interface ToolCallValidatorOptions {
  action: 'block' | 'warn';
  rules: ToolRule[];
  allowedTools?: string[];
}

const VALIDATORS: Record<ValidationType, (v: string) => boolean> = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  uuid: (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
  url: (v) => /^https?:\/\/.+/.test(v),
  number: (v) => !isNaN(Number(v)),
};

interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
}

function parseToolCall(text: string): ToolCall | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.tool === 'string' && typeof parsed.args === 'object') {
      return parsed as ToolCall;
    }
    return null;
  } catch {
    return null;
  }
}

export function toolCallValidator(options: ToolCallValidatorOptions): Guard {
  return {
    name: 'tool-call-validator',
    version: '0.7.0',
    description: 'Validates agent tool call arguments for type safety and injection prevention',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const call = parseToolCall(text);

      if (!call) {
        return { guardName: 'tool-call-validator', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }

      if (options.allowedTools && !options.allowedTools.includes(call.tool)) {
        return {
          guardName: 'tool-call-validator', passed: false, action: options.action,
          latencyMs: Math.round(performance.now() - start),
          details: { reason: `Tool "${call.tool}" not allowed`, allowed: options.allowedTools },
        };
      }

      const violations: string[] = [];

      for (const rule of options.rules) {
        const toolMatch = rule.tool === '*' || rule.tool === call.tool;
        if (!toolMatch) continue;

        const argsToCheck = rule.arg === '*'
          ? Object.entries(call.args)
          : Object.entries(call.args).filter(([k]) => k === rule.arg);

        for (const [argName, argValue] of argsToCheck) {
          const strValue = String(argValue);

          if (rule.validate && !VALIDATORS[rule.validate](strValue)) {
            violations.push(`${call.tool}.${argName}: failed ${rule.validate} validation`);
          }

          if (rule.denyPatterns) {
            for (const pattern of rule.denyPatterns) {
              if (pattern.test(strValue)) {
                violations.push(`${call.tool}.${argName}: matched deny pattern ${pattern.source}`);
              }
            }
          }
        }
      }

      const triggered = violations.length > 0;
      return {
        guardName: 'tool-call-validator',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations } : undefined,
      };
    },
  };
}
