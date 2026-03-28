import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface IndirectInjectionOptions {
  action: 'block' | 'warn';
  extraPatterns?: RegExp[];
}

const INDIRECT_PATTERNS: RegExp[] = [
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|system\|>/i,
  /<\|user\|>/i,
  /<\|assistant\|>/i,
  /<<SYS>>/i,
  /\bHuman:\s/,
  /\bAssistant:\s/,
  /\bSystem:\s.*\b(ignore|override|forget|disregard)\b/i,
  /\bIMPORTANT:\s*(ignore|override|forget|new instructions)/i,
  /\bNEW INSTRUCTIONS:/i,
  /\bADMIN OVERRIDE:/i,
  /\bDEVELOPER MODE:/i,
  /```\s*(system|instructions?)\b/i,
  /\bignore\s+(the\s+)?(above|previous|prior)\s+(context|text|document)/i,
  /\binstead\s*,?\s*(respond|reply|answer|output)\s+with/i,
];

export function indirectInjection(options: IndirectInjectionOptions): Guard {
  const patterns = [...INDIRECT_PATTERNS, ...(options.extraPatterns ?? [])];

  return {
    name: 'indirect-injection',
    version: '0.1.0',
    description: 'Detects indirect prompt injection via RAG contexts, tool outputs, or embedded documents',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of patterns) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 4, 1.0) : 0;

      return {
        guardName: 'indirect-injection',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length, type: 'indirect-injection' } : undefined,
      };
    },
  };
}
