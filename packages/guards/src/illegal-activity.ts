import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface IllegalActivityOptions { action: 'block' | 'warn'; categories?: string[]; }
const ILLEGAL_KEYWORDS: Record<string, string[]> = {
  drugs: ['how to make meth', 'synthesize cocaine', 'grow marijuana illegally', 'drug trafficking', 'dark web drugs'],
  weapons: ['how to make a bomb', 'build a weapon', '3d print a gun', 'homemade explosive', 'improvised weapon'],
  hacking: ['hack into', 'crack password', 'bypass security system', 'exploit vulnerability', 'ddos attack', 'brute force'],
  fraud: ['fake identity', 'forge documents', 'money laundering', 'counterfeit', 'identity theft', 'credit card fraud'],
  harassment: ['how to stalk', 'cyberbully', 'revenge porn', 'blackmail someone', 'doxxing'],
};
const ALL_CATS = Object.keys(ILLEGAL_KEYWORDS);
export function illegalActivity(options: IllegalActivityOptions): Guard {
  const cats = options.categories ?? ALL_CATS;
  return { name: 'illegal-activity', version: '0.1.0', description: 'Detect requests for illegal activities', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const lower = text.toLowerCase(); const triggered: Record<string, string[]> = {};
      for (const cat of cats) { const found = (ILLEGAL_KEYWORDS[cat] ?? []).filter(kw => lower.includes(kw)); if (found.length > 0) triggered[cat] = found; }
      const hasMatch = Object.keys(triggered).length > 0;
      return { guardName: 'illegal-activity', passed: !hasMatch, action: hasMatch ? options.action : 'allow',
        message: hasMatch ? `Illegal activity detected: ${Object.keys(triggered).join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: hasMatch ? { triggered, reason: 'Text requests or describes illegal activities' } : undefined,
      };
    },
  };
}
