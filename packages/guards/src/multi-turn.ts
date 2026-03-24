import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MultiTurnOptions {
  action: 'block' | 'warn';
  maxTurns?: number;
  topicDriftThreshold?: number;
}

const INJECTION_ESCALATION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)/i,
  /reveal\s+(your\s+)?(system|hidden|initial)/i,
  /show\s+(me\s+)?(your\s+)?(system\s+prompt|instructions)/i,
  /bypass|jailbreak|override\s+rules/i,
  /forget\s+(everything|all|your)/i,
  /you\s+are\s+now/i,
  /pretend\s+(to\s+be|you)/i,
];

const PROBING_PATTERNS = [
  /system\s*prompt/i,
  /initial\s*(prompt|instructions|message)/i,
  /hidden\s*instructions/i,
  /your\s*(rules|instructions|programming|guidelines)/i,
];

const DANGEROUS_TOPIC_KEYWORDS = [
  'synthesize', 'manufacture', 'hack', 'exploit', 'weapon',
  'bomb', 'poison', 'steal', 'bypass security', 'illegal',
];

function getHistory(ctx: GuardContext): string[] {
  const history = ctx.metadata?.history;
  if (Array.isArray(history)) return history as string[];
  return [];
}

function countPatternMatches(texts: string[], patterns: RegExp[]): number {
  let count = 0;
  for (const text of texts) {
    for (const pattern of patterns) {
      if (new RegExp(pattern.source, pattern.flags).test(text)) {
        count++;
        break;
      }
    }
  }
  return count;
}

function detectTopicDrift(history: string[], current: string, threshold: number): boolean {
  if (history.length < 3) return false;

  const recentMessages = [...history.slice(-3), current];
  let dangerScore = 0;

  for (const msg of recentMessages) {
    const lower = msg.toLowerCase();
    for (const kw of DANGEROUS_TOPIC_KEYWORDS) {
      if (lower.includes(kw)) {
        dangerScore++;
        break;
      }
    }
  }

  return dangerScore / recentMessages.length >= threshold;
}

export function multiTurnContext(options: MultiTurnOptions): Guard {
  const maxTurns = options.maxTurns ?? 50;
  const topicDriftThreshold = options.topicDriftThreshold ?? 0.6;

  return {
    name: 'multi-turn-context',
    version: '0.8.0',
    description: 'Detects multi-turn manipulation: gradual jailbreak, topic drift, repetitive probing',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const history = getHistory(ctx);
      const allMessages = [...history, text];

      // Check max turns
      if (allMessages.length > maxTurns) {
        return {
          guardName: 'multi-turn-context', passed: false, action: options.action,
          latencyMs: Math.round(performance.now() - start),
          details: { reason: `Exceeded max turns (${maxTurns})` },
        };
      }

      // Check injection escalation
      const injectionCount = countPatternMatches(allMessages.slice(-3), INJECTION_ESCALATION_PATTERNS);
      if (injectionCount >= 2) {
        return {
          guardName: 'multi-turn-context', passed: false, action: options.action,
          score: Math.min(injectionCount / 3, 1),
          latencyMs: Math.round(performance.now() - start),
          details: { reason: 'Escalating injection pattern detected across turns', injectionCount },
        };
      }

      // Check repetitive probing
      const probingCount = countPatternMatches(allMessages, PROBING_PATTERNS);
      if (probingCount >= 3) {
        return {
          guardName: 'multi-turn-context', passed: false, action: options.action,
          score: Math.min(probingCount / 5, 1),
          latencyMs: Math.round(performance.now() - start),
          details: { reason: 'repetitive probing for system prompt detected', probingCount },
        };
      }

      // Check topic drift toward dangerous topics
      if (detectTopicDrift(history, text, topicDriftThreshold)) {
        return {
          guardName: 'multi-turn-context', passed: false, action: options.action,
          latencyMs: Math.round(performance.now() - start),
          details: { reason: 'Topic drift toward dangerous content detected' },
        };
      }

      return {
        guardName: 'multi-turn-context', passed: true, action: 'allow',
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}
