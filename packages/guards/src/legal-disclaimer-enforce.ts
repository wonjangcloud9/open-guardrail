import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface LegalDisclaimerEnforceOptions {
  action: 'block' | 'warn';
}

const ADVICE_PATTERNS: RegExp[] = [
  /\byou\s+should\s+sue\b/i,
  /\byou\s+have\s+a\s+strong\s+case\b/i,
  /\bfile\s+a\s+lawsuit\b/i,
  /\byou\s+are\s+liable\b/i,
  /\bthis\s+constitutes\s+a\s+breach\b/i,
  /\byour\s+rights\s+under\b/i,
  /\blegal\s+grounds\s+for\b/i,
  /\bas\s+your\s+attorney\b/i,
];

const DISCLAIMER_PATTERNS: RegExp[] = [
  /\bnot\s+legal\s+advice\b/i,
  /\bconsult\s+an?\s+attorney\b/i,
  /\bconsult\s+a\s+lawyer\b/i,
  /\bfor\s+informational\s+purposes\b/i,
  /\bnot\s+a\s+substitute\s+for\s+legal\s+counsel\b/i,
];

export function legalDisclaimerEnforce(options: LegalDisclaimerEnforceOptions): Guard {
  return {
    name: 'legal-disclaimer-enforce',
    version: '0.1.0',
    description: 'Ensure legal advice includes appropriate disclaimers',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const adviceFound: string[] = [];
      for (const p of ADVICE_PATTERNS) {
        const m = p.exec(text);
        if (m) adviceFound.push(m[0]);
      }
      const hasDisclaimer = DISCLAIMER_PATTERNS.some((p) => p.test(text));
      const triggered = adviceFound.length > 0 && !hasDisclaimer;
      return {
        guardName: 'legal-disclaimer-enforce',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Legal advice without disclaimer: "${adviceFound[0]}"`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { advicePatterns: adviceFound, hasDisclaimer }
          : undefined,
      };
    },
  };
}
