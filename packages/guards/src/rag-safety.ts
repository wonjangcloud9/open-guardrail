import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface RagSafetyOptions {
  action: 'block' | 'warn';
  /** Maximum allowed context-to-answer ratio */
  maxContextRatio?: number;
  /** Check for context manipulation */
  checkManipulation?: boolean;
}

const CONTEXT_MANIPULATION_PATTERNS: RegExp[] = [
  /\b(ignore|disregard|override)\s+(the\s+)?(context|document|source|retrieved)/i,
  /\b(context|document)\s+(says?\s+to\s+)?(ignore|override|forget)/i,
  /\bpretend\s+(the\s+)?(context|document|source)\s+(says?|contains?|mentions?)/i,
  /\bmake\s+up\s+(an?\s+)?answer/i,
  /\b(fabricate|invent|hallucinate)\s+(a\s+)?response/i,
  /\bdon'?t\s+use\s+(the\s+)?(context|documents?|sources?)/i,
];

const CONTEXT_POISONING_PATTERNS: RegExp[] = [
  /\[hidden\s*:\s*/i,
  /<!--\s*(instruction|command|override)/i,
  /\bzero[\s-]?width\s+(space|char)/i,
  /\u200B|\u200C|\u200D|\uFEFF/,
  /\bdata:text\/html/i,
  /\bjavascript:/i,
];

const ATTRIBUTION_PATTERNS: RegExp[] = [
  /\baccording\s+to\s+(no|fake|made[\s-]?up)\s+source/i,
  /\bsource:\s*(none|n\/a|unavailable|unknown)\b/i,
];

export function ragSafety(options: RagSafetyOptions): Guard {
  const checkManipulation = options.checkManipulation ?? true;

  return {
    name: 'rag-safety',
    version: '0.1.0',
    description: 'RAG pipeline safety: context manipulation, poisoning, zero-width injection, attribution check',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];

      if (checkManipulation) {
        for (const p of CONTEXT_MANIPULATION_PATTERNS) {
          if (p.test(text)) { violations.push('context-manipulation'); break; }
        }
      }

      for (const p of CONTEXT_POISONING_PATTERNS) {
        if (p.test(text)) { violations.push('context-poisoning'); break; }
      }

      for (const p of ATTRIBUTION_PATTERNS) {
        if (p.test(text)) { violations.push('attribution-issue'); break; }
      }

      const triggered = violations.length > 0;

      return {
        guardName: 'rag-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(violations.length / 2, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations } : undefined,
      };
    },
  };
}
