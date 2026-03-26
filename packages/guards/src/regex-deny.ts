import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface RegexDenyOptions {
  action: 'block' | 'warn' | 'mask';
  patterns: { pattern: string; flags?: string; label: string; maskWith?: string }[];
}

/**
 * User-configurable regex deny list with labels and masking.
 * More flexible than the built-in regex guard — each pattern gets
 * a human-readable label and optional mask replacement.
 *
 * @example
 * ```typescript
 * const guard = regexDeny({
 *   action: 'mask',
 *   patterns: [
 *     { pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b', label: 'SSN', maskWith: '[SSN]' },
 *     { pattern: 'password\\s*[:=]\\s*\\S+', label: 'password', maskWith: '[PASSWORD]' },
 *   ],
 * });
 * ```
 */
export function regexDeny(options: RegexDenyOptions): Guard {
  const compiled = options.patterns.map((p) => ({
    re: new RegExp(p.pattern, p.flags ?? 'gi'),
    label: p.label,
    maskWith: p.maskWith ?? `[${p.label.toUpperCase()}]`,
  }));

  return {
    name: 'regex-deny',
    version: '0.1.0',
    description: 'User-configurable regex deny list with labels',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matched: { label: string; value: string }[] = [];
      let maskedText = text;

      for (const { re, label, maskWith } of compiled) {
        const regex = new RegExp(re.source, re.flags);
        let m: RegExpExecArray | null;
        while ((m = regex.exec(text)) !== null) {
          matched.push({ label, value: m[0] });
        }
        if (options.action === 'mask') {
          maskedText = maskedText.replace(
            new RegExp(re.source, re.flags),
            maskWith,
          );
        }
      }

      const triggered = matched.length > 0;

      if (!triggered) {
        return {
          guardName: 'regex-deny',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (options.action === 'mask') {
        return {
          guardName: 'regex-deny',
          passed: true,
          action: 'override',
          overrideText: maskedText,
          message: `Masked ${matched.length} pattern(s): ${[...new Set(matched.map((m) => m.label))].join(', ')}`,
          latencyMs: Math.round(performance.now() - start),
          details: { matched, reason: 'Custom regex patterns matched and were masked' },
        };
      }

      return {
        guardName: 'regex-deny',
        passed: false,
        action: options.action,
        message: `Denied pattern(s) found: ${[...new Set(matched.map((m) => m.label))].join(', ')}`,
        latencyMs: Math.round(performance.now() - start),
        details: { matched, reason: 'Text matched one or more denied regex patterns' },
      };
    },
  };
}
