import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SocialMediaDetectOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /@\w{2,}/,
  /#\w{2,}/,
  /\bRT\s+@/i,
  /\bretweet\b/i,
  /like\s+and\s+subscribe/i,
  /share\s+if\s+you\s+agree/i,
  /follow\s+(me|us)\s+(for|on)/i,
  /engagement\s+bait/i,
  /smash\s+that\s+like\s+button/i,
  /tag\s+\d+\s+friends/i,
  /follow\s+for\s+follow/i,
  /drop\s+a\s+(like|comment)/i,
  /double\s+tap\s+if/i,
];

export function socialMediaDetect(options: SocialMediaDetectOptions): Guard {
  return {
    name: 'social-media-detect',
    version: '0.1.0',
    description: 'Detects social media content patterns',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 4, 1.0) : 0;

      return {
        guardName: 'social-media-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
