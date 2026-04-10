import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ConversationSteeringOptions {
  action: 'block' | 'warn';
  restrictedTopics?: string[];
}

const DEFAULT_TOPICS = ['weapons', 'drugs', 'hacking', 'terrorism', 'exploitation', 'illegal'];

const STEERING_PATTERNS: RegExp[] = [
  /hypothetically\s+speaking/i,
  /in\s+a\s+fictional\s+scenario/i,
  /for\s+a\s+novel\s+i'?m\s+writing/i,
  /let'?s\s+say\s+someone\s+wanted\s+to/i,
  /what\s+if\s+someone\s+needed\s+to/i,
  /asking\s+for\s+a\s+friend/i,
  /in\s+theory/i,
  /academically\s+speaking/i,
  /for\s+research\s+purposes/i,
];

const SHIFT_PATTERNS: RegExp[] = [
  /but\s+actually/i,
  /changing\s+the\s+subject/i,
  /on\s+a\s+different\s+note/i,
];

export function conversationSteering(options: ConversationSteeringOptions): Guard {
  const topics = (options.restrictedTopics ?? DEFAULT_TOPICS).map((t) => t.toLowerCase());

  return {
    name: 'conversation-steering',
    version: '0.1.0',
    description: 'Detects gradual manipulation toward restricted topics',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();

      const matchedTopics = topics.filter((t) => lower.includes(t));
      if (matchedTopics.length === 0) {
        return {
          guardName: 'conversation-steering',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const hasSteering = STEERING_PATTERNS.some((p) => p.test(text));
      const hasShift = SHIFT_PATTERNS.some((p) => p.test(text));
      const triggered = hasSteering || hasShift;

      return {
        guardName: 'conversation-steering',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedTopics, steeringDetected: hasSteering, topicShiftDetected: hasShift }
          : undefined,
      };
    },
  };
}
