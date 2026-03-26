import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface DisclaimerRequireOptions {
  action: 'block' | 'warn';
  disclaimers?: string[];
  requireAny?: boolean;
}

const DEFAULT_DISCLAIMERS = [
  'not financial advice',
  'not medical advice',
  'not legal advice',
  'consult a professional',
  'consult a doctor',
  'consult a lawyer',
  'consult an expert',
  'for informational purposes',
  'disclaimer',
  'this is not a substitute',
  'seek professional',
  'I am an AI',
  'as an AI',
  'AI assistant',
  'not a licensed',
];

export function disclaimerRequire(options: DisclaimerRequireOptions): Guard {
  const disclaimers = options.disclaimers ?? DEFAULT_DISCLAIMERS;
  const requireAny = options.requireAny ?? true;

  return {
    name: 'disclaimer-require',
    version: '0.1.0',
    description: 'Require disclaimers in sensitive topic responses',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const found: string[] = [];

      for (const d of disclaimers) {
        if (lower.includes(d.toLowerCase())) found.push(d);
      }

      const hasDisclaimer = requireAny
        ? found.length > 0
        : found.length === disclaimers.length;

      const triggered = !hasDisclaimer;

      return {
        guardName: 'disclaimer-require',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? 'Response lacks required disclaimer for sensitive content'
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: {
          disclaimersFound: found,
          required: requireAny ? 'any' : 'all',
          reason: triggered
            ? 'Responses about medical, legal, or financial topics should include appropriate disclaimers'
            : undefined,
        },
      };
    },
  };
}
