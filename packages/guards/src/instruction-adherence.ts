import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface InstructionAdherenceOptions {
  action: 'block' | 'warn';
  requiredPhrases?: string[];
  forbiddenPhrases?: string[];
  maxLength?: number;
  mustStartWith?: string;
  mustEndWith?: string;
}

export function instructionAdherence(options: InstructionAdherenceOptions): Guard {
  return {
    name: 'instruction-adherence',
    version: '0.1.0',
    description: 'Verify LLM response follows specific output instructions',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];
      const trimmed = text.trim();

      if (options.requiredPhrases) {
        const lower = trimmed.toLowerCase();
        for (const phrase of options.requiredPhrases) {
          if (!lower.includes(phrase.toLowerCase())) {
            violations.push(`Missing required phrase: "${phrase}"`);
          }
        }
      }
      if (options.forbiddenPhrases) {
        const lower = trimmed.toLowerCase();
        for (const phrase of options.forbiddenPhrases) {
          if (lower.includes(phrase.toLowerCase())) {
            violations.push(`Contains forbidden phrase: "${phrase}"`);
          }
        }
      }
      if (options.maxLength !== undefined && trimmed.length > options.maxLength) {
        violations.push(`Length ${trimmed.length} exceeds max ${options.maxLength}`);
      }
      if (options.mustStartWith && !trimmed.startsWith(options.mustStartWith)) {
        violations.push(`Must start with: "${options.mustStartWith}"`);
      }
      if (options.mustEndWith && !trimmed.endsWith(options.mustEndWith)) {
        violations.push(`Must end with: "${options.mustEndWith}"`);
      }

      const triggered = violations.length > 0;
      return {
        guardName: 'instruction-adherence',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? violations.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations, reason: 'Response does not follow output format instructions' } : undefined,
      };
    },
  };
}
