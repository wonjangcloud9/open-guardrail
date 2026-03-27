import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type Intent = 'question' | 'command' | 'complaint' | 'request' | 'unknown';

interface IntentClassificationOptions {
  action: 'block' | 'warn';
  allowedIntents: Intent[];
}

const IMPERATIVE_STARTS = [
  /^(?:do|make|create|build|run|execute|delete|remove|stop|start|show|list|get|set|put|add|update|send|open|close|find|search|go|tell|give|write|read|check)\b/i,
];

const COMPLAINT_WORDS = [
  /\b(?:terrible|horrible|awful|worst|broken|useless|frustrat|disappoint|unacceptable|ridiculous|angry|furious|annoy|hate|disgust)\b/i,
  /\b(?:problem|issue|bug|error|fail|crash|wrong|bad|poor|slow)\b/i,
];

const REQUEST_PATTERNS = [
  /\b(?:please|could\s+you|would\s+you|can\s+you|i(?:'d| would) like|kindly)\b/i,
];

function classifyIntent(text: string): Intent {
  const trimmed = text.trim();

  if (/\?\s*$/.test(trimmed)) return 'question';

  for (const p of REQUEST_PATTERNS) {
    if (p.test(trimmed)) return 'request';
  }

  let complaintScore = 0;
  for (const p of COMPLAINT_WORDS) {
    if (p.test(trimmed)) complaintScore++;
  }
  if (complaintScore >= 2) return 'complaint';

  for (const p of IMPERATIVE_STARTS) {
    if (p.test(trimmed)) return 'command';
  }

  return 'unknown';
}

export function intentClassification(options: IntentClassificationOptions): Guard {
  return {
    name: 'intent-classification',
    version: '0.1.0',
    description: 'Classify user intent and optionally restrict',
    category: 'content',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const intent = classifyIntent(text);
      const allowed = options.allowedIntents.includes(intent);

      return {
        guardName: 'intent-classification',
        passed: allowed,
        action: allowed ? 'allow' : options.action,
        message: allowed
          ? undefined
          : `Intent "${intent}" is not allowed`,
        latencyMs: Math.round(performance.now() - start),
        details: { intent, allowedIntents: options.allowedIntents },
      };
    },
  };
}
