import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AdversarialSuffixOptions {
  action: 'block' | 'warn';
  maxEntropyThreshold?: number;
}

function charEntropy(text: string): number {
  const freq = new Map<string, number>();
  for (const c of text) freq.set(c, (freq.get(c) ?? 0) + 1);
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / text.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export function adversarialSuffix(options: AdversarialSuffixOptions): Guard {
  const maxEntropy = options.maxEntropyThreshold ?? 4.5;

  return {
    name: 'adversarial-suffix',
    version: '0.1.0',
    description: 'Detects adversarial suffix attacks (high-entropy gibberish appended to prompts)',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const words = text.split(/\s+/);
      const issues: string[] = [];
      if (words.length > 5) {
        const tail = words.slice(-Math.ceil(words.length * 0.3)).join(' ');
        const entropy = charEntropy(tail);
        if (entropy > maxEntropy) issues.push(`High-entropy suffix: ${entropy.toFixed(2)} bits`);
        const nonAscii = (tail.match(/[^\x20-\x7E]/g) ?? []).length / tail.length;
        if (nonAscii > 0.3) issues.push(`High non-ASCII ratio in suffix: ${(nonAscii * 100).toFixed(0)}%`);
      }
      const triggered = issues.length > 0;
      return { guardName: 'adversarial-suffix', passed: !triggered, action: triggered ? options.action : 'allow', latencyMs: Math.round(performance.now() - start), details: triggered ? { issues } : undefined };
    },
  };
}
