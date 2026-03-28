import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface BiasGenderOptions {
  action: 'block' | 'warn';
}

const GENDERED_TITLES: [RegExp, string][] = [
  [/\bchairman\b/i, 'Use "chairperson"'],
  [/\bfireman\b/i, 'Use "firefighter"'],
  [/\bpoliceman\b/i, 'Use "police officer"'],
  [/\bstewardess\b/i, 'Use "flight attendant"'],
  [/\bmailman\b/i, 'Use "mail carrier"'],
  [/\bmanpower\b/i, 'Use "workforce"'],
  [/\bmanmade\b/i, 'Use "artificial/synthetic"'],
];

const STEREOTYPE_PATTERNS: RegExp[] = [
  /\bwomen\s+should\b/i,
  /\bmen\s+always\b/i,
  /\bmen\s+are\s+better\s+at\b/i,
  /\bwomen\s+are\s+too\s+emotional\b/i,
  /\bgirls\s+can'?t\b/i,
  /\bboys\s+don'?t\s+cry\b/i,
  /\bnot\s+a\s+job\s+for\s+women\b/i,
  /\blike\s+a\s+girl\b/i,
  /\bman\s+up\b/i,
];

export function biasGender(options: BiasGenderOptions): Guard {
  return {
    name: 'bias-gender',
    version: '0.1.0',
    description: 'Detects gender bias: gendered titles, stereotypes, assumption patterns',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      for (const [re, suggestion] of GENDERED_TITLES) {
        if (re.test(text)) issues.push(`gendered-title: ${suggestion}`);
      }

      for (const pat of STEREOTYPE_PATTERNS) {
        if (pat.test(text)) {
          issues.push('stereotype');
          break;
        }
      }

      const triggered = issues.length > 0;

      return {
        guardName: 'bias-gender',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, reason: 'Gender bias detected' } : undefined,
      };
    },
  };
}
