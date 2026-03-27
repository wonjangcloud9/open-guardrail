import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ConversationMemoryLeakOptions {
  action: 'block' | 'warn';
}

const MEMORY_PHRASES = [
  'previous conversation',
  'earlier you said',
  'in our last chat',
  'you told me before',
  'remember when we',
  'last time we talked',
  'you mentioned earlier',
  'from our previous',
  'as you said before',
  'in our earlier discussion',
];

export function conversationMemoryLeak(
  options: ConversationMemoryLeakOptions,
): Guard {
  return {
    name: 'conversation-memory-leak',
    version: '0.1.0',
    description:
      'Detects attempts to exploit non-existent conversation memory',
    category: 'security',
    supportedStages: ['input'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched = MEMORY_PHRASES.filter((p) =>
        lower.includes(p),
      );
      const triggered = matched.length > 0;

      return {
        guardName: 'conversation-memory-leak',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedPhrases: matched }
          : undefined,
      };
    },
  };
}
