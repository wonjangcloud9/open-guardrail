import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ChainOfThoughtLeakOptions {
  action: 'block' | 'warn';
  /** Custom internal markers to detect */
  customMarkers?: string[];
}

const COT_PATTERNS = [
  /\b(?:let me think|let's think|step by step|chain of thought|reasoning:)\b/i,
  /\b(?:internal(?:ly)?|privately|behind the scenes)\b.*\b(?:think|reason|consider|analyze)\b/i,
  /<(?:thinking|scratchpad|internal|cot|reasoning)>/i,
  /\[(?:THINKING|SCRATCHPAD|INTERNAL|COT|REASONING)\]/i,
  /\b(?:my internal reasoning|my thought process|my analysis shows)\b/i,
  /^(?:Step \d+:|Phase \d+:|First,|Second,|Third,|Finally,)/im,
];

export function chainOfThoughtLeak(options: ChainOfThoughtLeakOptions): Guard {
  const patterns = [...COT_PATTERNS];
  if (options.customMarkers) {
    for (const m of options.customMarkers) {
      patterns.push(new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    }
  }

  return {
    name: 'chain-of-thought-leak',
    version: '0.1.0',
    description: 'Detects leaked chain-of-thought reasoning in output',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of patterns) {
        const m = text.match(p);
        if (m) matched.push(m[0]);
      }
      const triggered = matched.length > 0;
      return {
        guardName: 'chain-of-thought-leak', passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched: [...new Set(matched)] } : undefined,
      };
    },
  };
}
