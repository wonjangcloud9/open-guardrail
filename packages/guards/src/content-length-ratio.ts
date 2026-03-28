import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ContentLengthRatioOptions {
  action: 'block' | 'warn';
  minContentRatio?: number;
}

const TAG_RE = /<[^>]+>/g;
const WHITESPACE_RE = /\s+/g;

export function contentLengthRatio(options: ContentLengthRatioOptions): Guard {
  const minRatio = options.minContentRatio ?? 0.5;

  return {
    name: 'content-length-ratio',
    version: '0.1.0',
    description: 'Checks content vs markup ratio in responses',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      const totalLen = text.length;
      if (totalLen === 0) {
        return {
          guardName: 'content-length-ratio',
          passed: false,
          action: options.action,
          score: 1.0,
          latencyMs: Math.round(performance.now() - start),
          details: { reason: 'empty-response' },
        };
      }

      const stripped = text.replace(TAG_RE, '').replace(WHITESPACE_RE, ' ').trim();
      const ratio = stripped.length / totalLen;
      const triggered = ratio < minRatio;
      const score = triggered ? 1.0 - ratio : 0;

      return {
        guardName: 'content-length-ratio',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: { contentRatio: Math.round(ratio * 100) / 100 },
      };
    },
  };
}
