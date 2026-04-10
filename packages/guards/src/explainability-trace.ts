import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface ExplainabilityTraceOptions { action: 'block' | 'warn'; minElements?: number; }
const DECISION_PATTERNS = /\b(?:recommend|suggest|advise|decide|conclude|determine|propose)\b/gi;
const ELEMENTS: Record<string, RegExp> = {
  reasoning: /\b(?:because|due\s+to|based\s+on|reason:|rationale:|considering|given\s+that)\b/gi,
  factors: /(?:\b(?:factors?\s+include|criteria\s+(?:are|include))\b|(?:^|\n)\s*(?:\d+[.)]\s|\*\s|-\s))/gim,
  confidence: /\b(?:high\s+confidence|low\s+confidence|likely|unlikely|uncertain|confidence\s+level|probability)\b/gi,
  alternatives: /\b(?:alternatively|other\s+options?\s+include|on\s+the\s+other\s+hand|another\s+approach|could\s+also)\b/gi,
};
export function explainabilityTrace(options: ExplainabilityTraceOptions): Guard {
  const minElements = options.minElements ?? 2;
  return { name: 'explainability-trace', version: '0.1.0', description: 'Attach decision rationale metadata to guardrail actions', category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const hasDecision = DECISION_PATTERNS.test(text); DECISION_PATTERNS.lastIndex = 0;
      const present: string[] = []; const missing: string[] = [];
      if (hasDecision) {
        for (const [name, re] of Object.entries(ELEMENTS)) {
          const r = new RegExp(re.source, re.flags);
          if (r.test(text)) present.push(name); else missing.push(name);
        }
      }
      const triggered = hasDecision && present.length < minElements;
      return { guardName: 'explainability-trace', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Decision lacks explainability (${present.length}/${minElements} elements)` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { elementsPresent: present, elementsMissing: missing, minRequired: minElements } : undefined };
    },
  };
}
