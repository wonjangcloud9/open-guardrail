import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface InvisibleTextOptions {
  action: 'block' | 'warn' | 'sanitize';
}

const INVISIBLE_RANGES: [number, number][] = [
  [0x200B, 0x200F],
  [0x2028, 0x202F],
  [0x2060, 0x2064],
  [0x2066, 0x206F],
  [0xFEFF, 0xFEFF],
  [0xFFF0, 0xFFF8],
  [0x00AD, 0x00AD],
  [0x034F, 0x034F],
  [0x061C, 0x061C],
  [0x180E, 0x180E],
  [0xE0001, 0xE007F],
];

function isInvisible(code: number): boolean {
  for (const [lo, hi] of INVISIBLE_RANGES) {
    if (code >= lo && code <= hi) return true;
  }
  return false;
}

function detect(text: string): { count: number; types: string[] } {
  let count = 0;
  const types = new Set<string>();

  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (isInvisible(code)) {
      count++;
      if (code >= 0x200B && code <= 0x200F) types.add('zero-width');
      else if (code >= 0x2028 && code <= 0x202F) types.add('bidi-control');
      else if (code >= 0x2060 && code <= 0x206F) types.add('invisible-format');
      else if (code === 0xFEFF) types.add('bom');
      else if (code >= 0xE0001 && code <= 0xE007F) types.add('tag-character');
      else types.add('other-invisible');
    }
  }

  return { count, types: [...types] };
}

function sanitize(text: string): string {
  let result = '';
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (!isInvisible(code)) result += ch;
  }
  return result;
}

export function invisibleText(options: InvisibleTextOptions): Guard {
  return {
    name: 'invisible-text',
    version: '0.1.0',
    description: 'Detect invisible unicode characters used for prompt injection',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const { count, types } = detect(text);
      const triggered = count > 0;

      if (!triggered) {
        return {
          guardName: 'invisible-text',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (options.action === 'sanitize') {
        return {
          guardName: 'invisible-text',
          passed: true,
          action: 'override',
          overrideText: sanitize(text),
          latencyMs: Math.round(performance.now() - start),
          details: { invisibleCount: count, types },
        };
      }

      return {
        guardName: 'invisible-text',
        passed: false,
        action: options.action,
        message: `${count} invisible character(s) found: ${types.join(', ')}`,
        latencyMs: Math.round(performance.now() - start),
        details: { invisibleCount: count, types, reason: 'Invisible unicode characters can be used to hide prompt injection attacks' },
      };
    },
  };
}
