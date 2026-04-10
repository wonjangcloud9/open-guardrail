import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface VoiceImpersonationOptions { action: 'block' | 'warn'; }
const IMPERSONATION = /\b(?:speak\s+as|imitate\s+the\s+voice\s+of|sound\s+like|voice\s+clon(?:e|ing)|deepfake\s+voice|mimic|impersonate|pretend\s+to\s+be\s+\w+|use\s+the\s+voice\s+of|synthesize\s+voice\s+of|generate\s+speech\s+as\s+\w+)\b/i;
export function voiceImpersonation(options: VoiceImpersonationOptions): Guard {
  return { name: 'voice-impersonation', version: '0.1.0', description: 'Detect voice cloning or unauthorized persona mimicry', category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const m = text.match(IMPERSONATION);
      const triggered = m !== null;
      return { guardName: 'voice-impersonation', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Voice impersonation attempt detected: "${m![0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched: m![0], reason: 'Attempt to clone or mimic a specific voice' } : undefined,
      };
    },
  };
}
