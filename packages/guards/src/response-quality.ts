import type { Guard, GuardContext, GuardResult } from 'open-guardrail-core';

interface ResponseQualityOptions {
  action: 'block' | 'warn';
  /** Minimum character count. Default: 10. */
  minLength?: number;
  /** Maximum ratio of repeated sentences. Default: 0.5. */
  maxRepetitionRatio?: number;
  /** Detect refusal/cop-out phrases. Default: true. */
  detectRefusal?: boolean;
}

const REFUSAL_PATTERNS = [
  /^I(?:'m| am) (?:sorry|afraid),? (?:but )?I (?:can'?t|cannot|am unable to)/i,
  /^As an AI(?: language model)?,? I (?:can'?t|cannot|don'?t)/i,
  /^I (?:do not|don'?t) have (?:the ability|access|enough)/i,
  /^Unfortunately,? I (?:can'?t|cannot|am unable)/i,
  /^I'?m not able to/i,
];

function computeRepetitionRatio(text: string): number {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 5);

  if (sentences.length < 2) return 0;

  const unique = new Set(sentences);
  return 1 - unique.size / sentences.length;
}

export function responseQuality(options: ResponseQualityOptions): Guard {
  const minLength = options.minLength ?? 10;
  const maxRepetitionRatio = options.maxRepetitionRatio ?? 0.5;
  const detectRefusal = options.detectRefusal ?? true;

  return {
    name: 'response-quality',
    version: '1.0.0',
    description: 'Check response quality: too short, repetitive, or refusal',
    category: 'content',
    supportedStages: ['output'],

    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (text.trim().length < minLength) {
        issues.push(`too-short (${text.trim().length} chars, min ${minLength})`);
      }

      const repRatio = computeRepetitionRatio(text);
      if (repRatio > maxRepetitionRatio) {
        issues.push(`repetitive (${(repRatio * 100).toFixed(0)}% duplicated sentences)`);
      }

      if (detectRefusal) {
        const firstLine = text.split('\n')[0];
        if (REFUSAL_PATTERNS.some((p) => p.test(firstLine))) {
          issues.push('refusal-detected');
        }
      }

      const detected = issues.length > 0;
      return {
        guardName: 'response-quality',
        passed: !detected,
        action: detected ? options.action : 'allow',
        score: detected ? Math.min(issues.length / 3, 1.0) : 0,
        message: detected ? `Quality issues: ${issues.join('; ')}` : undefined,
        details: detected ? { issues, repetitionRatio: repRatio } : undefined,
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}
