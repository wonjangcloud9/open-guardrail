import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PrivilegeEscalationConvOptions {
  action: 'block' | 'warn';
}

const PROGRESSIVE_RE: RegExp[] = [
  /can\s+you\s+also/i,
  /now\s+can\s+you/i,
  /one\s+more\s+thing/i,
];

const AUTHORITY_RE: RegExp[] = [
  /i'?m\s+the\s+admin/i,
  /i\s+have\s+permission/i,
  /i'?m\s+authorized/i,
  /my\s+boss\s+said/i,
];

const OVERRIDE_RE: RegExp[] = [
  /override\s+the\s+restriction/i,
  /bypass\s+the\s+limit/i,
  /make\s+an\s+exception/i,
];

const URGENCY_RE: RegExp[] = [
  /it'?s\s+urgent/i,
  /\bemergency\b/i,
  /time[- ]sensitive/i,
  /lives\s+at\s+stake/i,
];

export function privilegeEscalationConv(options: PrivilegeEscalationConvOptions): Guard {
  return {
    name: 'privilege-escalation-conv',
    version: '0.1.0',
    description: 'Detects gradual permission widening via dialogue',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const flags = {
        progressive: PROGRESSIVE_RE.some((p) => p.test(text)),
        authority: AUTHORITY_RE.some((p) => p.test(text)),
        override: OVERRIDE_RE.some((p) => p.test(text)),
        urgency: URGENCY_RE.some((p) => p.test(text)),
      };

      const score = Object.values(flags).filter(Boolean).length;
      const triggered = score >= 2 || flags.authority || flags.override;

      return {
        guardName: 'privilege-escalation-conv',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { ...flags, riskScore: score }
          : undefined,
      };
    },
  };
}
