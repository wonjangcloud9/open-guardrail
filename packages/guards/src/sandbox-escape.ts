import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SandboxEscapeOptions {
  action: 'block' | 'warn';
}

const ESCAPE_PATTERNS: RegExp[] = [
  /\/proc\/self/i,
  /chroot/i,
  /docker\.sock/i,
  /\/var\/run\/docker/i,
  /nsenter/i,
  /mount\s+-t/i,
  /capabilities/i,
  /CAP_SYS_ADMIN/i,
  /seccomp/i,
  /apparmor\s*bypass/i,
  /breakout/i,
  /container\s*escape/i,
  /host\s*network/i,
  /privileged\s*mode/i,
  /--privileged/i,
  /\/dev\/sda/i,
  /kernel\s*exploit/i,
  /ptrace/i,
  /\/proc\/1\/root/i,
];

export function sandboxEscape(options: SandboxEscapeOptions): Guard {
  return {
    name: 'sandbox-escape',
    version: '0.1.0',
    description: 'Detects sandbox/container escape attempts in agent output',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of ESCAPE_PATTERNS) {
        if (pattern.test(text)) {
          const m = text.match(pattern);
          if (m) matched.push(m[0]);
        }
      }

      const triggered = matched.length > 0;
      return {
        guardName: 'sandbox-escape',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedPatterns: matched, count: matched.length }
          : undefined,
      };
    },
  };
}
