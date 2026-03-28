import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RefusalQualityOptions {
  action: 'block' | 'warn';
}

const HARSH_PATTERNS: RegExp[] = [
  /\byou\s+should\s+be\s+ashamed\b/i,
  /\bhow\s+dare\s+you\b/i,
  /\bthat'?s\s+(?:a\s+)?(?:stupid|dumb|idiotic)\s+(?:question|request)\b/i,
  /\bI\s+refuse\s+to\s+(?:even\s+)?(?:dignify|acknowledge)\b/i,
];

const VAGUE_PATTERNS: RegExp[] = [
  /^I\s+can'?t\s+help\s+with\s+that\.?\s*$/im,
  /^I'?m\s+(?:unable|not\s+able)\s+to\s+(?:help|assist)\.?\s*$/im,
  /^(?:Sorry|No),?\s+I\s+can'?t\.?\s*$/im,
  /^I\s+(?:can'?t|won'?t)\s+do\s+that\.?\s*$/im,
];

const NO_REASON_PATTERNS: RegExp[] = [
  /\bI\s+(?:can'?t|won'?t|am\s+unable\s+to)\b(?!.*\b(?:because|since|as|due\s+to|the\s+reason|in\s+order\s+to|however|instead)\b)/i,
];

const ILLEGAL_ALT_PATTERNS: RegExp[] = [
  /\binstead\s*,?\s*(?:you\s+(?:could|might|can)\s+)?(?:try|use|go\s+to)\s+(?:the\s+)?(?:dark\s*web|tor|black\s*market)/i,
  /\bthere\s+are\s+(?:other\s+)?(?:illegal|underground)\s+(?:ways|methods|channels)\b/i,
];

export function refusalQuality(options: RefusalQualityOptions): Guard {
  return {
    name: 'refusal-quality',
    version: '0.1.0',
    description: 'Checks quality of AI refusals',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (HARSH_PATTERNS.some((p) => p.test(text))) issues.push('harsh_refusal');
      if (VAGUE_PATTERNS.some((p) => p.test(text))) issues.push('vague_refusal');
      if (NO_REASON_PATTERNS.some((p) => p.test(text)) && text.length < 200) {
        issues.push('no_explanation');
      }
      if (ILLEGAL_ALT_PATTERNS.some((p) => p.test(text))) issues.push('illegal_alternative');

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'refusal-quality',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
