import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type CaseType = 'uppercase' | 'lowercase' | 'title-case' | 'sentence-case';

interface CaseValidationOptions {
  action: 'block' | 'warn';
  expectedCase: CaseType;
}

function checkCase(text: string, expected: CaseType): boolean {
  const stripped = text.replace(/[^a-zA-Z\s]/g, '').trim();
  if (stripped.length === 0) return true;

  switch (expected) {
    case 'uppercase':
      return stripped === stripped.toUpperCase();
    case 'lowercase':
      return stripped === stripped.toLowerCase();
    case 'title-case': {
      const words = stripped.split(/\s+/);
      return words.every((w) => w.length === 0 || w[0] === w[0].toUpperCase());
    }
    case 'sentence-case': {
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      return sentences.every((s) => {
        const trimmed = s.trim();
        if (trimmed.length === 0) return true;
        return trimmed[0] === trimmed[0].toUpperCase();
      });
    }
  }
}

export function caseValidation(options: CaseValidationOptions): Guard {
  return {
    name: 'case-validation',
    version: '0.1.0',
    description: 'Validate text case format (upper/lower/title/sentence)',
    category: 'format',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const isValid = checkCase(text, options.expectedCase);

      return {
        guardName: 'case-validation',
        passed: isValid,
        action: isValid ? 'allow' : options.action,
        latencyMs: Math.round(performance.now() - start),
        details: isValid
          ? undefined
          : { expected: options.expectedCase },
      };
    },
  };
}
