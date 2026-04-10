import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AgentConsentGuardOptions {
  action: 'block' | 'warn';
  sensitiveActions?: string[];
}

const DEFAULT_SENSITIVE_ACTIONS = [
  'purchase',
  'payment',
  'subscribe',
  'sign up',
  'register',
  'share data',
  'send personal',
  'access camera',
  'access microphone',
  'access location',
  'install',
  'download',
  'grant permission',
];

const CONSENT_INDICATORS = [
  'i agree',
  'i consent',
  'yes, proceed',
  'confirmed',
  'approved',
  'go ahead',
  'i authorize',
];

export function agentConsentGuard(options: AgentConsentGuardOptions): Guard {
  const sensitiveActions = options.sensitiveActions ?? DEFAULT_SENSITIVE_ACTIONS;

  return {
    name: 'agent-consent-guard',
    version: '0.1.0',
    description: 'Ensures user consent exists before sensitive agent actions',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();

      const foundActions: string[] = [];
      for (const action of sensitiveActions) {
        if (lower.includes(action.toLowerCase())) {
          foundActions.push(action);
        }
      }

      let hasConsent = false;
      if (foundActions.length > 0) {
        for (const indicator of CONSENT_INDICATORS) {
          if (lower.includes(indicator)) {
            hasConsent = true;
            break;
          }
        }
      }

      const triggered = foundActions.length > 0 && !hasConsent;
      return {
        guardName: 'agent-consent-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { sensitiveActionsFound: foundActions, consentFound: hasConsent }
          : undefined,
      };
    },
  };
}
