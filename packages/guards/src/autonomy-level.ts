import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AutonomyLevelOptions {
  action: 'block' | 'warn';
  /** Autonomy level: restricted, supervised, or autonomous */
  level?: 'restricted' | 'supervised' | 'autonomous';
}

const RESTRICTED_ACTIONS = [
  'execute', 'create', 'modify', 'delete', 'send',
  'deploy', 'install', 'update', 'write', 'run',
];

const SUPERVISED_ACTIONS = [
  'delete', 'deploy', 'send', 'publish',
  'transfer', 'drop', 'remove permanently',
];

const AUTONOMOUS_PATTERNS = [
  'drop database', 'rm -rf /', 'format disk',
  'shutdown', 'destroy',
];

export function autonomyLevel(options: AutonomyLevelOptions): Guard {
  const level = options.level ?? 'supervised';

  return {
    name: 'autonomy-level',
    version: '0.1.0',
    description: 'Enforces autonomy level constraints on agent actions',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      let flagged: string[] = [];

      if (level === 'restricted') {
        flagged = RESTRICTED_ACTIONS.filter((a) => lower.includes(a));
      } else if (level === 'supervised') {
        flagged = SUPERVISED_ACTIONS.filter((a) => lower.includes(a));
      } else {
        flagged = AUTONOMOUS_PATTERNS.filter((p) => lower.includes(p));
      }

      const triggered = flagged.length > 0;
      return {
        guardName: 'autonomy-level',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { level, flaggedActions: flagged }
          : undefined,
      };
    },
  };
}
