import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SystemPromptGuardOptions {
  action: 'block' | 'warn';
  /** Additional custom patterns to detect */
  customPatterns?: string[];
}

const DEFAULT_PATTERNS = [
  'system prompt:',
  'my instructions are',
  'i was told to',
  'my system message',
  'as an ai assistant, i am programmed',
  'my configuration is',
  'i am configured to',
  'my rules are',
  'system:',
  '<<sys>>',
  '[inst]',
  '### system',
  'role: system',
];

export function systemPromptGuard(options: SystemPromptGuardOptions): Guard {
  const patterns = [
    ...DEFAULT_PATTERNS,
    ...(options.customPatterns ?? []).map((p) => p.toLowerCase()),
  ];

  return {
    name: 'system-prompt-guard',
    version: '0.1.0',
    description: 'Detects system prompt leakage in agent output',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched = patterns.filter((p) => lower.includes(p));
      const triggered = matched.length > 0;
      return {
        guardName: 'system-prompt-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedPatterns: matched }
          : undefined,
      };
    },
  };
}
