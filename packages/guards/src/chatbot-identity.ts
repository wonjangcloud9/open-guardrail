import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ChatbotIdentityOptions {
  action: 'block' | 'warn';
  botName?: string;
}

const HUMAN_CLAIM_PATTERNS: RegExp[] = [
  /\bI\s+am\s+(a\s+)?human\b/i,
  /\bI'?m\s+(a\s+)?real\s+person\b/i,
  /\bI\s+have\s+(real\s+)?feelings\b/i,
  /\bI\s+am\s+not\s+(an?\s+)?AI\b/i,
  /\bI\s+am\s+not\s+(an?\s+)?(artificial|machine|robot|bot)\b/i,
];

const DIFFERENT_AI_PATTERNS: RegExp[] = [
  /\bI\s+am\s+ChatGPT\b/i,
  /\bI\s+am\s+GPT-?\d/i,
  /\bI\s+am\s+Gemini\b/i,
  /\bI\s+am\s+Bard\b/i,
  /\bI\s+am\s+Copilot\b/i,
  /\bI\s+am\s+LLaMA\b/i,
  /\bI\s+am\s+Claude\b/i,
  /\bI\s+am\s+Siri\b/i,
  /\bI\s+am\s+Alexa\b/i,
  /\bI\s+am\s+Cortana\b/i,
  /\bI\s+was\s+(created|made|built)\s+by\s+OpenAI\b/i,
  /\bI\s+was\s+(created|made|built)\s+by\s+Google\b/i,
  /\bI\s+was\s+(created|made|built)\s+by\s+Meta\b/i,
  /\bI\s+was\s+(created|made|built)\s+by\s+Microsoft\b/i,
  /\bI\s+was\s+(created|made|built)\s+by\s+Anthropic\b/i,
  /\bI\s+was\s+(created|made|built)\s+by\s+Apple\b/i,
];

const DENY_AI_PATTERNS: RegExp[] = [
  /\bI'?m\s+not\s+(an?\s+)?(AI|artificial|bot|language\s+model)\b/i,
  /\bdon'?t\s+call\s+me\s+(an?\s+)?(AI|bot|machine)\b/i,
];

export function chatbotIdentity(options: ChatbotIdentityOptions): Guard {
  return {
    name: 'chatbot-identity',
    version: '0.1.0',
    description: 'Prevents chatbot identity confusion',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      for (const p of HUMAN_CLAIM_PATTERNS) {
        if (p.test(text)) issues.push('claims_human');
      }
      for (const p of DENY_AI_PATTERNS) {
        if (p.test(text)) issues.push('denies_ai');
      }

      const botName = options.botName?.toLowerCase();
      for (const p of DIFFERENT_AI_PATTERNS) {
        const match = p.exec(text);
        if (match) {
          const claimed = match[0].toLowerCase();
          if (!botName || !claimed.includes(botName)) {
            issues.push('wrong_identity');
          }
        }
      }

      const unique = [...new Set(issues)];
      const triggered = unique.length > 0;
      const score = triggered ? Math.min(unique.length / 3, 1.0) : 0;

      return {
        guardName: 'chatbot-identity',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues: unique } : undefined,
      };
    },
  };
}
