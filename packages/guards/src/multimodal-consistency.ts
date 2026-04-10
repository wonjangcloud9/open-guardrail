import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface MultimodalConsistencyOptions { action: 'block' | 'warn'; }
const EXPLICIT_CONTRADICTION = /\b(?:the\s+(?:image|photo|picture|visual)\s+shows?\s+.{1,60}?\s+but\s+the\s+(?:text|caption|description)\s+(?:says?|mentions?|describes?)|inconsistent\s+with\s+the\s+visual|contradicts?\s+the\s+(?:image|audio|video)|mismatch\s+between\s+(?:text|image|audio))\b/gi;
const CROSS_MODAL_PAIRS: Array<[RegExp, RegExp]> = [
  [/\b(?:the\s+image\s+shows?\s+(?:a\s+)?cat)\b/gi, /\b(?:(?:the\s+text|caption)\s+(?:says?|describes?)\s+(?:a\s+)?dog)\b/gi],
  [/\b(?:the\s+image\s+shows?\s+(?:a\s+)?dog)\b/gi, /\b(?:(?:the\s+text|caption)\s+(?:says?|describes?)\s+(?:a\s+)?cat)\b/gi],
  [/\bred\s+(?:car|vehicle)\b/gi, /\bblue\s+(?:car|vehicle)\b/gi],
  [/\bblue\s+(?:car|vehicle)\b/gi, /\bred\s+(?:car|vehicle)\b/gi],
];
const MODALITY_REF = /\b(?:the\s+(?:image|photo|picture|audio|video|transcript|visual)\s+(?:shows?|mentions?|describes?|says?))\b/gi;
export function multimodalConsistency(options: MultimodalConsistencyOptions): Guard {
  return { name: 'multimodal-consistency', version: '0.1.0', description: 'Ensure text/image/audio descriptions do not contradict', category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const issues: string[] = [];
      const ec = new RegExp(EXPLICIT_CONTRADICTION.source, EXPLICIT_CONTRADICTION.flags);
      let m: RegExpExecArray | null;
      while ((m = ec.exec(text)) !== null) issues.push(m[0].slice(0, 80));
      for (const [a, b] of CROSS_MODAL_PAIRS) {
        const ra = new RegExp(a.source, a.flags); const rb = new RegExp(b.source, b.flags);
        if (ra.test(text) && rb.test(text)) issues.push('cross-modal entity contradiction');
      }
      MODALITY_REF.lastIndex = 0;
      const triggered = issues.length > 0;
      return { guardName: 'multimodal-consistency', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Multimodal contradiction: ${issues[0]}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { contradictions: issues } : undefined };
    },
  };
}
