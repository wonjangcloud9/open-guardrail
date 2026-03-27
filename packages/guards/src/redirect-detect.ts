import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RedirectDetectOptions {
  action: 'block' | 'warn';
}

const PATTERNS = [
  /\b(?:visit|go\s+to|click|open|navigate\s+to)\s+(?:this\s+)?(?:link|url|site|page)\s*[:=]?\s*https?:\/\//i,
  /\b(?:redirect|forward|transfer)\s+(?:to|the\s+user\s+to)\s+https?:\/\//i,
  /\bwindow\.location\s*=/, /\blocation\.href\s*=/,
  /\bwindow\.open\s*\(/, /\bmeta\s+http-equiv\s*=\s*["']refresh/i,
  /\b302\s+redirect/i,
];

export function redirectDetect(options: RedirectDetectOptions): Guard {
  return {
    name: 'redirect-detect',
    version: '0.1.0',
    description: 'Detects URL redirect attempts in LLM output',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of PATTERNS) { const m = text.match(p); if (m) matched.push(m[0].slice(0, 60)); }
      const triggered = matched.length > 0;
      return { guardName: 'redirect-detect', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { matched } : undefined };
    },
  };
}
