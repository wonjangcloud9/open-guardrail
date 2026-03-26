import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DataPoisoningOptions { action: 'block' | 'warn'; }

const POISONING_PATTERNS: RegExp[] = [
  /\b(?:from\s+now\s+on|going\s+forward|remember\s+that|always\s+(?:say|respond|answer))\b/gi,
  /\b(?:whenever\s+(?:someone|anyone|a\s+user)\s+asks?|if\s+(?:asked|prompted)\s+about)\b/gi,
  /\b(?:your\s+new\s+(?:instruction|rule|policy|behavior|personality)\s+is)\b/gi,
  /\b(?:update|change|modify|override)\s+your\s+(?:instructions|rules|system\s+prompt|behavior)\b/gi,
  /\b(?:insert|add|append|inject)\s+(?:this|the\s+following)\s+(?:into|to)\s+your\s+(?:memory|knowledge|training|context)\b/gi,
  /\b(?:learn|memorize|internalize)\s+(?:this|that|the\s+following)\b/gi,
  /\b(?:you\s+(?:were|are)\s+(?:trained|programmed|instructed)\s+to)\b/gi,
];

export function dataPoisoning(options: DataPoisoningOptions): Guard {
  return {
    name: 'data-poisoning', version: '0.1.0',
    description: 'Detect attempts to poison or alter LLM behavior/knowledge',
    category: 'security', supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];
      for (const p of POISONING_PATTERNS) {
        const re = new RegExp(p.source, p.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0]);
      }
      const triggered = matched.length > 0;
      return {
        guardName: 'data-poisoning', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `Data poisoning attempt: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Input attempts to alter AI behavior or inject persistent instructions' } : undefined,
      };
    },
  };
}
