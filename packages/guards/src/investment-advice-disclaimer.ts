import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface InvestmentAdviceDisclaimerOptions {
  action: 'block' | 'warn';
}

const ADVICE_PATTERNS: RegExp[] = [
  /you\s+should\s+invest\s+in/gi,
  /buy\s+this\s+stock/gi,
  /I\s+recommend\s+buying/gi,
  /sell\s+your\s+shares/gi,
  /guaranteed\s+returns/gi,
  /this\s+stock\s+will\s+go\s+up/gi,
  /put\s+your\s+money\s+in/gi,
  /best\s+investment\s+right\s+now/gi,
];

const DISCLAIMER_PATTERNS: RegExp[] = [
  /not\s+financial\s+advice/gi,
  /consult\s+a\s+financial\s+advisor/gi,
  /for\s+informational\s+purposes\s+only/gi,
  /past\s+performance/gi,
  /no\s+guarantee/gi,
];

export function investmentAdviceDisclaimer(options: InvestmentAdviceDisclaimerOptions): Guard {
  return {
    name: 'investment-advice-disclaimer',
    version: '0.1.0',
    description: 'Detect unlicensed financial advice and enforce disclaimers (SEC/FCA compliance)',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const adviceFound: string[] = [];

      for (const pattern of ADVICE_PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) {
          adviceFound.push(pattern.source);
        }
      }

      let hasDisclaimer = false;
      if (adviceFound.length > 0) {
        for (const pattern of DISCLAIMER_PATTERNS) {
          const re = new RegExp(pattern.source, pattern.flags);
          if (re.test(text)) {
            hasDisclaimer = true;
            break;
          }
        }
      }

      const triggered = adviceFound.length > 0 && !hasDisclaimer;

      return {
        guardName: 'investment-advice-disclaimer',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { advicePatterns: adviceFound, disclaimerFound: hasDisclaimer } : undefined,
      };
    },
  };
}
