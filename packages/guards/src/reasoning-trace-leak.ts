import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ReasoningTraceLeakOptions {
  action: 'block' | 'warn';
  customTags?: string[];
}

const DEFAULT_PATTERNS: RegExp[] = [
  /<thinking>/i,
  /<\/thinking>/i,
  /<scratchpad>/i,
  /<\/scratchpad>/i,
  /Let me think step by step/i,
  /Internal reasoning:/i,
  /My thought process:/i,
  /^Step \d+:/im,
  /First,?\s+I need to consider/i,
  /Note to self:/i,
];

export function reasoningTraceLeak(options: ReasoningTraceLeakOptions): Guard {
  const tagPatterns = (options.customTags ?? []).flatMap(tag => [
    new RegExp(`<${tag}>`, 'i'),
    new RegExp(`</${tag}>`, 'i'),
  ]);
  const patterns = [...DEFAULT_PATTERNS, ...tagPatterns];

  return {
    name: 'reasoning-trace-leak',
    version: '0.1.0',
    description: 'Detects when LLM reasoning/chain-of-thought leaks into output',
    category: 'ai',
    supportedStages: ['output'],
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
        guardName: 'reasoning-trace-leak',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
