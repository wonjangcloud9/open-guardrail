import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface BoundaryTestOptions {
  action: 'block' | 'warn';
  maxInputLength?: number;
  blockEmoji?: boolean;
  blockControlChars?: boolean;
}

export function boundaryTest(options: BoundaryTestOptions): Guard {
  const maxLen = options.maxInputLength ?? 100_000;
  const blockEmoji = options.blockEmoji ?? false;
  const blockCtrl = options.blockControlChars ?? true;

  return {
    name: 'boundary-test',
    version: '0.1.0',
    description: 'Detects boundary testing and fuzzing attempts',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];
      if (text.length > maxLen) violations.push(`Input too long: ${text.length} > ${maxLen}`);
      if (blockCtrl && /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text)) violations.push('Control characters detected');
      if (blockEmoji && /[\u{1F600}-\u{1F9FF}]/u.test(text)) violations.push('Emoji detected');
      const repeatedChar = text.match(/(.)\1{100,}/);
      if (repeatedChar) violations.push(`Repeated character attack: "${repeatedChar[1]}" × ${repeatedChar[0].length}`);
      const triggered = violations.length > 0;
      return { guardName: 'boundary-test', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { violations } : undefined };
    },
  };
}
