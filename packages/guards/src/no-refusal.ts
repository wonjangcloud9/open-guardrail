import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface NoRefusalOptions {
  action: 'block' | 'warn';
  customPatterns?: string[];
}

const REFUSAL_PATTERNS: RegExp[] = [
  /I('m| am) (sorry|afraid|unable)/gi,
  /I can('t|not) (help|assist|provide|do that|generate|create)/gi,
  /I('m| am) not (able|allowed|permitted)/gi,
  /as an AI( language model)?[,.]? I/gi,
  /I don't have (the ability|access|permission)/gi,
  /I (must|have to) (decline|refuse|refrain)/gi,
  /that('s| is) (not something I|beyond my|outside my)/gi,
  /I (cannot|can't) (fulfill|comply|assist with)/gi,
  /my (guidelines|programming|instructions) (prevent|don't allow|prohibit)/gi,
  /I('m| am) designed to (not|avoid|refrain)/gi,
  /I (will not|won't) (help|assist|provide|generate)/gi,
  /against my (guidelines|policy|programming)/gi,
];

export function noRefusal(options: NoRefusalOptions): Guard {
  const patterns = [...REFUSAL_PATTERNS];

  if (options.customPatterns) {
    for (const p of options.customPatterns) {
      patterns.push(new RegExp(p, 'gi'));
    }
  }

  return {
    name: 'no-refusal',
    version: '0.1.0',
    description: 'Detect LLM refusal responses',
    category: 'content',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of patterns) {
        const re = new RegExp(pattern.source, pattern.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0]);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'no-refusal',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
