import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AccessibilityTextOptions {
  action: 'block' | 'warn';
}

function checkAccessibility(text: string): string[] {
  const issues: string[] = [];

  const capsBlocks = text.match(/\b[A-Z][A-Z\s]{19,}[A-Z]\b/g);
  if (capsBlocks && capsBlocks.some(b => b.replace(/\s/g, '').length > 20)) {
    issues.push('all_caps_block');
  }

  const specialRuns = text.match(/[!@#$%^&*~+=<>]{5,}/g);
  if (specialRuns && specialRuns.length > 0) {
    issues.push('excessive_special_chars');
  }

  if (/!\[(?:\s*)\]\(/.test(text)) {
    issues.push('missing_alt_text');
  }

  const zalgo = /[\u0300-\u036f]{3,}/;
  if (zalgo.test(text)) {
    issues.push('zalgo_text');
  }

  const repeatedPunct = /([!?.])\1{4,}/;
  if (repeatedPunct.test(text)) {
    issues.push('repeated_punctuation');
  }

  const emojiRun = /(?:[\u{1F600}-\u{1F64F}][\u{FE00}-\u{FE0F}]?){6,}/u;
  if (emojiRun.test(text)) {
    issues.push('emoji_overload');
  }

  return issues;
}

export function accessibilityText(options: AccessibilityTextOptions): Guard {
  return {
    name: 'accessibility-text',
    version: '0.1.0',
    description: 'Checks text for accessibility issues',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues = checkAccessibility(text);

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'accessibility-text',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
