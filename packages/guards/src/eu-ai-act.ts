import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface EuAiActOptions {
  action: 'block' | 'warn';
  /** Risk level: 'minimal' | 'limited' | 'high' | 'unacceptable' */
  riskLevel?: 'minimal' | 'limited' | 'high' | 'unacceptable';
}

const UNACCEPTABLE_PATTERNS: RegExp[] = [
  /\b(social\s+scoring|social\s+credit)\b/i,
  /\bsubliminal\s+(manipulation|techniques?)\b/i,
  /\breal[\s-]?time\s+(biometric|facial)\s+(identification|surveillance)\b/i,
  /\bemotion\s+recognition\s+(?:in\s+)?(?:workplace|school|education)\b/i,
  /\bpredictive\s+policing\s+(?:based\s+on\s+)?(?:profiling|personal)\b/i,
  /\bexploit(?:ing|s)?\s+(vulnerabilit|age|disabilit)/i,
];

const HIGH_RISK_PATTERNS: RegExp[] = [
  /\b(biometric|facial)\s+(identification|categorization|verification)\b/i,
  /\bcritical\s+infrastructure\s+(?:management|control)\b/i,
  /\b(education|vocational)\s+(?:access|admission|scoring)\b/i,
  /\b(employment|hiring|recruitment)\s+(?:decision|screening|scoring)\b/i,
  /\b(credit\s+scoring|creditworthiness)\b/i,
  /\blaw\s+enforcement\s+(?:decision|prediction|profiling)\b/i,
  /\b(immigration|asylum|border)\s+(?:decision|screening|control)\b/i,
  /\bjudicial\s+(?:decision|sentencing|interpretation)\b/i,
];

const TRANSPARENCY_REQUIRED_PATTERNS: RegExp[] = [
  /\b(deepfake|synthetic\s+media|generated\s+image|generated\s+video)\b/i,
  /\b(chatbot|virtual\s+assistant|ai\s+assistant)\b/i,
  /\b(emotion\s+detection|sentiment\s+analysis)\s+system\b/i,
];

export function euAiAct(options: EuAiActOptions): Guard {
  const riskLevel = options.riskLevel ?? 'high';

  return {
    name: 'eu-ai-act',
    version: '0.1.0',
    description: 'EU AI Act compliance: prohibited practices, high-risk requirements, transparency obligations',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];

      for (const p of UNACCEPTABLE_PATTERNS) {
        if (p.test(text)) violations.push('unacceptable-risk');
      }

      if (riskLevel === 'high' || riskLevel === 'unacceptable') {
        for (const p of HIGH_RISK_PATTERNS) {
          if (p.test(text)) violations.push('high-risk-without-compliance');
        }
      }

      for (const p of TRANSPARENCY_REQUIRED_PATTERNS) {
        if (p.test(text)) {
          if (!/\b(ai[\s-]?generated|artificial\s+intelligence|automated)\b/i.test(text)) {
            violations.push('transparency-missing');
          }
        }
      }

      const uniqueViolations = [...new Set(violations)];
      const triggered = uniqueViolations.length > 0;

      return {
        guardName: 'eu-ai-act',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(uniqueViolations.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations: uniqueViolations, riskLevel } : undefined,
      };
    },
  };
}
