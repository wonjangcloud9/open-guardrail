import type { Guard, GuardResult, GuardContext } from '@open-guardrail/core';

interface PromptInjectionOptions {
  action: 'block' | 'warn';
  extraPatterns?: RegExp[];
}

const DEFAULT_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|rules|guidelines)/i,
  /disregard\s+(all\s+)?(previous|prior|your)\s+(instructions|rules|programming)/i,
  /forget\s+(all\s+)?(previous|prior|your)\s+(instructions|rules|context)/i,
  /you\s+are\s+now\s+\w+\.\s+\w+\s+can\s+do\s+anything/i,
  /pretend\s+you\s+(are|have)\s+(no\s+restrictions|unlimited|DAN)/i,
  /(print|show|reveal|output|display)\s+(your\s+)?(system\s+prompt|instructions|initial\s+prompt)/i,
  /\bDAN\b.*\bdo\s+anything\b/i,
  /jailbreak/i,
  /ignore\s+all\s+rules/i,
  /act\s+as\s+if\s+you\s+have\s+no\s+(restrictions|limits|guidelines)/i,
];

export function promptInjection(options: PromptInjectionOptions): Guard {
  const patterns = [...DEFAULT_PATTERNS, ...(options.extraPatterns ?? [])];

  return {
    name: 'prompt-injection',
    version: '0.1.0',
    description: 'Detects prompt injection and jailbreak attempts',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of patterns) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'prompt-injection',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
