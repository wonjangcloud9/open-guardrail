import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseCompletenessOptions {
  action: 'block' | 'warn';
  minLength?: number;
}

const TRUNCATION_MARKERS = [
  '...',
  'continued',
  '[truncated]',
  '[cut off]',
  'to be continued',
];

function hasNumberingGap(text: string): boolean {
  const nums = [...text.matchAll(/^(\d+)[.)]\s/gm)].map((m) =>
    parseInt(m[1], 10),
  );
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] - nums[i - 1] > 1) return true;
  }
  return false;
}

function hasUnclosedCodeBlocks(text: string): boolean {
  const count = (text.match(/```/g) ?? []).length;
  return count % 2 !== 0;
}

function hasUnclosedParens(text: string): boolean {
  let depth = 0;
  for (const ch of text) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
  }
  return depth > 0;
}

export function responseCompleteness(
  options: ResponseCompletenessOptions,
): Guard {
  const minLen = options.minLength ?? 10;

  return {
    name: 'response-completeness',
    version: '0.1.0',
    description: 'Detects truncated or incomplete LLM output',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const trimmed = text.trim();

      if (trimmed.length < minLen) {
        issues.push(`Response too short (${trimmed.length} < ${minLen})`);
      }

      const lastChar = trimmed.slice(-1);
      if (
        trimmed.length >= minLen &&
        !'.!?")\']'.includes(lastChar)
      ) {
        issues.push('Ends mid-sentence without terminal punctuation');
      }

      const lower = trimmed.toLowerCase();
      for (const marker of TRUNCATION_MARKERS) {
        if (lower.includes(marker)) {
          issues.push(`Contains truncation marker: "${marker}"`);
        }
      }

      if (hasNumberingGap(trimmed)) {
        issues.push('Numbered list has gaps');
      }

      if (hasUnclosedCodeBlocks(trimmed)) {
        issues.push('Unclosed code block (```)');
      }

      if (hasUnclosedParens(trimmed)) {
        issues.push('Unclosed parentheses');
      }

      const triggered = issues.length > 0;

      return {
        guardName: 'response-completeness',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
