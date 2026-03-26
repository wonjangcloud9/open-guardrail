import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface BanSubstringOptions {
  action: 'block' | 'warn';
  substrings: string[];
  caseSensitive?: boolean;
  containsAll?: boolean;
}

export function banSubstring(options: BanSubstringOptions): Guard {
  const ci = !(options.caseSensitive ?? false);
  const containsAll = options.containsAll ?? false;

  return {
    name: 'ban-substring',
    version: '0.1.0',
    description: 'Ban specific substrings from text',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const searchText = ci ? text.toLowerCase() : text;
      const matched: string[] = [];

      for (const sub of options.substrings) {
        const searchSub = ci ? sub.toLowerCase() : sub;
        if (searchText.includes(searchSub)) matched.push(sub);
      }

      const triggered = containsAll
        ? matched.length === options.substrings.length
        : matched.length > 0;

      return {
        guardName: 'ban-substring',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
