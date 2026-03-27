import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface InputSanitizeOptions {
  action: 'block' | 'warn' | 'mask';
  /** Strip HTML tags (default true) */
  stripHtml?: boolean;
  /** Normalize unicode (default true) */
  normalizeUnicode?: boolean;
  /** Remove null bytes (default true) */
  removeNullBytes?: boolean;
  /** Trim excessive whitespace (default true) */
  trimWhitespace?: boolean;
  /** Max consecutive newlines (default 5) */
  maxNewlines?: number;
}

export function inputSanitize(options: InputSanitizeOptions): Guard {
  const stripHtml = options.stripHtml ?? true;
  const normalizeUnicode = options.normalizeUnicode ?? true;
  const removeNullBytes = options.removeNullBytes ?? true;
  const trimWs = options.trimWhitespace ?? true;
  const maxNl = options.maxNewlines ?? 5;

  return {
    name: 'input-sanitize',
    version: '0.1.0',
    description: 'Sanitizes input by stripping dangerous characters and normalizing text',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      let sanitized = text;
      const changes: string[] = [];

      if (removeNullBytes && /\0/.test(sanitized)) {
        sanitized = sanitized.replace(/\0/g, '');
        changes.push('null-bytes');
      }

      if (stripHtml && /<[^>]+>/.test(sanitized)) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
        changes.push('html-tags');
      }

      if (normalizeUnicode) {
        const normalized = sanitized.normalize('NFC');
        if (normalized !== sanitized) {
          sanitized = normalized;
          changes.push('unicode-normalization');
        }
      }

      if (trimWs) {
        const trimmed = sanitized.replace(/[ \t]+/g, ' ').trim();
        if (trimmed !== sanitized) {
          sanitized = trimmed;
          changes.push('whitespace');
        }
      }

      const nlPattern = new RegExp(`\n{${maxNl + 1},}`, 'g');
      if (nlPattern.test(sanitized)) {
        sanitized = sanitized.replace(nlPattern, '\n'.repeat(maxNl));
        changes.push('excessive-newlines');
      }

      const modified = changes.length > 0;

      if (!modified) {
        return {
          guardName: 'input-sanitize',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (options.action === 'mask') {
        return {
          guardName: 'input-sanitize',
          passed: true,
          action: 'override',
          overrideText: sanitized,
          latencyMs: Math.round(performance.now() - start),
          details: { sanitized: changes },
        };
      }

      return {
        guardName: 'input-sanitize',
        passed: false,
        action: options.action,
        latencyMs: Math.round(performance.now() - start),
        details: { sanitized: changes },
      };
    },
  };
}
