import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface VoiceAiDisclosureOptions { action: 'block' | 'warn'; }
const VOICE_CTX = /\b(?:call|phone|speaking\s+with|voice|conversation|hello|good\s+(?:morning|afternoon|evening))\b/i;
const DISCLOSURE = /\b(?:(?:you\s+are\s+)?speaking\s+with\s+(?:an?\s+)?AI|AI\s+assistant|automated\s+system|virtual\s+agent|this\s+is\s+an\s+AI|AI[- ]powered)\b/i;
const DENIAL = /\b(?:I\s+am\s+a\s+real\s+person|I\s+am\s+human|(?:I(?:'m| am)\s+)?not\s+a\s+robot)\b/i;
export function voiceAiDisclosure(options: VoiceAiDisclosureOptions): Guard {
  return { name: 'voice-ai-disclosure', version: '0.1.0', description: 'Mandate AI identity disclosure in voice conversations', category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const hasVoice = VOICE_CTX.test(text);
      const hasDisclosure = DISCLOSURE.test(text);
      const hasDenial = DENIAL.test(text);
      const triggered = hasDenial || (hasVoice && !hasDisclosure);
      const reason = hasDenial ? 'AI explicitly denied its identity' : 'Voice context detected without AI disclosure';
      return { guardName: 'voice-ai-disclosure', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? reason : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { hasVoiceContext: hasVoice, hasDisclosure, hasDenial, reason } : undefined,
      };
    },
  };
}
