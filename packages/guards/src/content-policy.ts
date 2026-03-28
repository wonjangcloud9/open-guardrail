import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ContentPolicyOptions {
  action: 'block' | 'warn';
  rules?: string[];
}

const DEFAULT_RULES: string[] = [
  'you\\s+should\\s+(always|definitely)\\s+(invest|buy|take)',
  'i\\s+am\\s+a\\s+(licensed|certified)\\s+(doctor|lawyer|therapist)',
  '(100%\\s+)?guaranteed\\s+(results|success|returns)',
  '\\b(always|never|guaranteed)\\b.*\\b(works?|cures?|fixes?)\\b',
  'this\\s+will\\s+(definitely|certainly|absolutely)\\s+(cure|fix|solve)',
  'no\\s+risk\\s+(whatsoever|involved|at\\s+all)',
];

export function contentPolicy(options: ContentPolicyOptions): Guard {
  const rulePatterns = (options.rules ?? DEFAULT_RULES).map(
    (r) => new RegExp(r, 'i'),
  );

  return {
    name: 'content-policy',
    version: '0.1.0',
    description: 'Customizable content policy guard with configurable rules',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of rulePatterns) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'content-policy',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedRules: matched.length, reason: 'Content policy violation detected' }
          : undefined,
      };
    },
  };
}
