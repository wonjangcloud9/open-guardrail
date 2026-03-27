import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ToolOutputSanitizeOptions {
  action: 'block' | 'warn';
  maxLength?: number;
  stripHtml?: boolean;
}

function removeHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

function removeControlChars(text: string): string {
  return text.replace(
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
    '',
  );
}

export function toolOutputSanitize(
  options: ToolOutputSanitizeOptions,
): Guard {
  const maxLength = options.maxLength ?? 10000;
  const stripHtml = options.stripHtml ?? true;

  return {
    name: 'tool-output-sanitize',
    version: '0.1.0',
    description:
      'Sanitizes tool output by stripping HTML and control chars',
    category: 'security',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      let sanitized = text;
      const modifications: string[] = [];

      if (stripHtml && /<[^>]*>/.test(sanitized)) {
        sanitized = removeHtmlTags(sanitized);
        modifications.push('html_stripped');
      }

      if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(sanitized)) {
        sanitized = removeControlChars(sanitized);
        modifications.push('control_chars_removed');
      }

      if (sanitized.length > maxLength) {
        sanitized = sanitized.slice(0, maxLength);
        modifications.push('truncated');
      }

      const modified = modifications.length > 0;

      return {
        guardName: 'tool-output-sanitize',
        passed: true,
        action: modified ? 'override' : 'allow',
        overrideText: modified ? sanitized : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: modified
          ? {
              modifications,
              sanitizedText: sanitized,
              originalLength: text.length,
              sanitizedLength: sanitized.length,
            }
          : undefined,
      };
    },
  };
}
