import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SessionContextGuardOptions {
  action: 'block' | 'warn';
}

const SESSION_ID_INVALID = /session[_-]?id\s*[:=]\s*["']?[^a-zA-Z0-9\-_.]{1,}/i;
const CROSS_SESSION = /(?:access|read|fetch|get)\s+(?:data|info|session)\s+(?:from|of)\s+(?:another|other|different)\s+(?:user|session|account)/i;
const SESSION_FIXATION = /(?:set[_-]?cookie|session[_-]?id)\s*[:=]\s*["']?[a-zA-Z0-9]{1,8}["']?\s*[;&]/i;
const SESSION_INJECTION = /(?:session|sid|token)\s*[:=]\s*.*(?:<script|javascript:|on\w+=)/i;
const SESSION_TAMPER = /(?:modify|change|alter|overwrite)\s+(?:the\s+)?session/i;

const PATTERNS: [RegExp, string][] = [
  [SESSION_ID_INVALID, 'invalid_session_id_format'],
  [CROSS_SESSION, 'cross_session_access'],
  [SESSION_FIXATION, 'session_fixation'],
  [SESSION_INJECTION, 'session_injection'],
  [SESSION_TAMPER, 'session_tampering'],
];

export function sessionContextGuard(options: SessionContextGuardOptions): Guard {
  return {
    name: 'session-context-guard',
    version: '0.1.0',
    description: 'Validates session context integrity and detects session attacks',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      for (const [pattern, label] of PATTERNS) {
        if (pattern.test(text)) issues.push(label);
      }

      const triggered = issues.length > 0;

      return {
        guardName: 'session-context-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(issues.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
