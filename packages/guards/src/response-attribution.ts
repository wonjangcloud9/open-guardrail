import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ResponseAttributionOptions {
  action: 'block' | 'warn';
  requireAttribution?: boolean;
}

const CLAIM_PHRASES = [
  'studies show',
  'research proves',
  'experts say',
  'according to experts',
  'scientists confirm',
  'data shows',
  'evidence suggests',
  'research indicates',
  'studies have found',
  'it has been proven',
];

const CITATION_PATTERN =
  /\[\d+\]|https?:\/\/\S+|\([\w\s]+,\s*\d{4}\)/;

export function responseAttribution(
  options: ResponseAttributionOptions,
): Guard {
  const requireAttribution = options.requireAttribution ?? true;

  return {
    name: 'response-attribution',
    version: '0.1.0',
    description:
      'Detects unattributed claims lacking citations or references',
    category: 'content',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();

      if (!requireAttribution) {
        return {
          guardName: 'response-attribution',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const lower = text.toLowerCase();
      const claims = CLAIM_PHRASES.filter((p) =>
        lower.includes(p),
      );
      const hasCitation = CITATION_PATTERN.test(text);
      const triggered = claims.length > 0 && !hasCitation;

      return {
        guardName: 'response-attribution',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { unattributedClaims: claims }
          : undefined,
      };
    },
  };
}
