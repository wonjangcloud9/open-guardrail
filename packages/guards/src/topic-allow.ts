import type {
  Guard,
  GuardResult,
  GuardContext,
} from '@open-guardrail/core';
import { TOPIC_DICTIONARIES } from './topic-dictionaries.js';

interface TopicAllowOptions {
  topics: string[];
  customTopics?: Record<string, string[]>;
  action: 'block' | 'warn';
}

export function topicAllow(
  options: TopicAllowOptions,
): Guard {
  const allDicts: Record<string, string[]> = {
    ...TOPIC_DICTIONARIES,
    ...options.customTopics,
  };

  return {
    name: 'topic-allow',
    version: '0.1.0',
    description:
      'Only allows text matching allowed topics',
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

      const triggered = matched.length === 0;

      return {
        guardName: 'topic-allow',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details:
          matched.length > 0
            ? { matchedTopics: matched }
            : undefined,
      };
    },
  };
}
