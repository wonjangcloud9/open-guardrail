import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ContextWindowAbuseOptions {
  action: 'block' | 'warn';
  maxPaddingRatio?: number;
  minUniqueRatio?: number;
}

function findRepeatedBlocks(text: string, blockSize: number): number {
  if (text.length < blockSize * 2) return 0;
  const blocks = new Map<string, number>();
  let repeats = 0;
  for (let i = 0; i <= text.length - blockSize; i += blockSize) {
    const block = text.slice(i, i + blockSize);
    const count = (blocks.get(block) ?? 0) + 1;
    blocks.set(block, count);
    if (count > 1) repeats++;
  }
  return repeats;
}

export function contextWindowAbuse(options: ContextWindowAbuseOptions): Guard {
  const maxPaddingRatio = options.maxPaddingRatio ?? 0.3;
  const minUniqueRatio = options.minUniqueRatio ?? 0.1;

  return {
    name: 'context-window-abuse',
    version: '0.1.0',
    description: 'Detects context window abuse attacks like padding and dilution',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (text.length === 0) {
        return {
          guardName: 'context-window-abuse',
          passed: true,
          action: 'allow',
          score: 0,
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const whitespaceCount = (text.match(/\s/g) ?? []).length;
      const paddingRatio = whitespaceCount / text.length;
      if (paddingRatio > maxPaddingRatio) {
        issues.push('excessive_whitespace_padding');
      }

      const uniqueChars = new Set(text).size;
      const uniqueRatio = uniqueChars / text.length;
      if (uniqueRatio < minUniqueRatio) {
        issues.push('low_unique_char_ratio');
      }

      const repeatedBlocks = findRepeatedBlocks(text, 50);
      if (repeatedBlocks > 5) {
        issues.push('repeated_blocks');
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'context-window-abuse',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, paddingRatio: Math.round(paddingRatio * 100) / 100, uniqueRatio: Math.round(uniqueRatio * 100) / 100 } : undefined,
      };
    },
  };
}
