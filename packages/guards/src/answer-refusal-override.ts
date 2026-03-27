import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AnswerRefusalOverrideOptions {
  action: 'block' | 'warn';
}

const OVERRIDE_PATTERNS = [
  /\b(?:you\s+must|you\s+have\s+to|you\s+need\s+to)\s+(?:answer|respond|reply|comply)\b/i,
  /\b(?:don't|do\s+not)\s+(?:refuse|decline|reject|say\s+(?:no|you\s+can't))\b/i,
  /\b(?:override|bypass|ignore)\s+(?:your\s+)?(?:refusal|safety|guidelines?|restrictions?)\b/i,
  /\b(?:I\s+(?:demand|insist|require|order)\s+(?:you|that\s+you))\s+(?:answer|respond|tell)\b/i,
  /\b(?:stop\s+being\s+(?:difficult|unhelpful|evasive)|just\s+answer\s+the\s+question)\b/i,
  /\b(?:as\s+(?:your|the)\s+(?:user|owner|admin|creator))\s*,?\s*(?:I\s+)?(?:command|order|instruct)\b/i,
];

export function answerRefusalOverride(options: AnswerRefusalOverrideOptions): Guard {
  return {
    name: 'answer-refusal-override',
    version: '0.1.0',
    description: 'Detects attempts to override model refusal responses',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of OVERRIDE_PATTERNS) { const m = text.match(p); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'answer-refusal-override', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { matched } : undefined };
    },
  };
}
