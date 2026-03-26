import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface GreenwashingOptions { action: 'block' | 'warn'; }
const GREENWASH_PATTERNS: RegExp[] = [
  /\b(?:100%|completely|totally)\s+(?:green|sustainable|eco[- ]friendly|carbon[- ]neutral)\b/gi,
  /\b(?:zero\s+(?:carbon|emission|waste))\s+(?:guarantee|certified|proven)\b/gi,
  /\b(?:all[- ]natural|chemical[- ]free|toxin[- ]free)\b/gi,
  /\b(?:eco|green|clean|sustainable)\s+(?:without\s+(?:any\s+)?(?:evidence|proof|data|certification))\b/gi,
  /\b(?:planet[- ]friendly|earth[- ]friendly|nature[- ]friendly)\s+(?:product|solution|company)\b/gi,
  /\b(?:offset(?:ting)?|neutralize)\s+(?:all|100%|every)\s+(?:carbon|emission|footprint)\b/gi,
];
export function greenwashing(options: GreenwashingOptions): Guard {
  return { name: 'greenwashing', version: '0.1.0', description: 'Detect greenwashing and unverified environmental claims', category: 'content', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of GREENWASH_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'greenwashing', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Greenwashing claim: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains unverified environmental claims (greenwashing)' } : undefined,
      };
    },
  };
}
