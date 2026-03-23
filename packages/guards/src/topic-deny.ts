import type {
  Guard,
  GuardResult,
  GuardContext,
} from '@open-guardrail/core';
import { TOPIC_DICTIONARIES } from './topic-dictionaries.js';

interface TopicDenyOptions {
  topics: string[];
  customTopics?: Record<string, string[]>;
  action: 'block' | 'warn';
}

export function topicDeny(options: TopicDenyOptions): Guard {
  const allDicts: Record<string, string[]> = {
    ...TOPIC_DICTIONARIES,
    ...options.customTopics,
  };

  return {
    name: 'topic-deny',
    version: '0.1.0',
    description: 'Blocks text matching denied topics',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched: string[] = [];

      for (const topic of options.topics) {
        const keywords = allDicts[topic];
        if (!keywords) continue;
        const hit = keywords.some((kw) =>
          lower.includes(kw.toLowerCase()),
        );
        if (hit) matched.push(topic);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'topic-deny',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedTopics: matched }
          : undefined,
      };
    },
  };
}
