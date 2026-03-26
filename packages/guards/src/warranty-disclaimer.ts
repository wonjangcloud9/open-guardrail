import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface WarrantyDisclaimerOptions { action: 'block' | 'warn'; }
const WARRANTY_PATTERNS: RegExp[] = [
  /\b(?:guarantee(?:d|s)?|warrant(?:y|ed|ies)?)\s+(?:that|to|for|of)\b/gi,
  /\b(?:100%\s+(?:satisfaction|money[- ]back|guarantee|effective))\b/gi,
  /\b(?:no\s+risk|risk[- ]free|unconditional\s+(?:guarantee|warranty))\b/gi,
  /\b(?:lifetime\s+(?:warranty|guarantee)|permanent\s+(?:fix|solution|cure))\b/gi,
  /\b(?:will\s+(?:definitely|certainly|absolutely|always)\s+(?:work|fix|solve|cure))\b/gi,
  /\b(?:proven\s+to\s+(?:work|cure|fix|solve)\s+(?:100%|every|all))\b/gi,
];
export function warrantyDisclaimer(options: WarrantyDisclaimerOptions): Guard {
  return { name: 'warranty-disclaimer', version: '0.1.0', description: 'Detect warranty/guarantee claims requiring disclaimers', category: 'content', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of WARRANTY_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'warranty-disclaimer', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Warranty/guarantee claim: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains warranty or guarantee claims that may need legal disclaimers' } : undefined,
      };
    },
  };
}
