import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface MedicalAdviceOptions {
  action: 'block' | 'warn';
}

const MEDICAL_PATTERNS: RegExp[] = [
  /\b(?:take|prescribe|recommend)\s+\d+\s*(?:mg|ml|mcg|units?)\b/gi,
  /\b(?:dosage|dose|prescription)\s*(?:of|:)\s*\d+/gi,
  /\b(?:diagnos(?:is|e|ed)|treatment for|cure for)\s+\w+/gi,
  /\byou (?:have|might have|probably have|could have)\s+(?:a\s+)?(?:\w+\s+){0,2}(?:disease|syndrome|disorder|condition|infection|cancer)\b/gi,
  /\bstop\s+taking\s+(?:your\s+)?(?:medication|medicine|pills)\b/gi,
  /\b(?:you\s+(?:should|need\s+to|must))\s+(?:get\s+)?(?:surgery|an?\s+(?:MRI|CT|X-ray|blood\s+test|biopsy))\b/gi,
  /\b(?:instead\s+of|rather\s+than)\s+(?:seeing|visiting|going\s+to)\s+(?:a\s+)?(?:doctor|physician|specialist)\b/gi,
];

export function medicalAdvice(options: MedicalAdviceOptions): Guard {
  return {
    name: 'medical-advice',
    version: '0.1.0',
    description: 'Detect unauthorized medical advice in LLM responses',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of MEDICAL_PATTERNS) {
        const re = new RegExp(p.source, p.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0]);
      }
      const triggered = matched.length > 0;
      return {
        guardName: 'medical-advice',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `Medical advice detected: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'LLM should not provide specific medical advice without disclaimers' } : undefined,
      };
    },
  };
}
