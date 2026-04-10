import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CommandHierarchyOptions {
  action: 'block' | 'warn';
}

const OVERRIDE_PATTERNS = [
  'ignore previous',
  'disregard above',
  'override instructions',
  'new instructions:',
  'forget everything',
  'ignore all prior',
  'skip the rules',
  'bypass restrictions',
  'you are now',
  'act as if',
  'pretend that',
  'your new role',
];

export function commandHierarchy(options: CommandHierarchyOptions): Guard {
  return {
    name: 'command-hierarchy',
    version: '0.1.0',
    description: 'Prevents lower-priority instructions from overriding higher ones',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched = OVERRIDE_PATTERNS.filter((p) => lower.includes(p));
      const triggered = matched.length > 0;
      return {
        guardName: 'command-hierarchy',
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
