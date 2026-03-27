import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseFormatEnforceOptions {
  action: 'block' | 'warn';
  /** Expected format */
  format: 'json' | 'markdown' | 'plain' | 'csv' | 'xml' | 'yaml';
}

function isJson(text: string): boolean {
  try { JSON.parse(text.trim()); return true; } catch { return false; }
}

function isMarkdown(text: string): boolean {
  return /^#{1,6}\s/m.test(text) || /\*\*.*\*\*/.test(text) || /^\s*[-*]\s/m.test(text) || /```/.test(text);
}

function isCsv(text: string): boolean {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return false;
  const delimiter = lines[0].includes(',') ? ',' : lines[0].includes('\t') ? '\t' : null;
  if (!delimiter) return false;
  const cols = lines[0].split(delimiter).length;
  return lines.slice(1, 4).every((l) => Math.abs(l.split(delimiter).length - cols) <= 1);
}

function isXml(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('<') && trimmed.endsWith('>') && /<\/\w+>/.test(trimmed);
}

function isYaml(text: string): boolean {
  return /^\w+\s*:/m.test(text) && !isJson(text) && (text.includes('\n') || /:\s+\S/.test(text));
}

export function responseFormatEnforce(options: ResponseFormatEnforceOptions): Guard {
  const validators: Record<string, (t: string) => boolean> = {
    json: isJson, markdown: isMarkdown, plain: (t) => !isJson(t) && !isXml(t),
    csv: isCsv, xml: isXml, yaml: isYaml,
  };

  return {
    name: 'response-format-enforce',
    version: '0.1.0',
    description: 'Enforces expected response format (JSON, markdown, CSV, etc)',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const validator = validators[options.format];
      const valid = validator ? validator(text) : true;
      const triggered = !valid;

      return {
        guardName: 'response-format-enforce',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { expected: options.format, reason: `Response is not valid ${options.format}` } : undefined,
      };
    },
  };
}
