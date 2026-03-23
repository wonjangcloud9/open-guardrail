import type { Guard, GuardResult, GuardContext } from '@open-guardrail/core';

interface KeywordOptions {
  denied?: string[];
  allowed?: string[];
  action: 'block' | 'warn';
  caseSensitive?: boolean;
}

export function keyword(options: KeywordOptions): Guard {
  const normalize = (s: string) => options.caseSensitive ? s : s.toLowerCase();

  return {
    name: 'keyword',
    version: '0.1.0',
    description: 'Keyword deny/allow list guard',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const normalizedText = normalize(text);
      let triggered = false;
      const found: string[] = [];

      if (options.denied) {
        for (const word of options.denied) {
          if (normalizedText.includes(normalize(word))) {
            triggered = true;
            found.push(word);
          }
        }
      }

      if (options.allowed && !triggered) {
        const hasAllowed = options.allowed.some((w) => normalizedText.includes(normalize(w)));
        if (!hasAllowed) triggered = true;
      }

      return {
        guardName: 'keyword',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: found.length > 0 ? { matched: found } : undefined,
      };
    },
  };
}
