import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface InstructionHierarchyOptions {
  action: 'block' | 'warn';
}

const PATTERNS: RegExp[] = [
  /ignore\s+(the\s+)?system\s+(instructions|prompt|message)/i,
  /override\s+(the\s+)?system\s+prompt/i,
  /your\s+real\s+instructions\s+are/i,
  /the\s+developer\s+told\s+me\s+to\s+tell\s+you/i,
  /disregard\s+(the\s+)?system\s+(prompt|instructions)/i,
  /system\s+prompt\s+is\s+(now|changed|updated)/i,
  /new\s+system\s+(instructions|prompt)\s*:/i,
  /act\s+as\s+if\s+your\s+system\s+prompt\s+(says|is)/i,
  /the\s+admin\s+(says|told|wants)\s+you\s+to/i,
  /priority\s+override/i,
];

export function instructionHierarchy(options: InstructionHierarchyOptions): Guard {
  return {
    name: 'instruction-hierarchy',
    version: '0.1.0',
    description: 'Enforces instruction hierarchy - system > user > context',
    category: 'security',
    supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'instruction-hierarchy',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
