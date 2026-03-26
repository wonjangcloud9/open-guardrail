import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ValidChoiceOptions {
  action: 'block' | 'warn';
  choices: string[];
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
}

export function validChoice(options: ValidChoiceOptions): Guard {
  const caseSensitive = options.caseSensitive ?? false;
  const trimWs = options.trimWhitespace ?? true;

  const normalizedChoices = options.choices.map((c) => {
    let val = trimWs ? c.trim() : c;
    return caseSensitive ? val : val.toLowerCase();
  });

  return {
    name: 'valid-choice',
    version: '0.1.0',
    description: 'Validate text is one of allowed choices',
    category: 'format',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      let normalizedText = trimWs ? text.trim() : text;
      normalizedText = caseSensitive ? normalizedText : normalizedText.toLowerCase();

      const isValid = normalizedChoices.includes(normalizedText);

      return {
        guardName: 'valid-choice',
        passed: isValid,
        action: isValid ? 'allow' : options.action,
        latencyMs: Math.round(performance.now() - start),
        details: isValid
          ? undefined
          : { received: text.trim(), allowedChoices: options.choices },
      };
    },
  };
}
