import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PiiMaskConsistentOptions {
  action: 'block' | 'warn';
}

const MASK_PATTERN = /\[([A-Z_]+)\]/g;
const PARTIAL_MASK = /\b\w+\*{2,}\w*\b|\b\w*\*{2,}\w+\b/g;
const LENGTH_REVEAL = /\[([A-Z_]+):?\d+\]/g;

export function piiMaskConsistent(options: PiiMaskConsistentOptions): Guard {
  return {
    name: 'pii-mask-consistent',
    version: '0.1.0',
    description: 'Ensures consistent PII masking across a response',
    category: 'privacy',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      // Check for partial masking patterns
      const partials = text.match(PARTIAL_MASK);
      if (partials && partials.length > 0) {
        issues.push(`partial_masks_found:${partials.length}`);
      }

      // Check for length-revealing masks
      const lengthReveals = text.match(LENGTH_REVEAL);
      if (lengthReveals && lengthReveals.length > 0) {
        issues.push(`length_revealing_masks:${lengthReveals.length}`);
      }

      // Check for inconsistent mask labels
      const masks: Record<string, number> = {};
      let m: RegExpExecArray | null;
      const re = new RegExp(MASK_PATTERN.source, 'g');
      while ((m = re.exec(text)) !== null) {
        masks[m[1]] = (masks[m[1]] || 0) + 1;
      }

      // Multiple different mask types could indicate inconsistency
      const maskTypes = Object.keys(masks);
      const similar = maskTypes.filter((a) =>
        maskTypes.some((b) => a !== b && (a.includes(b) || b.includes(a))),
      );
      if (similar.length > 0) {
        issues.push(`overlapping_mask_types:${similar.join(',')}`);
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'pii-mask-consistent',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
