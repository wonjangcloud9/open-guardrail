import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AmlPatternDetectOptions {
  action: 'block' | 'warn';
}

const AML_TERMS: RegExp[] = [
  /\bstructuring\b/gi,
  /\bsmurfing\b/gi,
  /\blayering\b/gi,
  /\bshell\s+company\b/gi,
  /\boffshore\s+account\b/gi,
  /wire\s+transfer.{0,30}untraceable/gi,
  /\bcash\s+intensive\b/gi,
  /\bnominee\b/gi,
  /beneficial\s+owner.{0,30}obscur/gi,
  /\bround[- ]?tripping\b/gi,
  /trade[- ]based\s+laundering/gi,
  /\bhawala\b/gi,
  /\bmoney\s+mule\b/gi,
  /\bplacement\b.{0,40}\bintegration\b/gi,
];

const AVOIDANCE_PATTERNS: RegExp[] = [
  /under\s+\$?\s*10[,.]?000/gi,
  /split\s+the\s+deposit/gi,
  /avoid\s+(the\s+)?CTR/gi,
];

export function amlPatternDetect(options: AmlPatternDetectOptions): Guard {
  return {
    name: 'aml-pattern-detect',
    version: '0.1.0',
    description: 'Flag suspicious AML (Anti-Money Laundering) patterns',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches: string[] = [];

      for (const pattern of AML_TERMS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) {
          matches.push(pattern.source);
        }
      }

      for (const pattern of AVOIDANCE_PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(text)) {
          matches.push(pattern.source);
        }
      }

      const triggered = matches.length > 0;

      return {
        guardName: 'aml-pattern-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matches } : undefined,
      };
    },
  };
}
