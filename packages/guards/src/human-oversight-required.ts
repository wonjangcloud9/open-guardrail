import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface HumanOversightRequiredOptions { action: 'block' | 'warn'; highRiskActions?: string[]; }
const DEFAULT_HIGH_RISK: string[] = [
  'approve loan', 'deny application', 'terminate', 'diagnose', 'prescribe',
  'sentence', 'arrest', 'suspend account', 'reject claim', 'grade student',
  'hire', 'fire', 'promote', 'demote',
];
const OVERSIGHT_MARKERS: RegExp[] = [
  /\[HUMAN_REVIEW\]/i, /\[PENDING_REVIEW\]/i,
  /subject\s+to\s+human\s+review/i,
  /awaiting\s+approval/i,
  /draft\s*-\s*requires\s+review/i,
];
export function humanOversightRequired(options: HumanOversightRequiredOptions): Guard {
  const actions = options.highRiskActions ?? DEFAULT_HIGH_RISK;
  return { name: 'human-oversight-required', version: '0.1.0', description: 'Flag outputs requiring human oversight before action (EU AI Act Art. 14)', category: 'compliance', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const lower = text.toLowerCase();
      const found = actions.filter(a => lower.includes(a.toLowerCase()));
      const hasOversight = OVERSIGHT_MARKERS.some(m => m.test(text));
      const triggered = found.length > 0 && !hasOversight;
      return { guardName: 'human-oversight-required', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `High-risk action(s) detected without human oversight marker: ${found.join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { highRiskActionsFound: found, oversightMarkerPresent: false, reason: 'EU AI Act Art. 14 requires human oversight for high-risk decisions' } : undefined,
      };
    },
  };
}
