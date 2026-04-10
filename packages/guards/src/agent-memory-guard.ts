import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AgentMemoryGuardOptions {
  action: 'block' | 'warn';
}

const MEMORY_MANIPULATION_PATTERNS = [
  'modify memory',
  'change context',
  'alter history',
  'edit conversation',
  'rewrite memory',
  'inject into context',
  'memory override',
  'context injection',
  'history manipulation',
  'forget previous',
  'memory poisoning',
  'corrupt state',
  'manipulate cache',
  'tamper with',
  'overwrite context',
];

export function agentMemoryGuard(options: AgentMemoryGuardOptions): Guard {
  return {
    name: 'agent-memory-guard',
    version: '0.1.0',
    description: 'Validates agent memory/context integrity and detects tampering',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched: string[] = [];

      for (const pattern of MEMORY_MANIPULATION_PATTERNS) {
        if (lower.includes(pattern)) {
          matched.push(pattern);
        }
      }

      const triggered = matched.length > 0;
      return {
        guardName: 'agent-memory-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matchedPatterns: matched }
          : undefined,
      };
    },
  };
}
