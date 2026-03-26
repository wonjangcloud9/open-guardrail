import type { Guard, GuardResult, GuardContext, GuardCategory } from './types.js';

interface CustomGuardConfig {
  name: string;
  version?: string;
  description?: string;
  category?: GuardCategory;
  stages?: ('input' | 'output')[];
}

type CheckFn = (text: string, ctx: GuardContext) => GuardResult | Promise<GuardResult>;

/**
 * Build a custom guard with minimal boilerplate.
 * Users only need to provide the check logic.
 *
 * @example
 * ```typescript
 * const myGuard = createCustomGuard({
 *   name: 'no-emoji',
 *   description: 'Block emoji in text',
 * }, (text) => {
 *   const hasEmoji = /\p{Emoji}/u.test(text);
 *   return {
 *     guardName: 'no-emoji',
 *     passed: !hasEmoji,
 *     action: hasEmoji ? 'block' : 'allow',
 *     latencyMs: 0,
 *   };
 * });
 * ```
 */
export function createCustomGuard(
  config: CustomGuardConfig,
  checkFn: CheckFn,
): Guard {
  return {
    name: config.name,
    version: config.version ?? '0.1.0',
    description: config.description ?? `Custom guard: ${config.name}`,
    category: config.category ?? 'custom',
    supportedStages: config.stages ?? ['input', 'output'],
    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const result = await checkFn(text, ctx);
      return {
        ...result,
        guardName: config.name,
        latencyMs: result.latencyMs ?? Math.round(performance.now() - start),
      };
    },
  };
}

/**
 * Create a keyword-based custom guard with deny/allow lists.
 *
 * @example
 * ```typescript
 * const brandGuard = createKeywordGuard({
 *   name: 'brand-safety',
 *   action: 'block',
 *   denied: ['competitor-name', 'offensive-term'],
 *   caseInsensitive: true,
 * });
 * ```
 */
export function createKeywordGuard(config: {
  name: string;
  action: 'block' | 'warn';
  denied?: string[];
  allowed?: string[];
  caseInsensitive?: boolean;
}): Guard {
  const ci = config.caseInsensitive ?? true;

  return createCustomGuard(
    { name: config.name, description: `Keyword guard: ${config.name}`, category: 'custom' },
    (text) => {
      const searchText = ci ? text.toLowerCase() : text;
      const matched: string[] = [];

      if (config.denied) {
        for (const kw of config.denied) {
          const searchKw = ci ? kw.toLowerCase() : kw;
          if (searchText.includes(searchKw)) matched.push(kw);
        }
      }

      if (config.allowed && matched.length === 0) {
        let hasAllowed = false;
        for (const kw of config.allowed) {
          const searchKw = ci ? kw.toLowerCase() : kw;
          if (searchText.includes(searchKw)) { hasAllowed = true; break; }
        }
        if (!hasAllowed && config.allowed.length > 0) {
          return {
            guardName: config.name,
            passed: false,
            action: config.action,
            latencyMs: 0,
            details: { reason: 'No allowed keywords found' },
          };
        }
      }

      const triggered = matched.length > 0;
      return {
        guardName: config.name,
        passed: !triggered,
        action: triggered ? config.action : 'allow',
        latencyMs: 0,
        details: triggered ? { matched } : undefined,
      };
    },
  );
}

/**
 * Create a regex-based custom guard.
 *
 * @example
 * ```typescript
 * const phoneGuard = createRegexGuard({
 *   name: 'custom-phone',
 *   action: 'mask',
 *   patterns: [/\d{3}-\d{4}-\d{4}/g],
 *   maskLabel: '[PHONE]',
 * });
 * ```
 */
export function createRegexGuard(config: {
  name: string;
  action: 'block' | 'warn' | 'mask';
  patterns: RegExp[];
  maskLabel?: string;
}): Guard {
  return createCustomGuard(
    { name: config.name, description: `Regex guard: ${config.name}`, category: 'custom' },
    (text) => {
      const matched: string[] = [];
      let maskedText = text;

      for (const pattern of config.patterns) {
        const re = new RegExp(pattern.source, pattern.flags);
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          matched.push(m[0]);
        }
        if (config.action === 'mask' && config.maskLabel) {
          maskedText = maskedText.replace(
            new RegExp(pattern.source, pattern.flags),
            config.maskLabel,
          );
        }
      }

      const triggered = matched.length > 0;

      if (!triggered) {
        return { guardName: config.name, passed: true, action: 'allow', latencyMs: 0 };
      }

      if (config.action === 'mask') {
        return {
          guardName: config.name,
          passed: true,
          action: 'override',
          overrideText: maskedText,
          latencyMs: 0,
          details: { matched },
        };
      }

      return {
        guardName: config.name,
        passed: false,
        action: config.action,
        latencyMs: 0,
        details: { matched },
      };
    },
  );
}
