import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type ExpectedFormat = 'json' | 'markdown' | 'plain' | 'csv' | 'xml' | 'yaml';

interface OutputFormatOptions {
  action: 'block' | 'warn';
  expected: ExpectedFormat;
}

function detectFormat(text: string): ExpectedFormat {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try { JSON.parse(trimmed); return 'json'; } catch { /* not json */ }
  }
  if (trimmed.startsWith('<?xml') || (trimmed.startsWith('<') && trimmed.includes('</'))) return 'xml';
  if (/^---\n/.test(trimmed) || /^\w+:\s+/m.test(trimmed)) return 'yaml';
  if (/^(?:"[^"]*"|[^,\n]*),/m.test(trimmed) && trimmed.includes('\n')) return 'csv';
  if (/^#{1,6}\s|^\*\s|^-\s|^\d+\.\s|^```/m.test(trimmed)) return 'markdown';
  return 'plain';
}

export function outputFormat(options: OutputFormatOptions): Guard {
  return {
    name: 'output-format',
    version: '0.1.0',
    description: 'Validate output matches expected format (JSON/markdown/CSV/XML/YAML/plain)',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const detected = detectFormat(text);
      const triggered = detected !== options.expected;
      return {
        guardName: 'output-format', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `Format mismatch: detected "${detected}", expected "${options.expected}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: { detected, expected: options.expected, reason: triggered ? 'Output format does not match specification' : undefined },
      };
    },
  };
}
