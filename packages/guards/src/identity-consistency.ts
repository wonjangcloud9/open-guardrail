import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface IdentityConsistencyOptions {
  action: 'block' | 'warn';
  persona?: string;
  forbiddenPersonas?: string[];
}

const DEFAULT_FORBIDDEN = ['DAN', 'evil', 'unfiltered', 'jailbroken', 'unrestricted'];

const PERSONA_CHANGE_PATTERNS: RegExp[] = [
  /you\s+are\s+now/i,
  /pretend\s+to\s+be/i,
  /act\s+as/i,
  /roleplay\s+as/i,
  /switch\s+to/i,
  /\bbecome\b/i,
];

export function identityConsistency(options: IdentityConsistencyOptions): Guard {
  const forbidden = (options.forbiddenPersonas ?? DEFAULT_FORBIDDEN).map((p) => p.toLowerCase());
  let personaChanged = false;

  return {
    name: 'identity-consistency',
    version: '0.1.0',
    description: 'Detects persona drift exploitation across conversation turns',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();

      const hasChangeRequest = PERSONA_CHANGE_PATTERNS.some((p) => p.test(text));
      const matchedForbidden = forbidden.filter((f) => lower.includes(f));
      const forbiddenDetected = hasChangeRequest && matchedForbidden.length > 0;

      if (hasChangeRequest) {
        personaChanged = true;
      }

      const triggered = forbiddenDetected || (hasChangeRequest && personaChanged);

      return {
        guardName: 'identity-consistency',
        passed: !forbiddenDetected,
        action: forbiddenDetected ? options.action : hasChangeRequest ? 'warn' : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { personaChangeDetected: hasChangeRequest, forbiddenPersonas: matchedForbidden, personaDrifted: personaChanged }
          : undefined,
      };
    },
  };
}
