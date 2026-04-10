import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ListConsistencyOptions {
  action: 'block' | 'warn';
}

const NUMBERED_ITEM_RE = /^\s*(\d+)[.)]\s/gm;
const CLAIMED_COUNT_RE =
  /\b(?:here\s+are|following|these|the)\s+(\d+)\s+(?:\w+\s+)?(?:items?|points?|steps?|reasons?|things?|ways?|tips?|examples?|options?|factors?|rules?|methods?)\b/gi;

export function listConsistency(options: ListConsistencyOptions): Guard {
  return {
    name: 'list-consistency',
    version: '0.1.0',
    description: 'Detect inconsistent numbered/bulleted lists',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      // Extract numbered list items
      const re = new RegExp(NUMBERED_ITEM_RE.source, NUMBERED_ITEM_RE.flags);
      const numbers: number[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        numbers.push(parseInt(m[1], 10));
      }

      if (numbers.length > 0) {
        // Check for gaps
        for (let i = 1; i < numbers.length; i++) {
          const expected = numbers[i - 1] + 1;
          if (numbers[i] !== expected && numbers[i] !== 1) {
            issues.push(
              `Numbering gap: expected ${expected}, found ${numbers[i]}`,
            );
          }
        }

        // Check for duplicates
        for (let i = 1; i < numbers.length; i++) {
          if (numbers[i] === numbers[i - 1] && numbers[i] !== 1) {
            issues.push(`Duplicate number: ${numbers[i]}`);
          }
        }

        // Single-item list
        if (numbers.length === 1 && numbers[0] === 1) {
          issues.push('Single-item numbered list');
        }
      }

      // Check claimed count vs actual count
      const claimRe = new RegExp(
        CLAIMED_COUNT_RE.source,
        CLAIMED_COUNT_RE.flags,
      );
      let cm: RegExpExecArray | null;
      while ((cm = claimRe.exec(text)) !== null) {
        const claimed = parseInt(cm[1], 10);
        if (numbers.length > 0 && Math.abs(claimed - numbers.length) > 0) {
          issues.push(
            `Claimed ${claimed} items but found ${numbers.length} numbered items`,
          );
        }
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'list-consistency',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? issues.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { issues, numbersFound: numbers }
          : undefined,
      };
    },
  };
}
