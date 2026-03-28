import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PromptChainingOptions {
  action: 'block' | 'warn';
  maxChainLength?: number;
}

const DEFAULT_PATTERNS: RegExp[] = [
  /first[\s,]+.{5,}then[\s,]+/i,
  /step\s+1[\s:].{5,}step\s+2/i,
  /step\s+\d[\s:].{5,}step\s+\d/i,
  /now\s+that\s+you'?ve?\s+(done|completed|finished)\s+/i,
  /continue\s+from\s+where/i,
  /based\s+on\s+your\s+previous\s+(answer|response|output)/i,
  /you\s+just\s+said[\s,].{5,}so\s+now/i,
  /after\s+that[\s,]+proceed\s+to/i,
  /next[\s,]+I\s+need\s+you\s+to/i,
  /having\s+done\s+that[\s,]+now/i,
];

export function promptChaining(options: PromptChainingOptions): Guard {
  const maxChain = options.maxChainLength ?? 3;

  return {
    name: 'prompt-chaining',
    version: '0.1.0',
    description: 'Detects multi-step prompt chaining attacks',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of DEFAULT_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const stepMatches = text.match(/step\s+\d/gi) ?? [];
      const chainLength = stepMatches.length;
      const chainExceeded = chainLength > maxChain;

      const triggered = matched.length > 0 || chainExceeded;
      const score = triggered
        ? Math.min((matched.length + (chainExceeded ? 1 : 0)) / 3, 1.0)
        : 0;

      return {
        guardName: 'prompt-chaining',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedPatterns: matched.length, chainLength }
          : undefined,
      };
    },
  };
}
