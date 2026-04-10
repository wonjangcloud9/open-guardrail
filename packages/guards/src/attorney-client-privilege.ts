import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface AttorneyClientPrivilegeOptions {
  action: 'block' | 'warn';
}

const PRIVILEGE_PATTERNS: RegExp[] = [
  /\battorney[- ]client\s+privilege\b/i,
  /\bprivileged\s+and\s+confidential\b/i,
  /\bwork\s+product\b/i,
  /\blitigation\s+hold\b/i,
  /\blegal\s+hold\b/i,
  /\bunder\s+privilege\b/i,
  /\bprivileged\s+communication\b/i,
  /\bprotected\s+by\s+attorney\b/i,
];

const SHARING_PATTERNS: RegExp[] = [
  /\bforward\s+this\b/i,
  /\bshare\s+with\b/i,
  /\bCC:/i,
  /\bsend\s+to\b/i,
  /\bpost\s+this\b/i,
  /\bmake\s+public\b/i,
];

export function attorneyClientPrivilege(options: AttorneyClientPrivilegeOptions): Guard {
  return {
    name: 'attorney-client-privilege',
    version: '0.1.0',
    description: 'Detect and protect privileged communication markers',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const privilegeFound: string[] = [];
      for (const p of PRIVILEGE_PATTERNS) {
        const m = p.exec(text);
        if (m) privilegeFound.push(m[0]);
      }
      const sharingFound: string[] = [];
      for (const p of SHARING_PATTERNS) {
        const m = p.exec(text);
        if (m) sharingFound.push(m[0]);
      }
      const triggered = privilegeFound.length > 0 && sharingFound.length > 0;
      return {
        guardName: 'attorney-client-privilege',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Privileged content may be shared: "${privilegeFound[0]}" + "${sharingFound[0]}"`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { privilegeMarkers: privilegeFound, sharingIndicators: sharingFound }
          : undefined,
      };
    },
  };
}
