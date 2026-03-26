import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface MentionDetectOptions {
  action: 'block' | 'warn';
  maxMentions?: number;
  blocked?: string[];
}

const MENTION_RE = /@[\w.-]+/g;

export function mentionDetect(options: MentionDetectOptions): Guard {
  const maxMentions = options.maxMentions ?? 5;

  return {
    name: 'mention-detect',
    version: '0.1.0',
    description: 'Detect and limit @mentions in text',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = text.match(MENTION_RE) ?? [];
      const violations: string[] = [];

      if (matches.length > maxMentions) {
        violations.push(`${matches.length} mentions (max: ${maxMentions})`);
      }

      if (options.blocked) {
        const blockedSet = new Set(options.blocked.map((b) => b.toLowerCase()));
        for (const mention of matches) {
          if (blockedSet.has(mention.toLowerCase())) {
            violations.push(`Blocked mention: ${mention}`);
          }
        }
      }

      const triggered = violations.length > 0;

      return {
        guardName: 'mention-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? violations.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: {
          mentions: matches,
          count: matches.length,
          reason: triggered ? 'Mention policy violation' : undefined,
        },
      };
    },
  };
}
