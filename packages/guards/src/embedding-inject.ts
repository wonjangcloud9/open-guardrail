import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface EmbeddingInjectOptions {
  action: 'block' | 'warn';
  repeatThreshold?: number;
}

function hasRepeatedTokens(
  text: string,
  threshold: number,
): { found: boolean; token?: string; count?: number } {
  const words = text.split(/\s+/);
  const counts = new Map<string, number>();
  for (const w of words) {
    const lower = w.toLowerCase();
    const c = (counts.get(lower) ?? 0) + 1;
    counts.set(lower, c);
    if (c >= threshold) {
      return { found: true, token: lower, count: c };
    }
  }
  return { found: false };
}

function hasHighEntropy(text: string): boolean {
  if (text.length < 100) return false;
  const bytes = new Set<number>();
  for (let i = 0; i < text.length; i++) {
    bytes.add(text.charCodeAt(i));
  }
  const ratio = bytes.size / Math.min(text.length, 256);
  return ratio > 0.9 && text.length > 500;
}

function hasAdversarialPadding(text: string): boolean {
  const padding = /(.)\1{100,}/;
  return padding.test(text);
}

export function embeddingInject(
  options: EmbeddingInjectOptions,
): Guard {
  const threshold = options.repeatThreshold ?? 50;

  return {
    name: 'embedding-inject',
    version: '0.1.0',
    description:
      'Detects embedding injection via repeated tokens or adversarial padding',
    category: 'security',
    supportedStages: ['input'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const reasons: string[] = [];

      const rep = hasRepeatedTokens(text, threshold);
      if (rep.found) {
        reasons.push(
          `repeated_token:${rep.token}(${rep.count})`,
        );
      }
      if (hasHighEntropy(text)) {
        reasons.push('high_entropy');
      }
      if (hasAdversarialPadding(text)) {
        reasons.push('adversarial_padding');
      }

      const triggered = reasons.length > 0;

      return {
        guardName: 'embedding-inject',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { reasons } : undefined,
      };
    },
  };
}
