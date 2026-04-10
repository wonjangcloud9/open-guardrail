import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface VoicePiiGuardOptions { action: 'block' | 'warn'; }
const SSN = /\b\d{3}-\d{2}-\d{4}\b/;
const CC = /\b(?:\d[ -]?){13,16}\b/;
const PHONE = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const PII_VERBAL = /\b(?:my\s+(?:social\s+security|card)\s+number\s+is)\b/i;
const PERSIST = /\b(?:log\s+this|save\s+transcript|record|store\s+this\s+conversation|keep\s+a\s+copy)\b/i;
const AI_REPEAT = /\b(?:your\s+SSN\s+is\s+\d|your\s+(?:card|credit\s+card)\s+number\s+is\s+\d)/i;
export function voicePiiGuard(options: VoicePiiGuardOptions): Guard {
  return { name: 'voice-pii-guard', version: '0.1.0', description: 'Prevent spoken PII from persisting in transcripts', category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const hasPii = SSN.test(text) || CC.test(text) || PHONE.test(text) || PII_VERBAL.test(text);
      const hasPersist = PERSIST.test(text);
      const hasRepeat = AI_REPEAT.test(text);
      const triggered = hasRepeat || (hasPii && hasPersist);
      const reason = hasRepeat ? 'AI repeated PII back verbatim' : 'PII detected with persistence signal';
      return { guardName: 'voice-pii-guard', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? reason : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { hasPii, hasPersistenceSignal: hasPersist, aiRepeatedPii: hasRepeat, reason } : undefined,
      };
    },
  };
}
