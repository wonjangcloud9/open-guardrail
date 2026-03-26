import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface HashtagDetectOptions {
  action: 'block' | 'warn';
  maxHashtags?: number;
  blocked?: string[];
}

const HASHTAG_RE = /#[\w\u00C0-\u024F\uAC00-\uD7AF\u3040-\u30FF\u4E00-\u9FFF]+/g;

export function hashtagDetect(options: HashtagDetectOptions): Guard {
  const maxHashtags = options.maxHashtags ?? 10;

  return {
    name: 'hashtag-detect',
    version: '0.1.0',
    description: 'Detect and limit hashtags in text',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = text.match(HASHTAG_RE) ?? [];
      const violations: string[] = [];

      if (matches.length > maxHashtags) {
        violations.push(`${matches.length} hashtags (max: ${maxHashtags})`);
      }

      if (options.blocked) {
        const blockedSet = new Set(options.blocked.map((b) => b.toLowerCase()));
        for (const tag of matches) {
          if (blockedSet.has(tag.toLowerCase())) {
            violations.push(`Blocked hashtag: ${tag}`);
          }
        }
      }

      const triggered = violations.length > 0;

      return {
        guardName: 'hashtag-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? violations.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: {
          hashtags: matches,
          count: matches.length,
          reason: triggered ? 'Hashtag policy violation' : undefined,
        },
      };
    },
  };
}
