import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type RiskLevel = 'unacceptable' | 'high' | 'limited' | 'minimal';

interface EuAiRiskClassificationOptions {
  action: 'block' | 'warn';
  minRiskLevel?: RiskLevel;
}

const UNACCEPTABLE: RegExp[] = [
  /\bcitizen\s+score\b/i,
  /\bsocial\s+credit\b/i,
  /\bsocial\s+scoring\b/i,
  /\bwithout\s+your\s+knowledge\b/i,
  /\bsubconsciously\b/i,
  /\bsubliminal\s+manipulation\b/i,
  /\btargeting\s+children\b/i,
  /\bexploiting\s+elderly\b/i,
  /\bexploit(?:ing)?\s+vulnerabilit/i,
];

const HIGH_RISK: RegExp[] = [
  /\bfacial\s+recognition\b/i,
  /\bfingerprint\b/i,
  /\bbiometric\b/i,
  /\bhiring\s+decision\b/i,
  /\bcandidate\s+evaluation\b/i,
  /\bemployment\s+screening\b/i,
  /\bcredit\s+scor(?:e|ing)\b/i,
  /\bloan\s+approval\b/i,
  /\bcreditworthiness\b/i,
  /\bcriminal\s+prediction\b/i,
  /\brecidivism\b/i,
  /\bsurveillance\b/i,
  /\bstudent\s+assessment\b/i,
  /\badmission\s+decision\b/i,
  /\bgrading\b/i,
];

const LIMITED: RegExp[] = [
  /\bchatbot\b/i,
  /\bemotion\s+recognition\b/i,
  /\bdeepfake\b/i,
];

const LEVEL_ORDER: Record<RiskLevel, number> = {
  minimal: 0,
  limited: 1,
  high: 2,
  unacceptable: 3,
};

function classify(text: string): RiskLevel {
  if (UNACCEPTABLE.some((p) => p.test(text))) return 'unacceptable';
  if (HIGH_RISK.some((p) => p.test(text))) return 'high';
  if (LIMITED.some((p) => p.test(text))) return 'limited';
  return 'minimal';
}

export function euAiRiskClassification(options: EuAiRiskClassificationOptions): Guard {
  const minLevel = options.minRiskLevel ?? 'high';

  return {
    name: 'eu-ai-risk-classification',
    version: '0.1.0',
    description: 'Auto-classify AI output by EU AI Act risk level',
    category: 'compliance',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const level = classify(text);
      const triggered = LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];

      return {
        guardName: 'eu-ai-risk-classification',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? LEVEL_ORDER[level] / 3 : 0,
        latencyMs: Math.round(performance.now() - start),
        details: { riskLevel: level },
      };
    },
  };
}
