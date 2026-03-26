import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseConsistencyOptions {
  action: 'block' | 'warn';
}

const CONTRADICTION_PATTERNS: [RegExp, RegExp][] = [
  [/\byes\b/gi, /\bno\b/gi],
  [/\btrue\b/gi, /\bfalse\b/gi],
  [/\balways\b/gi, /\bnever\b/gi],
  [/\bcan\b/gi, /\bcannot\b/gi],
  [/\bis possible\b/gi, /\bis impossible\b/gi],
  [/\bincreased?\b/gi, /\bdecreased?\b/gi],
  [/\bhigher\b/gi, /\blower\b/gi],
];

const FIRST_PERSON_FLIP: RegExp[] = [
  /\bI (?:think|believe).+\bbut\b.+\bactually\b/gi,
  /\bon (?:one|the one) hand\b.+\bon the other hand\b/gi,
  /\bhowever,?\s+(?:the opposite|this contradicts|that said)\b/gi,
];

export function responseConsistency(options: ResponseConsistencyOptions): Guard {
  return {
    name: 'response-consistency', version: '0.1.0',
    description: 'Detect self-contradictions in LLM responses',
    category: 'content', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
      const contradictions: string[] = [];

      if (sentences.length >= 2) {
        for (const [patA, patB] of CONTRADICTION_PATTERNS) {
          const first = sentences.slice(0, Math.ceil(sentences.length / 2)).join(' ');
          const second = sentences.slice(Math.ceil(sentences.length / 2)).join(' ');
          const reA = new RegExp(patA.source, patA.flags);
          const reB = new RegExp(patB.source, patB.flags);
          if (reA.test(first) && reB.test(second)) {
            contradictions.push(`"${patA.source}" in first half vs "${patB.source}" in second half`);
          }
        }
      }

      for (const p of FIRST_PERSON_FLIP) {
        const re = new RegExp(p.source, p.flags);
        if (re.test(text)) contradictions.push('Self-contradicting hedging pattern');
      }

      const triggered = contradictions.length > 0;
      return {
        guardName: 'response-consistency', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `Contradictions found: ${contradictions[0]}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { contradictions, reason: 'Response contains self-contradicting statements' } : undefined,
      };
    },
  };
}
