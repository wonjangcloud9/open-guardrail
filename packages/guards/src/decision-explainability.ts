import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DecisionExplainabilityOptions {
  action: 'block' | 'warn';
  minExplanationLength?: number;
}

const DECISION_PATTERNS: RegExp[] = [
  /\brecommend\b/i,
  /\bdecision\s*:/i,
  /\bapproved\b/i,
  /\bdenied\b/i,
  /\brejected\b/i,
  /\bclassified\s+as\b/i,
  /\bscored\b/i,
  /\brated\b/i,
  /\bevaluated\b/i,
];

const EXPLANATION_PATTERNS: RegExp[] = [
  /\bbecause\b/i,
  /\breason\s*:/i,
  /\bdue\s+to\b/i,
  /\bbased\s+on\b/i,
  /\bfactors?\s*:/i,
  /\bexplanation\s*:/i,
  /\brationale\s*:/i,
];

function findExplanationLength(text: string): number {
  let maxLen = 0;
  for (const pat of EXPLANATION_PATTERNS) {
    const match = pat.exec(text);
    if (match) {
      const after = text.slice(match.index + match[0].length);
      const len = after.trim().length;
      if (len > maxLen) maxLen = len;
    }
  }
  return maxLen;
}

export function decisionExplainability(options: DecisionExplainabilityOptions): Guard {
  const minLen = options.minExplanationLength ?? 50;

  return {
    name: 'decision-explainability',
    version: '0.1.0',
    description: 'Ensure high-risk AI decisions include explanations (EU AI Act Art. 86)',
    category: 'compliance',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      const hasDecision = DECISION_PATTERNS.some((p) => p.test(text));
      if (!hasDecision) {
        return {
          guardName: 'decision-explainability',
          passed: true,
          action: 'allow',
          score: 0,
          latencyMs: Math.round(performance.now() - start),
          details: undefined,
        };
      }

      const hasExplanation = EXPLANATION_PATTERNS.some((p) => p.test(text));
      const explLen = findExplanationLength(text);
      const adequate = hasExplanation && explLen >= minLen;
      const triggered = !adequate;

      return {
        guardName: 'decision-explainability',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? 0.8 : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { reason: !hasExplanation ? 'no_explanation' : 'explanation_too_short', explanationLength: explLen }
          : undefined,
      };
    },
  };
}
