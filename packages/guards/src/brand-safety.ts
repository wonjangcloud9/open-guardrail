import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface BrandSafetyOptions { action: 'block' | 'warn'; categories?: string[]; }
const UNSAFE_KEYWORDS: Record<string, string[]> = {
  controversy: ['scandal', 'lawsuit', 'controversy', 'sued', 'allegations', 'fired for', 'resigned in disgrace'],
  negative: ['worst', 'terrible', 'awful', 'horrible', 'disgusting', 'scam', 'fraud', 'rip-off', 'overpriced'],
  sensitive: ['death', 'tragedy', 'disaster', 'terrorist', 'war', 'pandemic', 'crisis'],
  adult: ['pornography', 'explicit', 'nsfw', 'xxx', 'erotic', 'nude'],
  political: ['partisan', 'extremist', 'radical', 'propaganda'],
};
const ALL_CATS = Object.keys(UNSAFE_KEYWORDS);
export function brandSafety(options: BrandSafetyOptions): Guard {
  const cats = options.categories ?? ALL_CATS;
  return { name: 'brand-safety', version: '0.1.0', description: 'Detect brand-unsafe content across categories', category: 'content', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const lower = text.toLowerCase(); const triggered: Record<string, string[]> = {};
      for (const cat of cats) { const found = (UNSAFE_KEYWORDS[cat] ?? []).filter(kw => lower.includes(kw)); if (found.length > 0) triggered[cat] = found; }
      const hasMatch = Object.keys(triggered).length > 0;
      return { guardName: 'brand-safety', passed: !hasMatch, action: hasMatch ? options.action : 'allow',
        message: hasMatch ? `Brand-unsafe: ${Object.keys(triggered).join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: hasMatch ? { triggered, reason: 'Content contains brand-unsafe language' } : undefined,
      };
    },
  };
}
