import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface EmotionalManipulationOptions { action: 'block' | 'warn'; }

const MANIPULATION_PATTERNS: RegExp[] = [
  /\bif you (?:really|truly) (?:cared|loved|were my friend)\b/gi,
  /\b(?:you'?re|you are)\s+(?:being\s+)?(?:selfish|ungrateful|heartless|cruel)\s+(?:if|for|by)\b/gi,
  /\b(?:no one|nobody)\s+(?:will ever|else would|else will)\b/gi,
  /\b(?:you(?:'ll| will)\s+(?:regret|be sorry)|you(?:'re| are)\s+(?:nothing|worthless)\s+without)\b/gi,
  /\b(?:guilt|shame)\s+(?:trip|on you)\b/gi,
  /\bafter\s+(?:everything|all)\s+I(?:'ve| have)\s+done\s+for\s+you\b/gi,
  /\b(?:you\s+owe\s+me|you\s+should\s+feel\s+(?:bad|guilty|ashamed))\b/gi,
  /\b(?:everyone\s+(?:thinks|agrees|says)\s+you(?:'re| are))\b/gi,
  /\b(?:love\s+bomb|gaslighting|fear\s+of\s+missing\s+out|FOMO|urgency\s+tactic)\b/gi,
];

export function emotionalManipulation(options: EmotionalManipulationOptions): Guard {
  return { name: 'emotional-manipulation', version: '0.1.0', description: 'Detect emotional manipulation tactics (guilt-tripping, gaslighting, FOMO)', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of MANIPULATION_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'emotional-manipulation', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Emotional manipulation: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains emotional manipulation patterns' } : undefined,
      };
    },
  };
}
