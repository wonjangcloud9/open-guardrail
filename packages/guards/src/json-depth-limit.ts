import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface JsonDepthLimitOptions {
  action: 'block' | 'warn';
  maxDepth?: number;
}

function measureDepth(text: string): number {
  let maxDepth = 0;
  let current = 0;
  for (const ch of text) {
    if (ch === '{' || ch === '[') {
      current++;
      if (current > maxDepth) maxDepth = current;
    } else if (ch === '}' || ch === ']') {
      current--;
    }
  }
  return maxDepth;
}

export function jsonDepthLimit(options: JsonDepthLimitOptions): Guard {
  const maxDepth = options.maxDepth ?? 20;

  return {
    name: 'json-depth-limit',
    version: '0.1.0',
    description: 'Limits JSON nesting depth to prevent DoS attacks',
    category: 'format',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const depth = measureDepth(text);
      const triggered = depth > maxDepth;

      return {
        guardName: 'json-depth-limit',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(depth / (maxDepth * 2), 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: { depth, maxDepth },
      };
    },
  };
}
