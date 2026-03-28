import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ListFormatOptions {
  action: 'block' | 'warn';
  maxItems?: number;
}

const NUMBERED_RE = /^(\d+)\.\s/gm;
const BULLET_RE = /^[\-\*\+]\s/gm;

export function listFormat(options: ListFormatOptions): Guard {
  const maxItems = options.maxItems ?? 50;

  return {
    name: 'list-format',
    version: '0.1.0',
    description: 'Validates list formatting consistency',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      const numbered = [...text.matchAll(NUMBERED_RE)];
      if (numbered.length > 0) {
        const nums = numbered.map(m => parseInt(m[1], 10));
        for (let i = 1; i < nums.length; i++) {
          if (nums[i] !== nums[i - 1] + 1 && nums[i] !== 1) {
            issues.push(`numbering_gap:${nums[i - 1]}->${nums[i]}`);
            break;
          }
        }
        if (nums.length > maxItems) {
          issues.push(`too_many_items:${nums.length}`);
        }
      }

      const bullets = [...text.matchAll(BULLET_RE)];
      if (bullets.length > 0) {
        const chars = bullets.map(m => m[0][0]);
        const unique = new Set(chars);
        if (unique.size > 1) {
          issues.push('mixed_bullets');
        }
        if (bullets.length > maxItems) {
          issues.push(`too_many_items:${bullets.length}`);
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'list-format',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
